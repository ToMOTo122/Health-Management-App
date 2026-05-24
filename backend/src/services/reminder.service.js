const pool = require('../config/db');
const redis = require('../config/redis');

const reminderService = {
  async list(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM reminders WHERE user_id = ? ORDER BY time_of_day ASC',
      [userId]
    );
    return rows;
  },

  async create(userId, { type, time_of_day }) {
    if (!['water', 'sleep', 'exercise', 'record'].includes(type)) {
      throw Object.assign(new Error('提醒类型无效'), { code: 'VALIDATION_ERROR', status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO reminders (user_id, type, time_of_day) VALUES (?, ?, ?)',
      [userId, type, time_of_day]
    );

    const [rows] = await pool.query('SELECT * FROM reminders WHERE id = ?', [result.insertId]);
    await this._scheduleReminder(userId, rows[0]);

    return rows[0];
  },

  async update(userId, id, fields) {
    const [existing] = await pool.query('SELECT * FROM reminders WHERE id = ? AND user_id = ?', [id, userId]);
    if (existing.length === 0) {
      throw Object.assign(new Error('提醒不存在'), { code: 'NOT_FOUND', status: 404 });
    }

    const sets = [];
    const values = [];
    for (const [key, value] of Object.entries(fields)) {
      if (['type', 'time_of_day', 'is_active'].includes(key)) {
        sets.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (sets.length > 0) {
      values.push(id);
      await pool.query(`UPDATE reminders SET ${sets.join(', ')} WHERE id = ?`, values);
    }

    const [rows] = await pool.query('SELECT * FROM reminders WHERE id = ?', [id]);
    await this._scheduleReminder(userId, rows[0]);

    return rows[0];
  },

  async delete(userId, id) {
    const [existing] = await pool.query('SELECT * FROM reminders WHERE id = ? AND user_id = ?', [id, userId]);
    if (existing.length === 0) {
      throw Object.assign(new Error('提醒不存在'), { code: 'NOT_FOUND', status: 404 });
    }

    await pool.query('DELETE FROM reminders WHERE id = ?', [id]);

    // Remove from Redis schedule
    await redis.zrem('reminders_due', `${id}`);
  },

  async getDue() {
    const now = Date.now();
    const due = await redis.zrangebyscore('reminders_due', 0, now);

    const results = [];
    for (const member of due) {
      try {
        const data = JSON.parse(member);
        results.push(data);

        // Remove from queue (will be rescheduled next day)
        await redis.zrem('reminders_due', member);
      } catch (_) {
        await redis.zrem('reminders_due', member);
      }
    }

    return results;
  },

  async scheduleAll() {
    // Reschedule all active reminders — call on server start
    try {
      await redis.del('reminders_due');

      const [rows] = await pool.query(
        'SELECT * FROM reminders WHERE is_active = 1'
      );

      for (const reminder of rows) {
        await this._scheduleReminder(reminder.user_id, reminder);
      }
    } catch (_) {
      // Redis might not be available
    }
  },

  async _scheduleReminder(userId, reminder) {
    if (!reminder.is_active) {
      await redis.zrem('reminders_due', `${reminder.id}`);
      return;
    }

    // Calculate next due timestamp from time_of_day
    const now = new Date();
    const [hours, minutes] = reminder.time_of_day.split(':').map(Number);

    const dueDate = new Date(now);
    dueDate.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (dueDate <= now) {
      dueDate.setDate(dueDate.getDate() + 1);
    }

    const member = JSON.stringify({
      id: reminder.id,
      userId,
      type: reminder.type,
      time_of_day: reminder.time_of_day,
    });

    await redis.zadd('reminders_due', dueDate.getTime(), member);
  },
};

module.exports = reminderService;
