import test from 'node:test';
import assert from 'node:assert/strict';
import {createLiveApi} from '../src/api/live.js';
import {getStore} from '../src/api/catalog.js';

function fixture(){
  let favorites=[],reviews=[{id:'review-1',authorName:'승우',rating:5,text:'맛있어요'}],deleted=false,fail=false,cacheFails=false;
  const calls=[];
  const request=async(path,options)=>{
    calls.push([path,options]);
    if(options&&fail)throw Error('connection lost');
    if(path==='/users/me')return {balance:1000,favorites,level:3,exp:40,nextLevelExp:300};
    if(path==='/profile/equipments')return {equipments:[]};
    if(path==='/profile/badges')return {foods:[]};
    if(path==='/stores')return {stores:[{id:'seomun',waitTimeMinutes:7,npcCount:2,synthetic:true,waitTimeSource:'SYNTHETIC_DEMO_QUEUE'}]};
    if(path==='/stores/seomun')return {id:'seomun',name:'서문분식',menus:[{id:'tteok',price:3000}]};
    if(path==='/stores/seomun/reviews')return {reviews};
    if(path==='/orders/receipts')return {receipts:[{orderId:'order-1',menuId:'tteok',storeId:'seomun',status:deleted?'ready':'reviewed',canReview:deleted}]};
    if(path==='/quests')return {daily:[],achievement:[],event:[]};
    if(path==='/map/zones')return {zones:[]};
    if(path==='/users/me/favorites')return {favorites};
    if(path==='/users/me/favorites/seomun'){favorites=favorites.length?[]:['seomun'];return {favorites};}
    if(path==='/reviews/review-1'){assert.equal(options.method,'DELETE');deleted=true;reviews=[];return {deleted:true,reviewId:'review-1'};}
    if(path==='/orders')return {orderId:'order-2',items:[{menuId:'tteok',quantity:1}],remainingBalance:500,status:'ready',readyAfterSeconds:0};
    if(path==='/reviews'){assert.equal(options.body.orderId,'order-1');return {...options.body,reviewId:'review-2'};}
    throw Error(path);
  };
  return {...createLiveApi(request,{getItem:()=>null,setItem:()=>{if(cacheFails)throw Error('cache full');}}),calls,fail:()=>fail=true,cacheFail:()=>cacheFails=true};
}

test('favorite failure does not fabricate a toggle or retry the PATCH',async()=>{
  const api=fixture();await api.market.load();api.fail();
  await assert.rejects(api.market.favorite('seomun'),/connection lost/);
  assert.deepEqual((await api.market.syncBalance()).state.favorites,[]);
  assert.equal(api.calls.filter(([path])=>path.endsWith('/favorites/seomun')).length,1);
});
test('confirmed favorite survives device cache failure and reloads from server',async()=>{
  const api=fixture();await api.market.load();api.cacheFail();
  assert.deepEqual((await api.market.favorite('seomun')).favorites,['seomun']);
  assert.deepEqual((await api.market.refreshFavorites()).favorites,['seomun']);
});
test('delete restores server receipt review eligibility and allows rewriting the same order',async()=>{
  const api=fixture();await api.market.load();
  assert.equal((await api.market.deleteReview('review-1')).reviews.length,0);
  const state=await api.market.refreshOrders();assert.equal(state.orders[0].canReview,true);
  const updated=await api.market.review(state.orders[0].id,'다시 작성',1);
  assert.equal(updated.reviews[0].rating,1);assert.equal(updated.orders[0].status,'reviewed');
  assert.equal(updated.orders[0].canReview,false);
});
test('failed deletion preserves reviews and makes only one DELETE request',async()=>{
  const api=fixture();await api.market.load();api.fail();
  await assert.rejects(api.market.deleteReview('review-1'),/connection lost/);
  assert.equal((await api.market.refreshOrders()).reviews.length,1);
  assert.equal(api.calls.filter(([,options])=>options?.method==='DELETE').length,1);
});
test('queue refresh keeps menus and authoritative NPC/source data without touching cart or balance',async()=>{
  const api=fixture();await api.market.load();await api.market.addToCart('tteok',2);
  const result=await api.market.refreshStores();
  assert.equal(getStore('seomun').menus[0].id,'tteok');assert.equal(getStore('seomun').npcCount,2);
  assert.equal(getStore('seomun').waitTimeSource,'SYNTHETIC_DEMO_QUEUE');
  assert.equal(result.waits.seomun,7);assert.equal(result.cart[0].quantity,2);assert.equal(result.balance,1000);
});
test('ready orders preserve immediate review status without awarding experience twice',async()=>{
  const api=fixture();await api.market.load();
  const result=await api.market.order([{itemId:'tteok',quantity:1}]);
  assert.equal(result.orders[0].canReview,true);assert.equal(result.orders[0].readyAfterSeconds,0);
  const profile=await api.profile.load();assert.equal(profile.level,3);assert.equal(profile.exp,40);
  assert.equal(api.calls.filter(([path])=>path==='/users/me/exp').length,0);
});

test('legacy backend does not expose stale cached favorites as server-confirmed data',async()=>{
  const api=createLiveApi(async path=>{
    if(path==='/users/me')return {balance:1000};
    if(path==='/stores')return {stores:[]};
    if(path==='/orders/receipts')return {receipts:[]};
    if(path==='/quests')return {daily:[],achievement:[],event:[]};
    if(path==='/map/zones')return {zones:[]};
    throw Error('unexpected request '+path);
  },{getItem:()=>JSON.stringify({cart:[],visits:[],favorites:['seomun']}),setItem:()=>{}});
  const state=await api.market.load();assert.equal(state.favoritesSupported,false);assert.deepEqual(state.favorites,[]);
  await assert.rejects(api.market.favorite('seomun'),/준비 중/);
});
