const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const rateLimit = require('hapi-rate-limit');
const ClientError = require('../../Commons/exceptions/ClientError');
const DomainErrorTranslator = require('../../Commons/exceptions/DomainErrorTranslator');
const users = require('../../Interfaces/http/api/users');
const authentications = require('../../Interfaces/http/api/authentications');
const threads = require('../../Interfaces/http/api/threads');

const createServer = async (container) => {
  const isVercel = process.env.VERCEL === '1';
  const isForceLimit = process.env.FORCE_LIMIT === 'true';
  const isTestEnv = process.env.NODE_ENV === 'test'; // ✅ deteksi Jest environment

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

  // === Rate Limiter (aktif di Vercel / FORCE_LIMIT, tapi skip kalau test) ===
  if (!isTestEnv && (isVercel || isForceLimit)) {
    await server.register({
      plugin: rateLimit,
      options: {
        userLimit: 90, // maksimal 90 request per menit per IP
        userCache: { expiresIn: 60 * 1000 },
        pathLimit: false,
      },
    });

    server.ext('onPreHandler', (request, h) => {
      if (request.path.startsWith('/threads')) {
        request.route.settings.plugins['hapi-rate-limit'] = { enabled: true };
      }
      return h.continue;
    });

    console.log(
      `⚡ Rate limit aktif: ${
        isVercel ? 'Vercel Mode' : 'Local Force Mode (FORCE_LIMIT=true)'
      }`
    );
  } else if (isTestEnv) {
    console.log('🧪 Rate limit dimatikan (Jest test environment)');
  }

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

      if (translatedError instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: translatedError.message,
        });
        newResponse.code(translatedError.statusCode);
        return newResponse;
      }

      if (translatedError && translatedError.isBoom) {
        if (!translatedError.isServer) return h.continue;
        const newResponse = h.response({
          status: 'error',
          message: 'terjadi kegagalan pada server kami',
        });
        newResponse.code(500);
        return newResponse;
      }

      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }

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
