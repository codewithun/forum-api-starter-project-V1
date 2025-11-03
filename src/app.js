const createServer = require('./Infrastructures/http/createServer');
const container = require('./Infrastructures/container');

let cachedServer;

/**
 * Handler untuk serverless environment (Vercel)
 */
module.exports = async (req, res) => {
  try {
    if (!cachedServer) {
      console.log('🚀 Initializing Hapi server...');
      const server = await createServer(container);
      await server.initialize(); // gunakan initialize() bukan start() di serverless
      cachedServer = server; // simpan instance, bukan listener
      console.log('✅ Hapi server ready (serverless mode)');
    }

    // Gunakan listener dari server Hapi
    return cachedServer.listener(req, res);
  } catch (err) {
    console.error('❌ Failed to start serverless handler:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ status: 'error', message: err.message }));
  }
};

/**
 * Handler untuk lokal development
 */
if (require.main === module) {
  (async () => {
    const server = await createServer(container);
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
  })();
}
