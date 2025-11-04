const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const ClientError = require('../../Commons/exceptions/ClientError');
const DomainErrorTranslator = require('../../Commons/exceptions/DomainErrorTranslator');
const users = require('../../Interfaces/http/api/users');
const authentications = require('../../Interfaces/http/api/authentications');
const threads = require('../../Interfaces/http/api/threads');

const createServer = async (container) => {
  const isVercel = process.env.VERCEL === '1';

  const server = Hapi.server({
    port: isVercel ? undefined : process.env.PORT || 5000,
    host: isVercel ? undefined : process.env.HOST || 'localhost',
    routes: {
      cors: { origin: ['*'] },
    },
  });

  // === JWT Authentication ===
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

  // Note: Rate limiting is enforced at the NGINX layer in production.
  // We intentionally do not enable an app-level rate limiter here to keep tests deterministic.

  // === Register API Plugins ===
  await server.register([
    { plugin: users, options: { container } },
    { plugin: authentications, options: { container } },
    { plugin: threads, options: { container } },
  ]);

  // === Global Error Handler ===
  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      const translatedError = DomainErrorTranslator.translate(response);

      // 1) Known client-side/domain errors -> "fail"
      if (translatedError instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: translatedError.message,
        });
        newResponse.code(translatedError.statusCode);
        return newResponse;
      }

      // 1b) If it's a Boom error (framework-level), keep 4xx as-is, wrap 5xx
      if (translatedError && translatedError.isBoom) {
        if (!translatedError.isServer) {
          return h.continue;
        }
        const newResponse = h.response({
          status: 'error',
          message: 'terjadi kegagalan pada server kami',
        });
        newResponse.code(500);
        return newResponse;
      }

      // 2) Non-Boom unexpected errors -> treat as server error
      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }

    // Handle Boom responses not covered above (e.g., framework/auth errors already
    // materialized as Boom and not matching our domain ClientError).
    if (response && response.isBoom) {
      if (!response.isServer) {
        return h.continue;
      }
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
