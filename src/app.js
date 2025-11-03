const createServer = require('./Infrastructures/http/createServer');
const container = require('./Infrastructures/container');

let cachedServer;

/**
 * Handler untuk Vercel (Serverless)
 */
module.exports = async (req, res) => {
  try {
    if (!cachedServer) {
      console.log('🚀 Initializing Hapi server...');
      // Buat server instance
      const server = await createServer(container);
      // Initialize tanpa mem-bind port
      await server.initialize();

      // Cache hanya listener-nya, bukan server object
      cachedServer = server.listener;

      console.log('✅ Hapi server initialized for Vercel');
    }

    // Jalankan listener (fungsi native Node.js)
    return cachedServer(req, res);
  } catch (err) {
    console.error('❌ Serverless function failed:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ status: 'error', message: err.message }));
  }
};

/**
 * Jalankan server secara lokal
 */
if (require.main === module) {
  (async () => {
    const server = await createServer(container);
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
  })();
}
