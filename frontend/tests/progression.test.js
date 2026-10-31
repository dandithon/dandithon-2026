import test from 'node:test';
import assert from 'node:assert/strict';
import {purchaseCounts,progression,badges,hasOutfit} from '../src/game/progression.js';
import {crowdLevel} from '../src/game/crowd.js';
import {projectLocation} from '../src/game/geolocation.js';

test('purchase frequency excludes duplicate and failed orders, not multiplied by quantity',()=>{
  const one={id:'a',itemId:'tteok',quantity:20,status:'ready'};
  assert.deepEqual(purchaseCounts([one,one,{...one,id:'b',status:'cancelled'},{...one,id:'c',status:'reviewed'}]),{tteok:2});
});
test('equipment eligibility and badges share purchase counts without granting locked gear',()=>{
  const orders=Array.from({length:5},(_,i)=>({id:String(i),itemId:'tteok',status:'ready'}));
  const result=progression({orders},{equipped:{head:'tteok-hat',body:'tteok-jacket',feet:'tteok-shoes',neck:'tteok-scarf'}});
  assert.equal(result.items.filter(i=>i.unlocked).length,3);
  assert.equal(result.equipped.neck,undefined);
  assert.equal(hasOutfit(result.equipped),true);
  assert.deepEqual(badges(5).earned.map(b=>b.name),['브론즈','실버']);
  assert.equal(badges(9).next.count,10);assert.equal(badges(10).next,null);
  assert.deepEqual(progression({orders:[]},{equipped:result.equipped}).equipped,{});
});
test('crowd handles boundaries and unknown data',()=>{
  assert.equal(crowdLevel(null).count,0);assert.equal(crowdLevel(-1).count,0);
  assert.equal(crowdLevel(5).count,1);assert.equal(crowdLevel(6).count,3);
  assert.equal(crowdLevel(15).count,5);assert.equal(crowdLevel(21).count,7);
});
const calibration={maxAccuracy:30,anchors:[{latitude:1,longitude:1,x:0,y:0},{latitude:1,longitude:2,x:402,y:0},{latitude:2,longitude:1,x:0,y:874}]};
test('GPS never invents a location without calibration or sufficient accuracy',()=>{
  const coords={latitude:1.5,longitude:1.5,accuracy:5};
  assert.equal(projectLocation(coords,null).status,'unmapped');
  assert.deepEqual(projectLocation(coords,calibration),{status:'mapped',point:{x:-.5,y:-21}});
  assert.equal(projectLocation({...coords,accuracy:50},calibration).status,'inaccurate');
  assert.equal(projectLocation({...coords,longitude:3},calibration).status,'outside');
  assert.equal(projectLocation(coords,{...calibration,anchors:[calibration.anchors[0],calibration.anchors[0],calibration.anchors[0]]}).status,'invalid-config');
});
