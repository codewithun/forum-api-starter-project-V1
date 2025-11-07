const routes = require('./routes');
const ThreadsHandler = require('./handler');

module.exports = {
  name: 'threads',
  register: async (server, { container }) => {
    console.log('📦 Registering threads plugin...');
    const threadsHandler = new ThreadsHandler(container);
    server.route(routes(threadsHandler));
    console.log('✅ Threads routes registered.');
  },
};
