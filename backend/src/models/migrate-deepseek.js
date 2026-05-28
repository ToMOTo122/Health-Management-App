const pool = require('../config/db');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('Starting DeepSeek API key migration...');

    const [cols] = await conn.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'deepseek_api_key'"
    );

    if (cols.length === 0) {
      await conn.query(
        "ALTER TABLE users ADD COLUMN deepseek_api_key VARCHAR(255) DEFAULT NULL COMMENT 'DeepSeek API Key (user-owned)'"
      );
      console.log('Added deepseek_api_key column to users table.');
    } else {
      console.log('deepseek_api_key column already exists, skipping.');
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate();
