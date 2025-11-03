const createServer = require('./Infrastructures/http/createServer');
const container = require('./Infrastructures/container');

let cachedServer;

/**
 * Serverless handler untuk Vercel
 */
module.exports = async (req, res) => {
  try {
    // Inisialisasi hanya sekali (biar gak reinit tiap request)
    if (!cachedServer) {
      console.log('🚀 Initializing Hapi server...');
      const server = await createServer(container);
      await server.initialize(); // <- gunakan initialize() di serverless
      cachedServer = server; // simpan instance server, bukan function
      console.log('✅ Hapi server initialized (serverless mode)');
    }

    // Gunakan listener dari Hapi untuk menangani request/res
    cachedServer.listener(req, res);
  } catch (err) {
    console.error('❌ Failed to start serverless function:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ status: 'error', message: err.message }));
  }
};

/**
 * Mode lokal (jalankan manual dengan npm run start)
 */
if (require.main === module) {
  (async () => {
    const server = await createServer(container);
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
  })();
}
