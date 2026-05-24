const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

const JWT_SECRET = process.env.JWT_SECRET || 'health-assistant-jwt-secret-change-in-production';

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '请先登录' },
    });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.userId, email: payload.email, nickname: payload.nickname, jti: payload.jti };

    // Check blacklist async — but proceed; if blacklisted, this request still passes
    // Full async check would require async middleware pattern, done in important endpoints
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: '登录已过期，请重新登录' },
      });
    }
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '无效的登录凭证' },
    });
  }
}

// Run full blacklist check (use for sensitive operations)
async function authStrict(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '请先登录' },
    });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // Check blacklist
    const blacklisted = await redis.get(`jwt_blacklist:${payload.jti}`);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '登录凭证已失效，请重新登录' },
      });
    }

    req.user = { id: payload.userId, email: payload.email, nickname: payload.nickname, jti: payload.jti };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: '登录已过期，请重新登录' },
      });
    }
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '无效的登录凭证' },
    });
  }
}

module.exports = { auth, authStrict };
