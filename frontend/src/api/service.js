import {marketApi as mockMarket} from './market.js';
import {explorationApi as mockProfile} from './exploration.js';
import {createLiveApi} from './live.js';
import {createClient,getGuestId} from './http.js';
import {createFeatureDiscovery} from './features.js';

const mode = import.meta.env.VITE_DATA_MODE || 'mock';
export const live = mode === 'live';
export function validateMode() {
  if (!['live','mock'].includes(mode)) throw Error('VITE_DATA_MODE는 live 또는 mock이어야 해요.');
}
export const presenterGuestId = '1';
export const presenterMode = live && new URLSearchParams(window.location.search).get('demo') === '1';
const presenterId = () => presenterGuestId;
const playGuestId = presenterMode ? presenterId : getGuestId;
const baseUrl = import.meta.env.VITE_API_BASE_URL;
export const demoRequest = live ? createClient(baseUrl,presenterId) : null;
const api = live && createLiveApi(createClient(baseUrl,playGuestId),localStorage,createFeatureDiscovery(baseUrl),baseUrl,playGuestId);
export const marketApi = live ? api.market : mockMarket;
export const explorationApi = live ? api.profile : mockProfile;
