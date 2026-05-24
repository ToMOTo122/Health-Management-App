const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  return res.status(400).json({
    success: false,
    error: { code: 'VALIDATION_ERROR', message: '输入数据验证失败', details },
  });
}

module.exports = validate;
