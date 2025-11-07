const AddThread = require('../../Domains/threads/entities/AddThread');

class AddThreadUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, owner) {
    // Buat entity buat validasi payload
    const addThread = new AddThread({ ...useCasePayload, owner });

    // Simpan ke DB
    const addedThread = await this._threadRepository.addThread(addThread);

    // Kembalikan object biasa (bukan instance)
    return {
      id: addedThread.id,
      title: addedThread.title,
      owner: addedThread.owner,
    };
  }
}

module.exports = AddThreadUseCase;
