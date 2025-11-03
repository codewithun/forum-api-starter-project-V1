const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AddedComment = require('../../Domains/comments/entities/AddedComment');
const CommentRepository = require('../../Domains/comments/CommentRepository');

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(addComment) {
    const { threadId, content, owner } = addComment;
    const id = `comment-${this._idGenerator()}`;
    const date = new Date().toISOString();
    const query = {
      text: 'INSERT INTO comments (id, thread_id, content, owner, date, is_delete) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, content, owner',
      values: [id, threadId, content, owner, date, false],
    };
    const result = await this._pool.query(query);
    return new AddedComment(result.rows[0]);
  }

  async deleteComment(commentId, owner) {
    const query = {
      text: 'UPDATE comments SET is_delete = true WHERE id = $1 AND owner = $2 RETURNING id',
      values: [commentId, owner],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) throw new NotFoundError('komentar tidak ditemukan');
  }

  async verifyCommentExists(commentId) {
    const query = { text: 'SELECT id FROM comments WHERE id = $1', values: [commentId] };
    const result = await this._pool.query(query);
    if (!result.rowCount) throw new NotFoundError('komentar tidak ditemukan');
  }

  async verifyCommentOwner(commentId, owner) {
    const query = { text: 'SELECT owner FROM comments WHERE id = $1', values: [commentId] };
    const result = await this._pool.query(query);
    if (!result.rowCount) throw new NotFoundError('komentar tidak ditemukan');
    if (result.rows[0].owner !== owner) throw new AuthorizationError('anda tidak berhak mengakses resource ini');
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: `SELECT c.id, u.username, c.date, c.content, c.is_delete
             FROM comments c JOIN users u ON u.id = c.owner
             WHERE c.thread_id = $1
             ORDER BY c.date ASC`,
      values: [threadId],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async isCommentLikedByUser(commentId, owner) {
    const query = {
      text: 'SELECT 1 FROM comment_likes WHERE comment_id = $1 AND owner = $2 LIMIT 1',
      values: [commentId, owner],
    };
    const result = await this._pool.query(query);
    return !!result.rowCount;
  }

  async addLike(commentId, owner) {
    const id = `comment-like-${this._idGenerator()}`;
    const date = new Date().toISOString();
    const query = {
      text: 'INSERT INTO comment_likes (id, comment_id, owner, date) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      values: [id, commentId, owner, date],
    };
    await this._pool.query(query);
  }

  async removeLike(commentId, owner) {
    const query = {
      text: 'DELETE FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };
    await this._pool.query(query);
  }

  async getLikeCountsByCommentIds(commentIds) {
    if (!commentIds || commentIds.length === 0) return {};
    const query = {
      text: 'SELECT comment_id, COUNT(*)::int AS like_count FROM comment_likes WHERE comment_id = ANY($1) GROUP BY comment_id',
      values: [commentIds],
    };
    const result = await this._pool.query(query);
    return result.rows.reduce((acc, row) => {
      acc[row.comment_id] = row.like_count;
      return acc;
    }, {});
  }
}

module.exports = CommentRepositoryPostgres;

