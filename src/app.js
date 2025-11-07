require('dotenv').config();
const createServer = require('./Infrastructures/http/createServer');
const container = require('./Infrastructures/container');

let cachedServer;

/**
 * ================================
 * 🚀 FOR SERVERLESS (Vercel Mode)
 * ================================
 */
module.exports = async (req, res) => {
  try {
    if (!cachedServer) {
      console.log('🚀 Initializing Hapi server (Vercel mode)...');
      const server = await createServer(container);
      await server.initialize(); // Initialize tanpa listen()
      cachedServer = server;
      console.log('✅ Hapi server ready in serverless mode');
    }

    return cachedServer.listener.emit('request', req, res);
  } catch (err) {
    console.error('❌ Serverless init failed:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ status: 'error', message: err.message }));
  }
};

/**
 * =======================================
 * 🖥️ FOR LOCAL / VPS (PM2 / NODE START)
 * =======================================
 */
if (require.main === module || process.env.NODE_ENV === 'production') {
  (async () => {
    try {
      const server = await createServer(container);
      await server.start();
      console.log(`✅ Server running at: ${server.info.uri}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    } catch (err) {
      console.error('💥 Failed to start server:', err);
      process.exit(1);
    }
  })();
}
