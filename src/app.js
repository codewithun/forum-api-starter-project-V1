require('dotenv').config();
const createServer = require('./Infrastructures/http/createServer');
const container = require('./Infrastructures/container');

let cachedServer;

/**
 * Handler untuk Vercel Serverless
 */
module.exports = async (req, res) => {
  try {
    if (!cachedServer) {
      console.log('🚀 Initializing Hapi server (Vercel)...');

      // Buat instance Hapi server
      const server = await createServer(container);

      // Initialize tanpa memanggil start()
      await server.initialize();

      // Cache Hapi server instance, bukan listener
      cachedServer = server;

      console.log('✅ Hapi server ready (serverless mode)');
    }

    // Jalankan request via Node.js HTTP listener
    return cachedServer.listener.emit('request', req, res);
  } catch (err) {
    console.error('❌ Serverless init failed:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ status: 'error', message: err.message }));
  }
};

/**
 * Handler untuk lokal (npm run start)
 */
if (require.main === module) {
  (async () => {
    const server = await createServer(container);
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
  })();
}
