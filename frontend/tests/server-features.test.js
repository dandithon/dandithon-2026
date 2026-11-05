import test from 'node:test';
import assert from 'node:assert/strict';
import {featuresFromSchema,createFeatureDiscovery} from '../src/api/features.js';
import {createLiveApi} from '../src/api/live.js';

test('older deployment reports missing endpoints without pretending they are available',()=>{
  assert.deepEqual(featuresFromSchema({paths:{'/api/v1/users/me':{get:{}}}}),{reviewDelete:false,experience:false,favorites:false});
  assert.throws(()=>featuresFromSchema({}),/API 기능/);
});
test('latest deployment enables each feature by its HTTP operation',()=>{
  assert.deepEqual(featuresFromSchema({paths:{
    '/api/v1/reviews/{reviewId}':{delete:{}},
    '/api/v1/users/me/exp':{post:{}},
    '/api/v1/users/me/favorites/{storeId}':{patch:{}},
  }}),{reviewDelete:true,experience:true,favorites:true});
  assert.equal(featuresFromSchema({paths:{'/api/v1/reviews/{reviewId}':{get:{}}}}).reviewDelete,false);
});
test('feature discovery uses backend docs and does not mutate gameplay',async()=>{
  const previous=globalThis.fetch;let called;
  globalThis.fetch=async(url,options)=>{called={url:String(url),options};return {ok:true,json:async()=>({paths:{}})};};
  try{
    await createFeatureDiscovery('https://example.com/api/v1')();
    assert.equal(called.url,'https://example.com/v3/api-docs');assert.equal(called.options.method,undefined);assert.equal(called.options.cache,'no-store');
  }finally{globalThis.fetch=previous;}
});
test('profile reopening discovers a newly deployed feature without reloading user data',async()=>{
  let available=false,calls=0;
  const responses={'/stores':{stores:[]},'/users/me':{balance:1000},'/orders/receipts':{receipts:[]},'/quests':{daily:[]},'/map/zones':{zones:[]}};
  const {market}=createLiveApi(async(path)=>{if(path in responses)return responses[path];calls++;return {deleted:true,reviewId:'r1'};},{getItem:()=>null,setItem:()=>{}},async()=>({reviewDelete:available}));
  await market.load();
  await market.refreshFeatures();await assert.rejects(market.deleteReview('r1'),/준비 중/);assert.equal(calls,0);
  available=true;assert.equal((await market.refreshFeatures()).features.reviewDelete,true);
  await market.deleteReview('r1');assert.equal(calls,1);
});
