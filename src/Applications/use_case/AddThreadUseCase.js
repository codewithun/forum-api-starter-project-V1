const AddThread = require('../../Domains/threads/entities/AddThread');
const AddedThread = require('../../Domains/threads/entities/AddedThread');

class AddThreadUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, owner) {
    // Buat entitas AddThread buat validasi
    const addThread = new AddThread({ ...useCasePayload, owner });

    // Simpan ke database lewat repository
    const addedThread = await this._threadRepository.addThread(addThread);

    // Bungkus hasilnya pakai AddedThread biar sesuai kontrak
    return new AddedThread(addedThread);
  }
}

module.exports = AddThreadUseCase;
