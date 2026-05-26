/**
 * 健康记录专用连接池：DATE 以 YYYY-MM-DD 字符串返回，便于序列化与重叠校验。
 * 勿在全局 db.js 开启 dateStrings，否则数据分析 getTrend 会 500。
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'SEU_CSE',
  database: process.env.DB_NAME || 'health_assistant',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true,
});

module.exports = pool;
