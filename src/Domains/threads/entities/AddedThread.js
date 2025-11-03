class AddedThread {
  constructor(payload) {
    const { id, title, owner } = payload;
    this.id = id;
    this.title = title;
    this.owner = owner;
  }
}

module.exports = AddedThread;
