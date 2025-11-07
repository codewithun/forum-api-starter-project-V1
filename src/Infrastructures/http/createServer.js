const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const ClientError = require('../../Commons/exceptions/ClientError');
const DomainErrorTranslator = require('../../Commons/exceptions/DomainErrorTranslator');

// === Import semua plugin API ===
const users = require('../../Interfaces/http/api/users');
const authentications = require('../../Interfaces/http/api/authentications');
const threads = require('../../Interfaces/http/api/threads');
const comments = require('../../Interfaces/http/api/comments'); 
const replies = require('../../Interfaces/http/api/replies');   

const createServer = async (container) => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'], // biar bisa diakses bebas selama testing
      },
    },
  });

  // === Register JWT Authentication ===
  await server.register(Jwt);

  server.auth.strategy('forum_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE
        ? Number(process.env.ACCESS_TOKEN_AGE)
        : undefined,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: artifacts.decoded.payload,
    }),
  });

  console.log('📦 Registering plugins...');

  // === Register Semua Plugin API ===
  await server.register([
    { plugin: users, options: { container } },
    { plugin: authentications, options: { container } },
    { plugin: threads, options: { container } },
    { plugin: comments, options: { container } }, 
    { plugin: replies, options: { container } },  
  ]);

  console.log('✅ Semua plugin berhasil diregister.');

  // === Global Error Handler ===
  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    // Jika response merupakan error
    if (response instanceof Error) {
      console.error('💥 INTERNAL ERROR:', response);
      const translatedError = DomainErrorTranslator.translate(response);

      // ✅ Jika error berasal dari client (400-an)
      if (translatedError instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: translatedError.message,
        });
        newResponse.code(translatedError.statusCode);
        return newResponse;
      }

      // ✅ Jika error dari Hapi (Boom error)
      if (translatedError && translatedError.isBoom) {
        if (!translatedError.isServer) return h.continue;
        const newResponse = h.response({
          status: 'error',
          message: 'terjadi kegagalan pada server kami',
        });
        newResponse.code(500);
        return newResponse;
      }

      // ✅ Fallback — error server internal
      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }

    // ✅ Jika response Boom tapi bukan Error instance
    if (response && response.isBoom) {
      if (!response.isServer) return h.continue;
      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }

    return h.continue;
  });

  return server;
};

module.exports = createServer;
