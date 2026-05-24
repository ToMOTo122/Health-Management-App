function success(res, data, message = 'ok', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

function error(res, code, message, status = 400, details = null) {
  const body = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  return res.status(status).json(body);
}

module.exports = { success, error };
