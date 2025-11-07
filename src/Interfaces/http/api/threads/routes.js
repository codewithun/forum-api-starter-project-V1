const routes = (handler) => ([
  {
    method: 'POST',
    path: '/threads',
    handler: handler.postThreadHandler,
    options: { auth: 'forum_jwt' },
  },
  {
    method: 'GET',
    path: '/threads/{threadId}',
    handler: handler.getThreadHandler,
  },
  {
  method: 'GET',
  path: '/threads',
  handler: handler.getAllThreadsHandler,  
  },
  {
    method: 'PUT',
    path: '/threads/{threadId}/comments/{commentId}/likes',
    handler: handler.toggleLikeCommentHandler,
    options: { auth: 'forum_jwt' },
  },
]);

module.exports = routes;
