// app.config.js
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra || {}),
    ANALYZER_URL: "https://fitcoach-ai-server.onrender.com",
    ADVICE_URL:   "https://fitcoach-ai-server.onrender.com",
  },
});
