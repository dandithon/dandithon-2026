import test from 'node:test';
import assert from 'node:assert/strict';
const cache=new Map();globalThis.localStorage={getItem:k=>cache.get(k)??null,setItem:(k,v)=>cache.set(k,v)};
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
  await assert.rejects(marketApi.claim('photo'));
  assert.equal((await marketApi.claim('review-1')).balance,600);
  await assert.rejects(marketApi.claim('review-1'));
  await assert.rejects(marketApi.claim('equip-hat'));
  const {explorationApi}=await import('../src/api/exploration.js');
  await explorationApi.equip('tteok-hat');
  assert.equal((await marketApi.claim('equip-hat')).balance,700);
  await assert.rejects(marketApi.claim('equip-hat'));
  await assert.rejects(marketApi.claim('visit-3'));
  for(const id of ['seomun','noodle','hotteok'])await marketApi.visit(id);
  assert.equal((await marketApi.claim('visit-3')).balance,1000);
  await marketApi.addToCart('fish',2);await marketApi.addToCart('fish',1);
  assert.equal((await marketApi.load()).cart[0].quantity,3);
  const originalNow=Date.now;Date.now=()=>originalNow()+24*60*60*1000;
  try {
    const next=await marketApi.refreshQuests();
    assert.ok(next.quests.daily.every(q=>q.current===0&&q.status==='IN_PROGRESS'));
    assert.deepEqual(next.claimed,[]);
    assert.equal(next.balance,1000);
  } finally {Date.now=originalNow;}
});
