class ToggleLikeCommentUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(threadId, commentId, owner) {
    await this._threadRepository.verifyThreadExists(threadId);
    await this._commentRepository.verifyCommentExists(commentId);

    const alreadyLiked = await this._commentRepository.isCommentLikedByUser(commentId, owner);
    if (alreadyLiked) {
      await this._commentRepository.removeLike(commentId, owner);
    } else {
      await this._commentRepository.addLike(commentId, owner);
    }
  }
}

module.exports = ToggleLikeCommentUseCase;
