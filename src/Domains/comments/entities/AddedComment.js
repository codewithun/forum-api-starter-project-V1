class AddedComment {
  constructor(payload) {
    const { id, content, owner } = payload;
    this.id = id;
    this.content = content;
    this.owner = owner;
  }
}

module.exports = AddedComment;
