import test from 'node:test';
import assert from 'node:assert/strict';
import {isBlocked,movePlayer,resolvePosition,playerOrigin} from '../src/game/movement.js';

test('central road stays open and shops block entry from either side',()=>{
  assert.deepEqual(movePlayer({x:0,y:0},0,120),{x:0,y:120});
  const west=movePlayer({x:0,y:100},-95,0);
  const east=movePlayer({x:0,y:100},95,0);
  assert.equal(isBlocked(west),false);assert.equal(isBlocked(east),false);
  assert.ok(west.x>-31);assert.ok(east.x<58);
  assert.deepEqual(movePlayer(west,-12,0),west);
  assert.deepEqual(movePlayer(east,12,0),east);
});
test('cannot tunnel into shops from below; can retreat and walk around',()=>{
  const start={x:-90,y:220};
  const stopped=movePlayer(start,0,-200);
  assert.ok(stopped.y>=196);assert.equal(isBlocked(stopped),false);
  assert.ok(movePlayer(stopped,0,12).y>stopped.y);
  assert.deepEqual(movePlayer(start,90,0),{x:0,y:220});
});
test('planters block movement and repeated steps never enter obstacles',()=>{
  let p={x:0,y:0};
  for(let i=0;i<50;i++){p=movePlayer(p,-12,0);assert.equal(isBlocked(p),false);}
  assert.ok(p.x>-38);
  for(const [dx,dy] of [[12,0],[0,12],[-12,0],[0,-12]]){
    for(let i=0;i<100;i++){p=movePlayer(p,dx,dy);assert.equal(isBlocked(p),false);}
  }
});


test('all four cross streets and the north/south entrances are reachable',()=>{
  const north=movePlayer({x:0,y:0},0,-1000);
  const south=movePlayer({x:0,y:0},0,1000);
  assert.ok(north.y < -350);assert.ok(south.y > 370);
  for(const y of [-143,220]){
    const crossing=movePlayer({x:0,y:0},0,y);
    assert.ok(movePlayer(crossing,-300,0).x < -170);
    assert.ok(movePlayer(crossing,300,0).x > 170);
  }
  assert.equal(isBlocked(north),false);assert.equal(isBlocked(south),false);
});


test('coffee-side flowerbeds and lamps cannot be stepped on',()=>{
  const at=(x,y)=>({x:x-playerOrigin.x,y:y-playerOrigin.y});
  for(const [x,y] of [[250,550],[250,620],[155,550],[140,345],[265,345],[45,380],[360,380]])assert.equal(isBlocked(at(x,y)),true);
  const stopped=movePlayer(at(201.5,550),100,0);
  assert.ok(stopped.x+playerOrigin.x<=223);
  assert.equal(isBlocked(stopped),false);
  assert.deepEqual(movePlayer(stopped,100,0),stopped);
});

test('positions left inside a newly corrected flowerbed recover to a nearby road',()=>{
  const stuck={x:250-playerOrigin.x,y:550-playerOrigin.y};
  const recovered=resolvePosition(stuck);
  assert.equal(isBlocked(recovered),false);
  assert.ok(Math.hypot(stuck.x-recovered.x,stuck.y-recovered.y)<40);
  assert.deepEqual(movePlayer(stuck,0,0),recovered);
});
