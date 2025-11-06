const AuthenticationTokenManager = require('../../Applications/security/AuthenticationTokenManager');
const InvariantError = require('../../Commons/exceptions/InvariantError');

class JwtTokenManager extends AuthenticationTokenManager {
  constructor(jwt) {
    super();
    this._jwt = jwt;
  }

  async createAccessToken(payload) {
    const key = process.env.ACCESS_TOKEN_KEY || (process.env.NODE_ENV === 'test' ? 'test_access_key' : undefined);
    return this._jwt.generate(payload, key);
  }

  async createRefreshToken(payload) {
    const key = process.env.REFRESH_TOKEN_KEY || (process.env.NODE_ENV === 'test' ? 'test_refresh_key' : undefined);
    return this._jwt.generate(payload, key);
  }

  async verifyRefreshToken(token) {
    try {
      const artifacts = this._jwt.decode(token);
      const key = process.env.REFRESH_TOKEN_KEY || (process.env.NODE_ENV === 'test' ? 'test_refresh_key' : undefined);
      this._jwt.verify(artifacts, key);
    } catch (error) {
      throw new InvariantError('refresh token tidak valid');
    }
  }

  async decodePayload(token) {
    const artifacts = this._jwt.decode(token);
    return artifacts.decoded.payload;
  }
}

module.exports = JwtTokenManager;
