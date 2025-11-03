const createServer = require('./Infrastructures/http/createServer');
const container = require('./Infrastructures/container');

let cachedServer; // biar gak re-init setiap request di Vercel

module.exports = async (req, res) => {
  if (!cachedServer) {
    const server = await createServer(container);
    cachedServer = server.listener; // <- ini yang penting!
  }

  // Karena Vercel pakai Node.js native HTTP listener
  return cachedServer(req, res);
};

// Jalankan secara lokal (saat NODE_ENV=development)
if (require.main === module) {
  (async () => {
    const server = await createServer(container);
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
  })();
}
