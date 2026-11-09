let customGuestId = null;
const maxGuestId = 1_000_000_000_000;

export function isGuestId(id) {
  return /^[1-9]\d*$/.test(id) && Number(id) <= maxGuestId;
}

export function newGuestId() {
  const [high, low] = crypto.getRandomValues(new Uint32Array(2));
  const random = (high & 0xfffff) * 2 ** 32 + low;
  return String(2 + random % (maxGuestId - 1));
}

export function setGuestId(id) {
  customGuestId = id != null ? String(id) : null;
  try {
    if (typeof localStorage !== 'undefined') {
      if (id != null) localStorage.setItem('dandi-guest-user-id', String(id));
      else localStorage.removeItem('dandi-guest-user-id');
    }
  } catch {}
}

export function getGuestId() {
  if (customGuestId) return customGuestId;
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('dandi-guest-user-id');
      if (stored && isGuestId(stored)) {
        customGuestId = stored;
        return stored;
      }
    }
  } catch {}
  const id = newGuestId();
  setGuestId(id);
  return id;
}

export function createClient(baseUrl, resolveGuestId = getGuestId) {
  return async function request(path, {method='GET', body, headers={}}={}) {
    if (!baseUrl) throw Error('VITE_API_BASE_URL 설정을 확인해 주세요.');
    let response;
    const multipart=typeof FormData!=='undefined'&&body instanceof FormData;
    const guestId = resolveGuestId();
    const guestHeaders = guestId ? {'X-User-Id': guestId} : {};
    try {
      response = await fetch(baseUrl.replace(/\/+$/, '') + path, {
        method, headers:body&&!multipart ? {'Content-Type':'application/json', ...guestHeaders, ...headers} : {...guestHeaders, ...headers},
        body:multipart?body:body ? JSON.stringify(body) : undefined,
        signal:AbortSignal.timeout(15000),
      });
    } catch {
      throw Error('서버에 연결하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.');
    }
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.success !== true) {
      const error = Error(result?.error?.message || '서버 응답을 확인할 수 없어요. (' + response.status + ')');
      error.code = result?.error?.code;
      error.status = response.status;
      throw error;
    }
    return result.data;
  };
}
