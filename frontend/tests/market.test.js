import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.localStorage={getItem(){return null;},setItem(){}};
const {marketApi}=await import('../src/api/market.js');
test('order validation, atomic balance, ready state, review and reward invariants',async()=>{
  assert.equal((await marketApi.load()).balance,1000);
  await assert.rejects(marketApi.order([{itemId:'tteok',quantity:0}]));
  await assert.rejects(marketApi.order([{itemId:'tteok',quantity:4}]),/부족/);
  assert.equal((await marketApi.load()).balance,1000);
  const result=await marketApi.order([{itemId:'tteok',quantity:2}]);
  assert.equal(result.state.balance,400);
  assert.equal(result.orders[0].quantity,2);
  await assert.rejects(marketApi.review(result.orders[0].id,'후기',5),/조리가/);
  const now=Date.now;Date.now=()=>now()+16000;
  try{const s=await marketApi.refreshOrders();assert.equal(s.orders[0].status,'ready');}finally{Date.now=now;}
  await assert.rejects(marketApi.review(result.orders[0].id,' ',5));
  assert.equal((await marketApi.review(result.orders[0].id,'테스트 후기',5)).reviews.length,3);
  await assert.rejects(marketApi.review(result.orders[0].id,'중복',5));
  assert.equal((await marketApi.claim('photo')).balance,500);
  await assert.rejects(marketApi.claim('photo'));
  await assert.rejects(marketApi.claim('visit'));
  for(const id of ['seomun','noodle','hotteok'])await marketApi.visit(id);
  assert.equal((await marketApi.claim('visit')).balance,800);
  await marketApi.addToCart('fish',2);await marketApi.addToCart('fish',1);
  assert.equal((await marketApi.load()).cart[0].quantity,3);
});
