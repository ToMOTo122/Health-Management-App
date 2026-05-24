function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_JSON', message: '请求体 JSON 格式错误' },
    });
  }

  const status = err.status || 500;
  const message = status === 500 ? '服务器内部错误' : err.message;

  res.status(status).json({
    success: false,
    error: { code: err.code || 'SERVER_ERROR', message },
  });
}

module.exports = errorHandler;
