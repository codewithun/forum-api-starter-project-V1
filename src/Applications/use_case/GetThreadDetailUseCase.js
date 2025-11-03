class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId) {
    await this._threadRepository.verifyThreadExists(threadId);
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);

    const commentIds = comments.map((c) => c.id);
    const likeCountsMap = await this._commentRepository.getLikeCountsByCommentIds(commentIds);
    const replies = await this._replyRepository.getRepliesByCommentIds(commentIds);
    const repliesByComment = replies.reduce((acc, r) => {
      if (!acc[r.comment_id]) acc[r.comment_id] = [];
      acc[r.comment_id].push({
        id: r.id,
        content: r.is_delete ? '**balasan telah dihapus**' : r.content,
        date: r.date,
        username: r.username,
      });
      return acc;
    }, {});

    const mappedComments = comments
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((c) => ({
        id: c.id,
        username: c.username,
        date: c.date,
        content: c.is_delete ? '**komentar telah dihapus**' : c.content,
        likeCount: likeCountsMap[c.id] || 0,
        replies: (repliesByComment[c.id] || []).sort((a, b) => new Date(a.date) - new Date(b.date)),
      }));

    return {
      id: thread.id,
      title: thread.title,
      body: thread.body,
      date: thread.date,
      username: thread.username,
      comments: mappedComments,
    };
  }
}

module.exports = GetThreadDetailUseCase;
