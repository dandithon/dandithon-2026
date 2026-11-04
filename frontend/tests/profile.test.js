import test from 'node:test';
import assert from 'node:assert/strict';
import {collectionFoods,readProfile} from '../src/game/profile.js';
import {crowdPresentation} from '../src/game/crowd.js';
import {createLiveApi} from '../src/api/live.js';
import {progression} from '../src/game/progression.js';

test('server food collection preserves rewards for foods absent from the menu',()=>{
  const food={foodId:'seasonal',foodName:'계절 음식',purchaseCount:5,badges:[{name:'브론즈',earned:false}]};
  const rows=collectionFoods({foods:[food]},[{id:'tteok'}],{seasonal:99});
  assert.equal(rows.length,1);
  assert.equal(rows[0].item.name,'계절 음식');
  assert.equal(rows[0].count,5);
  assert.equal(rows[0].food.badges[0].earned,false);
  assert.deepEqual(collectionFoods({foods:[]},[{id:'tteok'}],{tteok:99}),[]);
});

test('failed profile read returns an explicit stale state and can be retried',async()=>{
  let reads=0;
  const profile={nickname:'조웅',balance:500};
  const api={load:async()=>{if(++reads===1)throw Error('network');return profile;}};
  assert.deepEqual(await readProfile(api),{profile:null,error:'network'});
  assert.deepEqual(await readProfile(api),{profile,error:''});
});

test('live profile reload uses server unlocks and persists confirmed equip and nickname responses',async()=>{
  let count=0,equipped={};
  const request=async(path,options)=>{
    if(path==='/users/me/nickname')return {nickname:options.body.nickname};
    if(path.endsWith('/toggle')){equipped={head:'tteok-hat'};return {equipped};}
    if(path==='/users/me')return {nickname:'조웅',balance:1000,level:1,exp:0,nextLevelExp:100,equipped};
    if(path==='/profile/equipments')return {equipments:[{id:'tteok-hat',slot:'head',targetFoodId:'tteok',requiredCount:1,currentCount:count,unlocked:count>=1}]};
    if(path==='/profile/badges')return {foods:[{foodId:'tteok',purchaseCount:count,badges:[],nextBadge:null}]};
    throw Error(path);
  };
  const {profile}=createLiveApi(request,{});
  assert.equal((await profile.load()).items[0].unlocked,false);
  count=1;
  const refreshed=await profile.load();
  assert.equal(refreshed.items[0].unlocked,true);
  assert.equal(progression({orders:[{id:'fake',itemId:'tteok',status:'ready'}]},refreshed).counts.tteok,1);
  assert.equal((await profile.equip('tteok-hat')).equipped.head,'tteok-hat');
  assert.equal((await profile.rename('시장탐험가')).nickname,'시장탐험가');
});

test('crowd uses explicit server status and does not invent a wait when data is missing',()=>{
  assert.deepEqual(crowdPresentation(5,{mock:false,npcCount:7,crowdLabel:'혼잡'}),{count:7,label:'혼잡',text:'약 5분',source:'예상 대기시간'});
  for(const minutes of [undefined,null,NaN,-1]){
    assert.equal(crowdPresentation(minutes,{npcCount:7,crowdLabel:'혼잡'}).count,0);
    assert.equal(crowdPresentation(minutes).text,'정보 없음');
  }
  assert.equal(crowdPresentation(5,{mock:true}).source,'시연 대기시간');
});
