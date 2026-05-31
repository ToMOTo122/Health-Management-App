const pool = require('../config/db');

const userService = {
  async getProfile(userId) {
    const [rows] = await pool.query(
      'SELECT id, email, nickname, gender, age, height_cm, weight_kg, deepseek_api_key, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) {
      throw Object.assign(new Error('用户不存在'), { code: 'USER_NOT_FOUND', status: 404 });
    }
    const profile = rows[0];
    profile.has_deepseek_key = !!profile.deepseek_api_key;
    delete profile.deepseek_api_key;
    return profile;
  },

  async getDeepSeekKey(userId) {
    const [rows] = await pool.query(
      'SELECT deepseek_api_key FROM users WHERE id = ?', [userId]
    );
    return rows[0]?.deepseek_api_key || null;
  },

  async updateProfile(userId, fields) {
    const allowed = ['nickname', 'gender', 'age', 'height_cm', 'weight_kg', 'deepseek_api_key'];
    const sets = [];
    const values = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (sets.length === 0) return this.getProfile(userId);

    values.push(userId);
    await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);

    return this.getProfile(userId);
  },

  async changePassword(userId, oldPassword, newPassword) {
    const bcrypt = require('bcrypt');

    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      throw Object.assign(new Error('用户不存在'), { code: 'USER_NOT_FOUND', status: 404 });
    }

    const match = await bcrypt.compare(oldPassword, rows[0].password);
    if (!match) {
      throw Object.assign(new Error('原密码错误'), { code: 'WRONG_PASSWORD', status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
  },

  async getGoals(userId) {
    const [rows] = await pool.query('SELECT * FROM health_goals WHERE user_id = ?', [userId]);
    if (rows.length === 0) {
      // Create default goals if not exist
      await pool.query('INSERT INTO health_goals (user_id) VALUES (?)', [userId]);
      const [newRows] = await pool.query('SELECT * FROM health_goals WHERE user_id = ?', [userId]);
      return newRows[0];
    }
    return rows[0];
  },

  async updateGoals(userId, fields) {
    const allowed = ['sleep_hours', 'steps_daily', 'water_ml', 'exercise_min', 'calories_kcal'];
    const sets = [];
    const values = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (sets.length === 0) return this.getGoals(userId);

    values.push(userId);
    await pool.query(`UPDATE health_goals SET ${sets.join(', ')} WHERE user_id = ?`, values);

    return this.getGoals(userId);
  },
};

module.exports = userService;
