require('dotenv').config();
const createServer = require('./Infrastructures/http/createServer');
const container = require('./Infrastructures/container');

let cachedServer; // simpan instance biar gak reinit tiap request

module.exports = async (req, res) => {
  try {
    // Kalau belum ada instance server, buat baru
    if (!cachedServer) {
      cachedServer = await createServer(container);
      await cachedServer.initialize();
    }

    // Panggil handler request dengan cara resmi dari Hapi
    cachedServer.listener.emit('request', req, res);
  } catch (err) {
    console.error('🔥 Serverless crash:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', message: 'Internal Server Error' }));
  }
};
