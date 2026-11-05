import test from 'node:test';
import assert from 'node:assert/strict';
import {createLiveApi} from '../src/api/live.js';
import {equipment,progression} from '../src/game/progression.js';

function backend(){
  let balance=9000,count=8,equipped={},resetCalls=0,failReset=false,failCache=false;
  const claimed=new Set(),saved=new Map();
  const definitions=[['visit-3',300],['review-1',200],['equip-hat',100]];
  const quests=()=>({daily:definitions.map(([id,rewardCoin])=>({id,rewardCoin,current:count>0?1:0,target:1,status:claimed.has(id)?'CLAIMED':count>0?'COMPLETED':'IN_PROGRESS'})),achievement:[],event:[]});
  const request=async(path,options)=>{
    if(path==='/demo/reset'){
      assert.equal(options.method,'POST');resetCalls++;
      if(failReset)throw Error('reset connection lost');
      balance=1000;count=0;equipped={};claimed.clear();return {nickname:'승우',balance,equipped};
    }
    if(path==='/users/me')return {nickname:'승우',balance,equipped};
    if(path==='/profile/equipments')return {equipments:equipment.map(e=>({...e,targetFoodId:e.itemId,requiredCount:e.required,currentCount:count,unlocked:count>=e.required}))};
    if(path==='/profile/badges')return {foods:[{foodId:'tteok',purchaseCount:count,badges:[],nextBadge:null}]};
    if(path.endsWith('/toggle')){
      const item=equipment.find(e=>path.includes(e.id));
      if(count<item.required)throw Error('EQUIPMENT_LOCKED');
      equipped={...equipped,[item.slot]:equipped[item.slot]===item.id?null:item.id};return {equipped};
    }
    if(path.startsWith('/quests/')&&options?.method==='POST'){
      const id=path.split('/')[2],amount=definitions.find(d=>d[0]===id)[1];
      if(claimed.has(id))throw Error('already claimed');
      claimed.add(id);balance+=amount;return {questId:id,rewardCoin:amount,currentBalance:balance};
    }
    if(path==='/quests')return quests();
    if(path==='/stores')return {stores:[]};
    if(path==='/orders/receipts')return {receipts:[]};
    if(path==='/map/zones')return {zones:[]};
    throw Error(path);
  };
  const storage={getItem:k=>saved.get(k),setItem:(k,v)=>{if(failCache)throw Error('cache full');saved.set(k,v);}};
  return {...createLiveApi(request,storage),saved,resets:()=>resetCalls,failReset:()=>failReset=true,failCache:()=>failCache=true};
}

test('live shoes and scarf toggle independently and keep other worn slots',async()=>{
  const api=backend();await api.profile.load();
  for(const e of equipment)await api.profile.equip(e.id);
  let p=await api.profile.load();
  assert.deepEqual(progression({orders:[]},p).equipped,Object.fromEntries(equipment.map(e=>[e.slot,e.id])));
  p=await api.profile.equip('tteok-shoes');assert.equal(p.equipped.feet,null);assert.equal(p.equipped.neck,'tteok-scarf');
  p=await api.profile.equip('tteok-scarf');assert.equal(p.equipped.neck,null);assert.equal(p.equipped.head,'tteok-hat');
  assert.equal((await api.profile.load()).counts.tteok,8);
});
test('each server reward updates balance and the quest status exactly once',async()=>{
  const api=backend();await api.market.load();
  for(const [id,expected] of [['visit-3',9300],['review-1',9500],['equip-hat',9600]]){
    const state=await api.market.claim(id);
    assert.equal(state.balance,expected);
    assert.equal(state.quests.daily.find(q=>q.id===id).status,'CLAIMED');
    assert.ok(state.claimed.includes(id));
    await assert.rejects(api.market.claim(id),/already claimed/);
    assert.equal((await api.market.syncBalance()).state.balance,expected);
  }
});
test('successful reset clears local pending state and reloads locked equipment',async()=>{
  const api=backend();api.saved.set('dandi-api-guest-local-v1',JSON.stringify({cart:[],favorites:['seomun'],visits:['seomun'],pending:{lost:'previous-request'}}));await api.market.load();await api.profile.load();await api.profile.equip('tteok-scarf');
  const reset=await api.market.resetDemo();
  assert.equal(reset.user.balance,1000);assert.deepEqual(reset.state.orders,[]);assert.deepEqual(reset.state.reviews,[]);
  assert.deepEqual(reset.state.favorites,[]);assert.deepEqual(reset.state.cart,[]);assert.deepEqual(reset.state.visits,[]);assert.deepEqual(reset.state.claimed,[]);
  const cache=JSON.parse([...api.saved.values()][0]);assert.equal(cache.pending,undefined);
  const profile=await api.profile.load();assert.deepEqual(profile.equipped,{});
  assert.ok(profile.items.every(item=>!item.unlocked));assert.equal(profile.counts.tteok,0);assert.equal(api.resets(),1);
});
test('failed reset is not retried and leaves confirmed local state intact',async()=>{
  const api=backend();await api.market.load();api.failReset();
  await assert.rejects(api.market.resetDemo(),/reset connection lost/);
  assert.equal(api.resets(),1);assert.equal((await api.market.syncBalance()).state.balance,9000);
});
test('offline reset removes unlocks, equipment and mission reward progress together',async()=>{
  const {initialState}=await import('../src/mocks/fixtures.js');
  const data={...structuredClone(initialState),orders:Array.from({length:8},(_,i)=>({id:'test-'+i,itemId:'tteok',status:'ready',quantity:1})),balance:9000};
  const storage=new Map([['hackton-market-demo-v1',JSON.stringify({version:1,data})]]);
  globalThis.localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
  const {marketApi}=await import('../src/api/market.js');
  const {explorationApi}=await import('../src/api/exploration.js');
  for(const e of equipment)await explorationApi.equip(e.id);
  assert.equal((await explorationApi.load()).equipped.neck,'tteok-scarf');
  const rewarded=await marketApi.claim('equip-hat');assert.equal(rewarded.balance,9100);
  await marketApi.resetDemo();await explorationApi.resetPreferences();
  const state=await marketApi.load(),profile=await explorationApi.load();
  assert.equal(state.balance,1000);assert.equal(state.orders.length,0);assert.equal(state.reviews.length,0);
  assert.deepEqual(profile.equipped,{});assert.ok(state.quests.daily.every(q=>q.current===0&&q.status==='IN_PROGRESS'));
  assert.ok(progression(state,profile).items.every(item=>!item.unlocked));
});

test('device cache failure after reset does not report the committed reset as failed',async()=>{
  const api=backend();await api.market.load();api.failCache();
  const result=await api.market.resetDemo();
  assert.equal(result.user.balance,1000);assert.equal(api.resets(),1);
  assert.equal((await api.profile.load()).counts.tteok,0);
});
