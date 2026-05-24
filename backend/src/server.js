const app = require('./app');
const pool = require('./config/db');
const redis = require('./config/redis');
const reminderService = require('./services/reminder.service');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Test MySQL connection
    const conn = await pool.getConnection();
    console.log('MySQL connected');
    conn.release();

    // Test Redis connection
    await redis.ping();
    console.log('Redis ready');

    // Schedule all reminders
    await reminderService.scheduleAll();
    console.log('Reminders scheduled');

    // Poll for due reminders every 60 seconds
    setInterval(async () => {
      try {
        const due = await reminderService.getDue();
        if (due.length > 0) {
          console.log(`${due.length} reminder(s) due:`, due.map((r) => `${r.type}@${r.time_of_day}`));
        }
      } catch (_) {
        // Ignore polling errors
      }
    }, 60000);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
