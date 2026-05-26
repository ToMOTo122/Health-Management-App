/** 从 axios / 业务错误对象提取用户可读提示 */
export function getApiErrorMessage(err, fallback = '操作失败') {
  const data = err?.response?.data;
  if (data?.error?.message) return data.error.message;
  if (typeof data?.message === 'string') return data.message;
  if (err?.message && err.message !== 'Network Error') return err.message;
  return fallback;
}
