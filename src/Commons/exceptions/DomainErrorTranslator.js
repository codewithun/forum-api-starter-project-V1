const InvariantError = require('./InvariantError');
const NotFoundError = require('./NotFoundError');
const AuthenticationError = require('./AuthenticationError');
const AuthorizationError = require('./AuthorizationError');
const ClientError = require('./ClientError');

const DomainErrorTranslator = {
  translate(error) {
    // Coba cocokkan ke direktori
    const translated = DomainErrorTranslator._directories[error.message];
    if (translated) return translated;

    // Kalau sudah instance ClientError (termasuk InvariantError / NotFoundError)
    if (error instanceof ClientError) return error;

    // Kalau tidak dikenal, kembalikan apa adanya
    return error;
  },
};

// ✅ Lengkapkan semua pesan penting yang digunakan di test Dicoding
DomainErrorTranslator._directories = {
  // === User ===
  'REGISTER_USER.NOT_CONTAIN_NEEDED_PROPERTY': new InvariantError(
    'tidak dapat membuat user baru karena properti yang dibutuhkan tidak ada'
  ),
  'REGISTER_USER.NOT_MEET_DATA_TYPE_SPECIFICATION': new InvariantError(
    'tidak dapat membuat user baru karena tipe data tidak sesuai'
  ),
  'REGISTER_USER.USERNAME_LIMIT_CHAR': new InvariantError(
    'tidak dapat membuat user baru karena karakter username melebihi batas limit'
  ),
  'REGISTER_USER.USERNAME_CONTAIN_RESTRICTED_CHARACTER': new InvariantError(
    'tidak dapat membuat user baru karena username mengandung karakter terlarang'
  ),

  // === Auth ===
  'USER_LOGIN.NOT_CONTAIN_NEEDED_PROPERTY': new InvariantError('harus mengirimkan username dan password'),
  'USER_LOGIN.NOT_MEET_DATA_TYPE_SPECIFICATION': new InvariantError('username dan password harus string'),
  'REFRESH_AUTHENTICATION_USE_CASE.NOT_CONTAIN_REFRESH_TOKEN': new InvariantError('harus mengirimkan token refresh'),
  'REFRESH_AUTHENTICATION_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION': new InvariantError('refresh token harus string'),
  'DELETE_AUTHENTICATION_USE_CASE.NOT_CONTAIN_REFRESH_TOKEN': new InvariantError('harus mengirimkan token refresh'),
  'DELETE_AUTHENTICATION_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION': new InvariantError('refresh token harus string'),

  // === Thread / Comment / Reply ===
  'ADD_THREAD.NOT_CONTAIN_NEEDED_PROPERTY': new InvariantError(
    'tidak dapat membuat thread karena properti yang dibutuhkan tidak ada'
  ),
  'ADD_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION': new InvariantError(
    'tidak dapat membuat thread karena tipe data tidak sesuai'
  ),
  'ADD_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY': new InvariantError(
    'tidak dapat menambahkan komentar karena properti yang dibutuhkan tidak ada'
  ),
  'ADD_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION': new InvariantError(
    'tidak dapat menambahkan komentar karena tipe data tidak sesuai'
  ),

  // Tambahan biar error umum juga ditangani dengan benar
  'REGISTER_USER.USERNAME_NOT_AVAILABLE': new InvariantError('username tidak tersedia'),
  'REPLY.NOT_FOUND': new NotFoundError('balasan tidak ditemukan'),
  'THREAD.NOT_FOUND': new NotFoundError('thread tidak ditemukan'),
  'COMMENT.NOT_FOUND': new NotFoundError('komentar tidak ditemukan'),
};

module.exports = DomainErrorTranslator;
