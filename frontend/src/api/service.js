import {marketApi as mockMarket} from './market.js';
import {explorationApi as mockProfile} from './exploration.js';
import {createLiveApi} from './live.js';
import {createClient} from './http.js';
import {createFeatureDiscovery} from './features.js';

const mode = import.meta.env.VITE_DATA_MODE || 'mock';
export const live = mode === 'live';
export function validateMode() {
  if (!['live','mock'].includes(mode)) throw Error('VITE_DATA_MODE는 live 또는 mock이어야 해요.');
}
const api = live && createLiveApi(createClient(import.meta.env.VITE_API_BASE_URL), localStorage,createFeatureDiscovery(import.meta.env.VITE_API_BASE_URL),import.meta.env.VITE_API_BASE_URL);
export const marketApi = live ? api.market : mockMarket;
export const explorationApi = live ? api.profile : mockProfile;
