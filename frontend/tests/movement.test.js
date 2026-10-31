import test from 'node:test';
import assert from 'node:assert/strict';
import {isBlocked,movePlayer} from '../src/game/movement.js';

test('central road stays open and shops block entry from either side',()=>{
  assert.deepEqual(movePlayer({x:0,y:0},0,120),{x:0,y:120});
  const west=movePlayer({x:0,y:100},-95,0);
  const east=movePlayer({x:0,y:100},95,0);
  assert.equal(isBlocked(west),false);assert.equal(isBlocked(east),false);
  assert.ok(west.x>-24);assert.ok(east.x<52);
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
  assert.ok(p.x>-15);
  for(const [dx,dy] of [[12,0],[0,12],[-12,0],[0,-12]]){
    for(let i=0;i<100;i++){p=movePlayer(p,dx,dy);assert.equal(isBlocked(p),false);}
  }
});
