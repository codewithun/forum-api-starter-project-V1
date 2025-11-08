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
        origin: ['*'],
        additionalHeaders: ['Authorization', 'Content-Type'],
        additionalExposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
      },
    },
  });

  // === Middleware untuk logging semua request (debug proxy header, CORS, dll) ===
  server.ext('onRequest', (request, h) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📥 [${request.method.toUpperCase()}] ${request.path}`);
      console.log('🔑 Headers:', request.headers);
    }
    return h.continue;
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

  // === Register Semua Plugin API ===
  await server.register([
    { plugin: users, options: { container } },
    { plugin: authentications, options: { container } },
    { plugin: threads, options: { container } },
    { plugin: comments, options: { container } },
    { plugin: replies, options: { container } },
  ]);

  // === Global Error Handler ===
  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    // Tangani error manual
    if (response instanceof Error) {
      const translatedError = DomainErrorTranslator.translate(response);

      if (translatedError instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: translatedError.message,
        });
        newResponse.code(translatedError.statusCode);
        return newResponse;
      }

      // Jika error adalah Boom bawaan Hapi (termasuk auth error)
      if (response.isBoom) {
        // Jika error authentication hilang karena header Authorization tidak diterima
        if (response.output?.statusCode === 401) {
          console.warn('⚠️  Missing or invalid Authorization header');
        }

        if (!response.isServer) return h.continue;

        const newResponse = h.response({
          status: 'error',
          message: 'terjadi kegagalan pada server kami',
        });
        newResponse.code(500);
        return newResponse;
      }

      // Fallback internal error
      console.error('💥 INTERNAL SERVER ERROR:', response);
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
