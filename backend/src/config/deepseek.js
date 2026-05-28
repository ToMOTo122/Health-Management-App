module.exports = {
  baseURL: 'https://api.deepseek.com',
  model: 'deepseek-v4-flash',
  timeout: parseInt(process.env.DEEPSEEK_TIMEOUT) || 30000,
};
