require('dotenv').config();
const createServer = require('./Infrastructures/http/createServer');
const container = require('./Infrastructures/container');

module.exports = async (req, res) => {
  const server = await createServer(container);

  // Jalankan hanya sekali (jangan .start() terus-menerus)
  if (!server.info.started) {
    await server.initialize();
  }

  await server.listener(req, res);
};
