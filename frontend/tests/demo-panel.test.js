import test from 'node:test';
import assert from 'node:assert/strict';
import { getGuestId, setGuestId, createClient } from '../src/api/http.js';
import { createLiveApi } from '../src/api/live.js';

test('guest id switching updates request headers', async () => {
  setGuestId('1');
  assert.equal(getGuestId(), '1');

  let sentHeader = null;
  const mockFetch = async (url, options) => {
    sentHeader = options.headers['X-User-Id'];
    return {
      ok: true,
      json: async () => ({ success: true, data: { userId: Number(sentHeader), balance: 1000 } }),
    };
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetch;

  try {
    const client = createClient('http://test-server/api/v1');
    await client('/users/me');
    assert.equal(sentHeader, '1');

    setGuestId('42');
    assert.equal(getGuestId(), '42');
    await client('/users/me');
    assert.equal(sentHeader, '42');

    setGuestId(null);
    assert.equal(getGuestId(), '1');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('live gainExp posts to /users/me/exp and updates preferences', async () => {
  let expPosted = null;
  const request = async (path, options = {}) => {
    if (path === '/users/me/exp') {
      expPosted = options.body.exp;
      return { level: 2, exp: 120, nextLevelExp: 150 };
    }
    return {};
  };

  const storage = {
    getItem: () => null,
    setItem: () => {},
  };

  const api = createLiveApi(request, storage);
  const updated = await api.profile.gainExp(50);
  assert.equal(expPosted, 50);
  assert.equal(updated.level, 2);
  assert.equal(updated.exp, 120);
});
