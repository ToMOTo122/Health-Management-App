const pool = require('../config/db');

const TABLES = {
  sleep: 'sleep_records',
  steps: 'steps_records',
  water: 'water_records',
  exercise: 'exercise_records',
  diet: 'diet_records',
  stress: 'stress_records',
  cycle: 'cycle_records',
};

const DATE_FIELD_MAP = {
  cycle: 'start_date',
};

const exportService = {
  async exportJSON(userId) {
    const [profile] = await pool.query(
      'SELECT id, email, nickname, gender, age, height_cm, weight_kg, created_at FROM users WHERE id = ?',
      [userId]
    );

    const [goals] = await pool.query('SELECT * FROM health_goals WHERE user_id = ?', [userId]);

    const data = {
      profile: profile[0] || null,
      goals: goals[0] || null,
      records: {},
    };

    for (const [type, table] of Object.entries(TABLES)) {
      const dateField = DATE_FIELD_MAP[type] || 'record_date';
      const [rows] = await pool.query(
        `SELECT * FROM ${table} WHERE user_id = ? ORDER BY ${dateField} DESC`,
        [userId]
      );
      data.records[type] = rows;
    }

    return data;
  },

  async exportCSV(userId, type) {
    const table = TABLES[type];
    if (!table) return null;

    const [rows] = await pool.query(
      `SELECT * FROM ${table} WHERE user_id = ? ORDER BY record_date DESC`,
      [userId]
    );

    return rows;
  },
};

module.exports = exportService;
