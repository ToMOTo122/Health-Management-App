const pool = require('../utils/recordDb');
const { serializeRowDates, serializeRows } = require('../utils/recordDates');

// Factory for record CRUD operations on a given table.
// Each table must have: id, user_id, record_date
function makeRecordService(tableName, dateField = 'record_date') {
  return {
    async create(userId, data) {
      const fields = Object.keys(data);
      const placeholders = fields.map(() => '?').join(', ');
      const values = fields.map((k) => data[k]);

      const [result] = await pool.query(
        `INSERT INTO ${tableName} (user_id, ${fields.join(', ')}) VALUES (?, ${placeholders})`,
        [userId, ...values]
      );

      const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [result.insertId]);
      return serializeRowDates(rows[0]);
    },

    async query(userId, { date, from, to, limit = 30, offset = 0 }) {
      let sql = `SELECT * FROM ${tableName} WHERE user_id = ?`;
      const values = [userId];

      if (date) {
        sql += ` AND ${dateField} = ?`;
        values.push(date);
      }
      if (from) {
        sql += ` AND ${dateField} >= ?`;
        values.push(from);
      }
      if (to) {
        sql += ` AND ${dateField} <= ?`;
        values.push(to);
      }

      sql += ` ORDER BY ${dateField} DESC, id DESC LIMIT ? OFFSET ?`;
      const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 200);
      const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);
      values.push(safeLimit, safeOffset);

      const [rows] = await pool.query(sql, values);
      return serializeRows(rows);
    },

    async getById(userId, id) {
      const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ? AND user_id = ?`, [id, userId]);
      if (rows.length === 0) {
        throw Object.assign(new Error('记录不存在'), { code: 'NOT_FOUND', status: 404 });
      }
      return serializeRowDates(rows[0]);
    },

    async update(userId, id, data) {
      const [existing] = await pool.query(`SELECT id FROM ${tableName} WHERE id = ? AND user_id = ?`, [id, userId]);
      if (existing.length === 0) {
        throw Object.assign(new Error('记录不存在'), { code: 'NOT_FOUND', status: 404 });
      }

      const sets = [];
      const values = [];
      for (const [key, value] of Object.entries(data)) {
        sets.push(`${key} = ?`);
        values.push(value);
      }

      if (sets.length === 0) {
        return this.getById(userId, id);
      }

      values.push(id);
      await pool.query(`UPDATE ${tableName} SET ${sets.join(', ')} WHERE id = ?`, values);

      return this.getById(userId, id);
    },

    async delete(userId, id) {
      const [existing] = await pool.query(`SELECT id FROM ${tableName} WHERE id = ? AND user_id = ?`, [id, userId]);
      if (existing.length === 0) {
        throw Object.assign(new Error('记录不存在'), { code: 'NOT_FOUND', status: 404 });
      }

      await pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    },
  };
}

module.exports = { makeRecordService };
