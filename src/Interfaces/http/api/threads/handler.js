const AddThreadUseCase = require('../../../../Applications/use_case/AddThreadUseCase');
const GetThreadDetailUseCase = require('../../../../Applications/use_case/GetThreadDetailUseCase');
const ToggleLikeCommentUseCase = require('../../../../Applications/use_case/ToggleLikeCommentUseCase');
const GetAllThreadsUseCase = require('../../../../Applications/use_case/GetAllThreadsUseCase');

class ThreadsHandler {
  constructor(container) {
    this._container = container;

    this.postThreadHandler = this.postThreadHandler.bind(this);
    this.getThreadHandler = this.getThreadHandler.bind(this);
    this.toggleLikeCommentHandler = this.toggleLikeCommentHandler.bind(this);
    this.getAllThreadsHandler = this.getAllThreadsHandler.bind(this);
  }

  async postThreadHandler(request, h) {
    const owner = request.auth.credentials.id;
    const addThreadUseCase = this._container.getInstance(AddThreadUseCase.name);
    const addedThread = await addThreadUseCase.execute(request.payload, owner);

    const response = h.response({
      status: 'success',
      data: { addedThread },
    });
    response.code(201);
    return response;
  }

  async getThreadHandler(request) {
    const { threadId } = request.params;
    const getThreadDetailUseCase = this._container.getInstance(GetThreadDetailUseCase.name);
    const thread = await getThreadDetailUseCase.execute(threadId);
    return { status: 'success', data: { thread } };
  }

  async toggleLikeCommentHandler(request) {
    const owner = request.auth.credentials.id;
    const { threadId, commentId } = request.params;
    const toggleLikeCommentUseCase = this._container.getInstance(ToggleLikeCommentUseCase.name);
    await toggleLikeCommentUseCase.execute(threadId, commentId, owner);
    return { status: 'success' };
  }

  async getAllThreadsHandler() {
    const getAllThreadsUseCase = this._container.getInstance(GetAllThreadsUseCase.name);
    const threads = await getAllThreadsUseCase.execute();
    return {
      status: 'success',
      data: { threads },
    };
  }
}

module.exports = ThreadsHandler;
