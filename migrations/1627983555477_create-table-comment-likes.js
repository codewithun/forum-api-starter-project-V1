/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('comment_likes', {
    id: { type: 'VARCHAR(50)', primaryKey: true },
    comment_id: { type: 'VARCHAR(50)', notNull: true },
    owner: { type: 'VARCHAR(50)', notNull: true },
    date: { type: 'TIMESTAMP', notNull: true },
  });

  pgm.addConstraint('comment_likes', 'fk_comment_likes.comment_id_comments.id', 'FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE');
  pgm.addConstraint('comment_likes', 'fk_comment_likes.owner_users.id', 'FOREIGN KEY(owner) REFERENCES users(id) ON DELETE CASCADE');
  pgm.addConstraint('comment_likes', 'unique_comment_likes_owner_comment', 'UNIQUE(comment_id, owner)');
};

exports.down = (pgm) => {
  pgm.dropTable('comment_likes');
};
