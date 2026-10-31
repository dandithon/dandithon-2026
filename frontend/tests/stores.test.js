import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,menu,stores} from '../src/mocks/fixtures.js';
const legacy=structuredClone(initialState);legacy.favorite=true;
let saved={version:1,data:legacy};
globalThis.localStorage={getItem:()=>JSON.stringify(saved),setItem:(_,value)=>{saved=JSON.parse(value);}};
const {marketApi}=await import('../src/api/market.js');
test('legacy records and store-specific favorites survive migration',async()=>{
 const s=await marketApi.load();assert.deepEqual(s.favorites,['seomun']);
 assert.ok(s.reviews.every(r=>r.storeId==='seomun'));
 await marketApi.favorite('coffee');await marketApi.favorite('seomun');
 assert.deepEqual((await marketApi.load()).favorites,['coffee']);
});
test('all stores have unique menus and mixed-store orders retain ownership',async()=>{
 assert.equal(new Set(menu.map(m=>m.id)).size,menu.length);
 for(const store of stores)assert.equal(menu.filter(m=>m.storeId===store.id).length,4);
 await assert.rejects(marketApi.visit('missing'));
 const ids=['noodle-basic','hotteok-seed','coffee-americano'];
 for(const id of ids)await marketApi.addToCart(id,1);
 const result=await marketApi.order((await marketApi.load()).cart);
 assert.equal(result.state.balance,250);
 assert.deepEqual(result.orders.map(o=>o.storeId),['noodle','hotteok','coffee']);
 const now=Date.now;Date.now=()=>now()+16000;
 try{await marketApi.refreshOrders();}finally{Date.now=now;}
 for(const order of result.orders){
  const state=await marketApi.review(order.id,'가게별 후기 테스트',5);
  assert.equal(state.reviews[0].storeId,order.storeId);
 }
 assert.equal((await marketApi.load()).reviews.filter(r=>r.storeId==='seomun').length,2);
});
