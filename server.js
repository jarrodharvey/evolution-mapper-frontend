const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: 'http://10.126.0.2:8000',
  changeOrigin: true,
  headers: {
    'X-API-Key': process.env.REACT_APP_API_KEY || 'demo-key-12345'
  }
}));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});