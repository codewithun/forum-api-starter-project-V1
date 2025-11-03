require('dotenv').config();
const createServer = require('./Infrastructures/http/createServer');
const container = require('./Infrastructures/container');

let cachedServer; // cache biar gak inisialisasi ulang di tiap request (serverless optimization)

module.exports = async (req, res) => {
  try {
    if (!cachedServer) {
      const server = await createServer(container);
      await server.initialize(); // penting biar .listener tersedia
      cachedServer = server;
    }

    const hapiListener = cachedServer.listener;
    if (typeof hapiListener !== 'function') {
      console.error('listener missing, reinitializing...');
      await cachedServer.initialize();
    }

    return cachedServer.listener(req, res);
  } catch (err) {
    console.error('Serverless crash:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', message: 'Internal Server Error' }));
  }
};
