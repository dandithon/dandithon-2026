import test from 'node:test';
import assert from 'node:assert/strict';
import {createLiveApi} from '../src/api/live.js';

test('browse reports the server quest progress and preserves failures for retry',async()=>{
 const cache=new Map(),storage={getItem:k=>cache.get(k),setItem:(k,v)=>cache.set(k,v)};
 const calls=[];let fail=true;
 const request=async(path,options)=>{
  calls.push([path,options]);
  if(fail)throw Error('offline');
  return {daily:[{id:'visit-3',current:1,target:3,status:'IN_PROGRESS'}],achievement:[],event:[]};
 };
 const {market}=createLiveApi(request,storage);
 await assert.rejects(market.visit('seomun'),/offline/);
 assert.equal(cache.size,0);
 fail=false;const result=await market.visit('seomun');
 assert.equal(calls[1][0],'/stores/seomun/browse');assert.equal(calls[1][1].method,'POST');
 assert.equal(result.quests.daily[0].current,1);assert.deepEqual(result.visits,['seomun']);
});
