const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://rpbazaar.xyz',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '', // Remove /api prefix when forwarding
      },
    })
  );
};
