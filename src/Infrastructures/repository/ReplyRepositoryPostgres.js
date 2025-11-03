const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AddedReply = require('../../Domains/replies/entities/AddedReply');
const ReplyRepository = require('../../Domains/replies/ReplyRepository');

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addReply(addReply) {
    const { commentId, content, owner } = addReply;
    const id = `reply-${this._idGenerator()}`;
    const date = new Date().toISOString();
    const query = {
      text: 'INSERT INTO replies (id, comment_id, content, owner, date, is_delete) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, content, owner',
      values: [id, commentId, content, owner, date, false],
    };
    const result = await this._pool.query(query);
    return new AddedReply(result.rows[0]);
  }

  async deleteReply(replyId, owner) {
    const query = { text: 'UPDATE replies SET is_delete = true WHERE id = $1 AND owner = $2 RETURNING id', values: [replyId, owner] };
    const result = await this._pool.query(query);
    if (!result.rowCount) throw new NotFoundError('balasan tidak ditemukan');
  }

  async verifyReplyExists(replyId) {
    const query = { text: 'SELECT id FROM replies WHERE id = $1', values: [replyId] };
    const result = await this._pool.query(query);
    if (!result.rowCount) throw new NotFoundError('balasan tidak ditemukan');
  }

  async verifyReplyOwner(replyId, owner) {
    const query = { text: 'SELECT owner FROM replies WHERE id = $1', values: [replyId] };
    const result = await this._pool.query(query);
    if (!result.rowCount) throw new NotFoundError('balasan tidak ditemukan');
    if (result.rows[0].owner !== owner) throw new AuthorizationError('anda tidak berhak mengakses resource ini');
  }

  async getRepliesByCommentIds(commentIds) {
    if (!commentIds.length) return [];
    const query = {
      text: `SELECT r.id, r.comment_id, u.username, r.date, r.content, r.is_delete
             FROM replies r JOIN users u ON u.id = r.owner
             WHERE r.comment_id = ANY($1::text[])
             ORDER BY r.date ASC`,
      values: [commentIds],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = ReplyRepositoryPostgres;

