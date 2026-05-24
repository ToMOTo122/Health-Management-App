const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const redis = require('../config/redis');

const JWT_SECRET = process.env.JWT_SECRET || 'health-assistant-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const SALT_ROUNDS = 10;

const authService = {
  async register({ email, password, nickname }) {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw Object.assign(new Error('该邮箱已被注册'), { code: 'EMAIL_EXISTS', status: 409 });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)',
      [email, hashed, nickname]
    );

    const userId = result.insertId;

    // Create default health goals
    await pool.query('INSERT INTO health_goals (user_id) VALUES (?)', [userId]);

    const token = this._signToken(userId, email, nickname);
    const refreshToken = this._signRefreshToken(userId);

    return {
      token,
      refreshToken,
      user: { id: userId, email, nickname },
    };
  },

  async login({ email, password }) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      throw Object.assign(new Error('邮箱或密码错误'), { code: 'INVALID_CREDENTIALS', status: 401 });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw Object.assign(new Error('邮箱或密码错误'), { code: 'INVALID_CREDENTIALS', status: 401 });
    }

    const token = this._signToken(user.id, user.email, user.nickname);
    const refreshToken = this._signRefreshToken(user.id);

    return {
      token,
      refreshToken,
      user: { id: user.id, email: user.email, nickname: user.nickname },
    };
  },

  async refresh(refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, JWT_SECRET);

      // Check refresh token in Redis
      const stored = await redis.get(`refresh:${payload.userId}:${payload.jti}`);
      if (!stored) {
        throw Object.assign(new Error('刷新令牌已失效'), { code: 'REFRESH_EXPIRED', status: 401 });
      }

      const data = JSON.parse(stored);
      const token = this._signToken(payload.userId, data.email, data.nickname);

      return { token };
    } catch (err) {
      if (err.code) throw err;
      throw Object.assign(new Error('无效的刷新令牌'), { code: 'INVALID_REFRESH', status: 401 });
    }
  },

  async logout(jti, userId) {
    // Blacklist the access token
    if (jti) {
      const ttl = 2 * 60 * 60; // 2 hours
      await redis.set(`jwt_blacklist:${jti}`, '1', 'EX', ttl);
    }

    // Remove refresh tokens for this user
    const keys = await redis.keys(`refresh:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  async getProfile(userId) {
    const [rows] = await pool.query(
      'SELECT id, email, nickname, gender, age, height_cm, weight_kg, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) {
      throw Object.assign(new Error('用户不存在'), { code: 'USER_NOT_FOUND', status: 404 });
    }

    const [goals] = await pool.query('SELECT * FROM health_goals WHERE user_id = ?', [userId]);

    return { ...rows[0], goals: goals[0] || null };
  },

  _signToken(userId, email, nickname) {
    const jti = uuidv4();
    return jwt.sign({ userId, email, nickname, jti }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  _signRefreshToken(userId) {
    const jti = uuidv4();
    const token = jwt.sign({ userId, jti, type: 'refresh' }, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    // Store in Redis
    redis.set(`refresh:${userId}:${jti}`, JSON.stringify({ userId }), 'EX', 7 * 24 * 3600);

    return token;
  },
};

module.exports = authService;
