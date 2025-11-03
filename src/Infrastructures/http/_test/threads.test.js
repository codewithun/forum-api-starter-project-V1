const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

const registerAndLogin = async (server, username = 'dicoding') => {
  await server.inject({
    method: 'POST', url: '/users', payload: { username, password: 'secret', fullname: 'Dicoding Indonesia' },
  });
  const loginResponse = await server.inject({ method: 'POST', url: '/authentications', payload: { username, password: 'secret' } });
  const { data: { accessToken } } = JSON.parse(loginResponse.payload);
  return accessToken;
};

describe('/threads endpoint and comments', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.query('DELETE FROM comments');
    await pool.query('DELETE FROM threads');
  });

  describe('POST /threads', () => {
    it('should respond 401 when no authentication', async () => {
      const server = await createServer(container);
      const response = await server.inject({ method: 'POST', url: '/threads', payload: { title: 'a', body: 'b' } });
      expect(response.statusCode).toEqual(401);
    });

    it('should respond 201 and addedThread when payload valid', async () => {
      const server = await createServer(container);
      const token = await registerAndLogin(server);
      const response = await server.inject({ method: 'POST', url: '/threads', payload: { title: 'sebuah thread', body: 'sebuah body' }, headers: { Authorization: `Bearer ${token}` } });
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedThread).toBeDefined();
    });

    it('should respond 400 when payload invalid', async () => {
      const server = await createServer(container);
      const token = await registerAndLogin(server);
      const response = await server.inject({ method: 'POST', url: '/threads', payload: { title: 123 }, headers: { Authorization: `Bearer ${token}` } });
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
    });
  });

  describe('POST /threads/{threadId}/comments', () => {
    it('should respond 404 when thread not found', async () => {
      const server = await createServer(container);
      const token = await registerAndLogin(server);
      const response = await server.inject({ method: 'POST', url: '/threads/thread-123/comments', payload: { content: 'hello' }, headers: { Authorization: `Bearer ${token}` } });
      expect(response.statusCode).toEqual(404);
    });

    it('should respond 201 when comment added', async () => {
      const server = await createServer(container);
      const token = await registerAndLogin(server);
      const threadRes = await server.inject({ method: 'POST', url: '/threads', payload: { title: 'title', body: 'body' }, headers: { Authorization: `Bearer ${token}` } });
      const { data: { addedThread } } = JSON.parse(threadRes.payload);
      const response = await server.inject({ method: 'POST', url: `/threads/${addedThread.id}/comments`, payload: { content: 'sebuah comment' }, headers: { Authorization: `Bearer ${token}` } });
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedComment).toBeDefined();
    });
  });

  describe('DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should respond 403 when delete comment by another user', async () => {
      const server = await createServer(container);
      const token1 = await registerAndLogin(server, 'user1');
      const token2 = await registerAndLogin(server, 'user2');
      const threadRes = await server.inject({ method: 'POST', url: '/threads', payload: { title: 't', body: 'b' }, headers: { Authorization: `Bearer ${token1}` } });
      const { data: { addedThread } } = JSON.parse(threadRes.payload);
      const commentRes = await server.inject({ method: 'POST', url: `/threads/${addedThread.id}/comments`, payload: { content: 'hai' }, headers: { Authorization: `Bearer ${token1}` } });
      const { data: { addedComment } } = JSON.parse(commentRes.payload);
      const response = await server.inject({ method: 'DELETE', url: `/threads/${addedThread.id}/comments/${addedComment.id}`, headers: { Authorization: `Bearer ${token2}` } });
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual('fail');
    });

    it('should respond 200 when owner deletes comment', async () => {
      const server = await createServer(container);
      const token = await registerAndLogin(server);
      const threadRes = await server.inject({ method: 'POST', url: '/threads', payload: { title: 't', body: 'b' }, headers: { Authorization: `Bearer ${token}` } });
      const { data: { addedThread } } = JSON.parse(threadRes.payload);
      const commentRes = await server.inject({ method: 'POST', url: `/threads/${addedThread.id}/comments`, payload: { content: 'hai' }, headers: { Authorization: `Bearer ${token}` } });
      const { data: { addedComment } } = JSON.parse(commentRes.payload);
      const response = await server.inject({ method: 'DELETE', url: `/threads/${addedThread.id}/comments/${addedComment.id}`, headers: { Authorization: `Bearer ${token}` } });
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });
  });

  describe('GET /threads/{threadId}', () => {
    it('should respond 200 and include comments with deleted masked', async () => {
      const server = await createServer(container);
      const token = await registerAndLogin(server);
      const threadRes = await server.inject({ method: 'POST', url: '/threads', payload: { title: 'title', body: 'body' }, headers: { Authorization: `Bearer ${token}` } });
      const { data: { addedThread } } = JSON.parse(threadRes.payload);
      const c1 = await server.inject({ method: 'POST', url: `/threads/${addedThread.id}/comments`, payload: { content: 'komentar 1' }, headers: { Authorization: `Bearer ${token}` } });
      const { data: { addedComment } } = JSON.parse(c1.payload);
      await server.inject({ method: 'DELETE', url: `/threads/${addedThread.id}/comments/${addedComment.id}`, headers: { Authorization: `Bearer ${token}` } });
      const response = await server.inject({ method: 'GET', url: `/threads/${addedThread.id}` });
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.thread.comments[0].content).toEqual('**komentar telah dihapus**');
    });
  });
});
