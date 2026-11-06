export function createClient(baseUrl) {
  return async function request(path, {method='GET', body, headers={}}={}) {
    if (!baseUrl) throw Error('VITE_API_BASE_URL 설정을 확인해 주세요.');
    let response;
    const multipart=typeof FormData!=='undefined'&&body instanceof FormData;
    try {
      response = await fetch(baseUrl.replace(/\/+$/, '') + path, {
        method, headers:body&&!multipart ? {'Content-Type':'application/json', ...headers} : headers,
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
