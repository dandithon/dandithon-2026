import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.localStorage={getItem(){return null;},setItem(){}};
const {marketApi}=await import('../src/api/market.js');
test('direct purchases preserve cart; cart purchases remove only purchased quantities',async()=>{
  await marketApi.addToCart('fish',2);
  await marketApi.addToCart('tteok',1);
  const direct=await marketApi.order([{itemId:'fish',quantity:1}]);
  assert.deepEqual(direct.state.cart,[{itemId:'fish',quantity:2},{itemId:'tteok',quantity:1}]);
  const cart=await marketApi.order([{itemId:'fish',quantity:1}],{fromCart:true});
  assert.deepEqual(cart.state.cart,[{itemId:'fish',quantity:1},{itemId:'tteok',quantity:1}]);
  await assert.rejects(marketApi.order(cart.state.cart,{fromCart:true}));
  assert.deepEqual((await marketApi.load()).cart,cart.state.cart);
  const final=await marketApi.order([{itemId:'tteok',quantity:1}],{fromCart:true});
  assert.deepEqual(final.state.cart,[{itemId:'fish',quantity:1}]);
});
