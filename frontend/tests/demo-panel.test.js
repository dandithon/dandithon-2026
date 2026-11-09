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
    const generated = getGuestId();
    assert.ok(Number(generated) >= 2 && Number(generated) <= 1_000_000_000_000);
    await client('/users/me');
    assert.equal(sentHeader, generated);
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


test('first visit persists the guest ID and later visits reuse it', () => {
  const storage = new Map();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
  });
  try {
    setGuestId(null);
    const id = getGuestId();
    assert.equal(storage.get('dandi-guest-user-id'), id);
    setGuestId(null);
    storage.set('dandi-guest-user-id', id);
    assert.equal(getGuestId(), id);
  } finally {
    setGuestId(null);
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});

test('presenter and control requests can target ID 1 without switching the normal guest', async () => {
  const previousFetch = globalThis.fetch;
  const headers = [];
  globalThis.fetch = async (_url, options) => {
    headers.push(options.headers['X-User-Id']);
    return { ok: true, json: async () => ({ success: true, data: {} }) };
  };
  try {
    setGuestId('42');
    const normal = createClient('http://test-server/api/v1');
    const presenter = createClient('http://test-server/api/v1', () => '1');
    await presenter('/demo/seomun/queue/seed', { method: 'POST' });
    await normal('/users/me');
    assert.deepEqual(headers, ['1', '42']);
  } finally {
    globalThis.fetch = previousFetch;
    setGuestId(null);
  }
});

test('live cart and visits are restored only for the selected guest', async () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  const quests = { daily: [], achievement: [], event: [] };
  const responses = {
    '/stores': { stores: [{ id: 'seomun' }] },
    '/stores/seomun': { menus: [{ id: 'tteok' }] },
    '/stores/seomun/reviews': { reviews: [] },
    '/stores/seomun/browse': quests,
    '/users/me': { balance: 1000 },
    '/orders/receipts': { receipts: [] },
    '/quests': quests,
    '/map/zones': { zones: [] },
  };
  let guestId = '1';
  const { market } = createLiveApi(async path => responses[path], storage, null, null, () => guestId);
  await market.load();
  await market.addToCart('tteok', 1);
  await market.visit('seomun');

  guestId = '42';
  const other = await market.load();
  assert.deepEqual(other.cart, []);
  assert.deepEqual(other.visits, []);

  guestId = '1';
  const original = await market.load();
  assert.deepEqual(original.cart, [{ itemId: 'tteok', quantity: 1 }]);
  assert.deepEqual(original.visits, ['seomun']);
});
