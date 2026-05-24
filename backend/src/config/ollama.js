module.exports = {
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'qwen3:8b',
  timeout: parseInt(process.env.OLLAMA_TIMEOUT) || 30000,
};
