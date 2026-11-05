import test from 'node:test';
import assert from 'node:assert/strict';
import {createLiveApi} from '../src/api/live.js';
import {validateCharge,chargeAmount} from '../src/game/coins.js';

function server(){
  let balance=1000,failure=false,calls=0,invalid=false;
  const storage={getItem:()=>null,setItem:()=>{}};
  const request=async(path,options)=>{
    if(path==='/users/me/charge'){
      calls++;assert.equal(options.method,'POST');assert.deepEqual(options.body,{amount:chargeAmount});
      if(failure)throw Error('connection lost');
      balance+=options.body.amount;return {balance:invalid?'invalid':balance};
    }
    if(path==='/users/me')return {balance};
    if(path==='/stores')return {stores:[]};
    if(path==='/orders/receipts')return {receipts:[]};
    if(path==='/quests')return {daily:[],achievement:[],event:[]};
    if(path==='/map/zones')return {zones:[]};
    throw Error(path);
  };
  return {market:createLiveApi(request,storage).market,fail:()=>failure=true,invalid:()=>invalid=true,calls:()=>calls};
}

test('confirmed charge updates the shared balance used by later market actions',async()=>{
  const {market}=server();await market.load();
  const result=await market.charge(chargeAmount);
  assert.equal(result.state.balance,101000);
  assert.equal(result.user.balance,101000);
  assert.equal((await market.favorite('seomun')).balance,101000);
  assert.equal((await market.syncBalance()).state.balance,101000);
  assert.deepEqual(result.state.orders,[]);
});
test('charge failures are not retried and do not fabricate a balance increase',async()=>{
  const s=server();await s.market.load();s.fail();
  await assert.rejects(s.market.charge(chargeAmount),/connection lost/);
  assert.equal(s.calls(),1);
  assert.equal((await s.market.syncBalance()).state.balance,1000);
  assert.equal(s.calls(),1);
});
test('invalid server balance is not shown as a successful charge',async()=>{
  const s=server();await s.market.load();s.invalid();
  await assert.rejects(s.market.charge(chargeAmount),/서버 잔액/);
  assert.equal((await s.market.favorite('seomun')).balance,1000);
});
test('charge validates input before sending a request',async()=>{
  const s=server();
  for(const value of [0,-1,NaN,1.5,10_000_001]){
    assert.throws(()=>validateCharge(value));
    await assert.rejects(s.market.charge(value));
  }
  assert.equal(s.calls(),0);
});
test('offline charge remains local and does not create an order',async()=>{
  const saved=new Map();globalThis.localStorage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)};
  const {marketApi}=await import('../src/api/market.js');
  const before=await marketApi.load();
  const after=await marketApi.charge(chargeAmount);
  assert.equal(after.state.balance,before.balance+chargeAmount);
  assert.deepEqual(after.state.orders,before.orders);
  assert.equal((await marketApi.load()).balance,after.state.balance);
});
