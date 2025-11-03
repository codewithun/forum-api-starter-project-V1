const InvariantError = require('../../Commons/exceptions/InvariantError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addThread(addThread) {
    const { title, body, owner } = addThread;
    const id = `thread-${this._idGenerator()}`;
    const date = new Date().toISOString();
    const query = {
      text: 'INSERT INTO threads (id, title, body, owner, date) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, owner',
      values: [id, title, body, owner, date],
    };
    const result = await this._pool.query(query);
    return result.rows[0];
  }

  async verifyThreadExists(threadId) {
    const query = { text: 'SELECT id FROM threads WHERE id = $1', values: [threadId] };
    const result = await this._pool.query(query);
    if (!result.rowCount) throw new NotFoundError('thread tidak ditemukan');
  }

  async getThreadById(threadId) {
    const query = {
      text: `SELECT t.id, t.title, t.body, t.date, u.username
             FROM threads t JOIN users u ON u.id = t.owner
             WHERE t.id = $1`,
      values: [threadId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) throw new NotFoundError('thread tidak ditemukan');

    return result.rows[0];
  }
}

module.exports = ThreadRepositoryPostgres;


