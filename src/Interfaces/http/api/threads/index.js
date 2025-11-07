const routes = require('./routes');
const ThreadsHandler = require('./handler');

module.exports = {
  name: 'threads',
  register: async (server, { container }) => {
    console.log('📦 Registering threads plugin...');
    const threadsHandler = new ThreadsHandler(container);
    const routeDefs = routes(threadsHandler);

    console.log('🧩 Routes threads terdaftar:', routeDefs.map(r => `${r.method} ${r.path}`));
    server.route(routeDefs);

    console.log('✅ Threads routes registered.');
  },
};
