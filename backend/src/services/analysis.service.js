const pool = require('../config/db');
const redis = require('../config/redis');

const RECORD_TABLES = {
  sleep: { table: 'sleep_records', valueField: 'duration_h' },
  steps: { table: 'steps_records', valueField: 'steps' },
  water: { table: 'water_records', valueField: 'amount_ml' },
  exercise: { table: 'exercise_records', valueField: 'duration_min', calField: 'calories_kcal' },
  diet: { table: 'diet_records', valueField: 'calories_kcal' },
  calories: { table: 'diet_records', valueField: 'calories_kcal' },
};

const analysisService = {
  async getTodayStats(userId) {
    const today = new Date().toISOString().split('T')[0];

    // Try cache first
    const cacheKey = `daily_stats:${userId}:${today}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const stats = await this._computeTodayStats(userId, today);

    // Cache for 1 hour
    await redis.set(cacheKey, JSON.stringify(stats), 'EX', 3600);

    return stats;
  },

  async _computeTodayStats(userId, date) {
    const queries = {
      sleep: `SELECT COALESCE(SUM(duration_h), 0) as value FROM sleep_records WHERE user_id = ? AND record_date = ?`,
      steps: `SELECT COALESCE(SUM(steps), 0) as value FROM steps_records WHERE user_id = ? AND record_date = ?`,
      water: `SELECT COALESCE(SUM(amount_ml), 0) as value FROM water_records WHERE user_id = ? AND record_date = ?`,
      exercise: `SELECT COALESCE(SUM(duration_min), 0) as value, COALESCE(SUM(calories_kcal), 0) as calories FROM exercise_records WHERE user_id = ? AND record_date = ?`,
      diet: `SELECT COALESCE(SUM(calories_kcal), 0) as value FROM diet_records WHERE user_id = ? AND record_date = ?`,
    };

    const [sleepRows] = await pool.query(queries.sleep, [userId, date]);
    const [stepsRows] = await pool.query(queries.steps, [userId, date]);
    const [waterRows] = await pool.query(queries.water, [userId, date]);
    const [exRows] = await pool.query(queries.exercise, [userId, date]);
    const [dietRows] = await pool.query(queries.diet, [userId, date]);

    return {
      sleep_h: parseFloat(sleepRows[0].value) || 0,
      steps: parseInt(stepsRows[0].value) || 0,
      water_ml: parseInt(waterRows[0].value) || 0,
      exercise_min: parseInt(exRows[0].value) || 0,
      calories_kcal: parseInt(exRows[0].calories || 0) + parseInt(dietRows[0].value || 0),
    };
  },

  async getSummary(userId, period) {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;

    // Try cache
    const cacheKey = `summary:${userId}:${period}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const from = fromDate.toISOString().split('T')[0];

    const [sleepRows] = await pool.query(
      'SELECT COUNT(*) as count, COALESCE(AVG(duration_h), 0) as avg FROM sleep_records WHERE user_id = ? AND record_date >= ?',
      [userId, from]
    );
    const [stepsRows] = await pool.query(
      'SELECT COUNT(*) as count, COALESCE(AVG(steps), 0) as avg FROM steps_records WHERE user_id = ? AND record_date >= ?',
      [userId, from]
    );
    const [waterRows] = await pool.query(
      'SELECT COALESCE(SUM(amount_ml), 0) as total, COUNT(DISTINCT record_date) as days FROM water_records WHERE user_id = ? AND record_date >= ?',
      [userId, from]
    );
    const [exRows] = await pool.query(
      'SELECT COALESCE(SUM(duration_min), 0) as total_min, COALESCE(SUM(calories_kcal), 0) as total_cal FROM exercise_records WHERE user_id = ? AND record_date >= ?',
      [userId, from]
    );
    const [dietRows] = await pool.query(
      'SELECT COALESCE(SUM(calories_kcal), 0) as total FROM diet_records WHERE user_id = ? AND record_date >= ?',
      [userId, from]
    );

    // Goal achievement
    const [goals] = await pool.query('SELECT * FROM health_goals WHERE user_id = ?', [userId]);
    const goal = goals[0] || {};

    const [waterGoalRows] = await pool.query(
      `SELECT COUNT(*) as days FROM (
        SELECT record_date, SUM(amount_ml) as total
        FROM water_records
        WHERE user_id = ? AND record_date >= ?
        GROUP BY record_date
        HAVING total >= ?
      ) t`,
      [userId, from, goal.water_ml || 2000]
    );

    const summary = {
      period,
      days: days,
      avg_sleep: Math.round(sleepRows[0].avg * 10) / 10,
      avg_steps: Math.round(stepsRows[0].avg),
      avg_water: Math.round(waterRows[0].total / Math.max(waterRows[0].days, 1)),
      total_exercise_min: exRows[0].total_min,
      total_exercise_cal: exRows[0].total_cal,
      total_diet_cal: dietRows[0].total,
      water_goal_days: waterGoalRows[0].days,
      water_total_days: waterRows[0].days,
      total_records: sleepRows[0].count + stepsRows[0].count,
    };

    // Cache for 10 minutes
    await redis.set(cacheKey, JSON.stringify(summary), 'EX', 600);

    return summary;
  },

  async getTrend(userId, type, period) {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const tableInfo = RECORD_TABLES[type];
    if (!tableInfo) return { labels: [], values: [] };

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const from = fromDate.toISOString().split('T')[0];

    const { table, valueField } = tableInfo;
    const [rows] = await pool.query(
      `SELECT record_date, SUM(${valueField}) as value
       FROM ${table}
       WHERE user_id = ? AND record_date >= ?
       GROUP BY record_date
       ORDER BY record_date ASC`,
      [userId, from]
    );

    // Fill missing dates with 0
    const dataMap = {};
    for (const row of rows) {
      dataMap[row.record_date.toISOString().split('T')[0]] = Math.round(row.value * 10) / 10;
    }

    const labels = [];
    const values = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      labels.push(dateStr);
      values.push(dataMap[dateStr] || 0);
    }

    return { labels, values };
  },

  async getGoalStatus(userId) {
    const today = new Date().toISOString().split('T')[0];
    const stats = await this.getTodayStats(userId);
    const [goals] = await pool.query('SELECT * FROM health_goals WHERE user_id = ?', [userId]);
    const goal = goals[0] || {};

    return {
      sleep: { current: stats.sleep_h, target: goal.sleep_hours || 8, percent: Math.min(100, Math.round((stats.sleep_h / (goal.sleep_hours || 8)) * 100)) },
      steps: { current: stats.steps, target: goal.steps_daily || 10000, percent: Math.min(100, Math.round((stats.steps / (goal.steps_daily || 10000)) * 100)) },
      water: { current: stats.water_ml, target: goal.water_ml || 2000, percent: Math.min(100, Math.round((stats.water_ml / (goal.water_ml || 2000)) * 100)) },
      exercise: { current: stats.exercise_min, target: goal.exercise_min || 30, percent: Math.min(100, Math.round((stats.exercise_min / (goal.exercise_min || 30)) * 100)) },
      calories: { current: stats.calories_kcal, target: goal.calories_kcal || 2000, percent: Math.min(100, Math.round((stats.calories_kcal / (goal.calories_kcal || 2000)) * 100)) },
    };
  },

  async getWeeklyReport(userId) {
    const summary = await this.getSummary(userId, 'week');
    const [goals] = await pool.query('SELECT * FROM health_goals WHERE user_id = ?', [userId]);

    const g = goals[0] || { sleep_hours: 8, steps_daily: 10000, water_ml: 2000 };

    return {
      text: `📊 过去7天健康数据总结：
• 平均每日睡眠：${summary.avg_sleep} 小时（目标：${g.sleep_hours}h）
• 平均每日步数：${summary.avg_steps} 步（目标：${g.steps_daily}）
• 平均每日饮水：${summary.avg_water} ml（目标：${g.water_ml}ml）
• 饮水达标天数：${summary.water_goal_days}/${summary.water_total_days} 天
• 总运动时长：${summary.total_exercise_min} 分钟
• 共记录 ${summary.total_records} 条健康数据`,
      summary,
    };
  },
};

module.exports = analysisService;
