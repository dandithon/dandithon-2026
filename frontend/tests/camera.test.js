import test from 'node:test';
import assert from 'node:assert/strict';
import {clampCamera,zoomCamera,followPlayer,stickVector} from '../src/game/camera.js';

test('pinch keeps the world point under the moving midpoint',()=>{
  const before={zoom:1.5,x:-100,y:-200},from={x:180,y:300},to={x:200,y:320};
  const after=zoomCamera(before,from,to,1.2);
  assert.ok(Math.abs((from.x-before.x)/before.zoom-(to.x-after.x)/after.zoom)<1e-9);
  assert.ok(Math.abs((from.y-before.y)/before.zoom-(to.y-after.y)/after.zoom)<1e-9);
});
test('zoom and pan never expose empty space beyond the map',()=>{
  assert.deepEqual(clampCamera({zoom:.5,x:100,y:-300}),{zoom:1,x:0,y:0});
  assert.deepEqual(clampCamera({zoom:2,x:-9999,y:500}),{zoom:2,x:-402,y:0});
  assert.equal(clampCamera({zoom:9,x:0,y:0}).zoom,2.5);
});
test('movement returns camera to player without changing world coordinates',()=>{
  const position={x:0,y:100};
  const camera=followPlayer({zoom:2,x:0,y:0},position);
  assert.equal((201.5+position.x)*camera.zoom+camera.x,201);
  assert.equal((458+position.y)*camera.zoom+camera.y,458);
  assert.deepEqual(position,{x:0,y:100});
});
test('joystick clamps diagonal input to a circular radius',()=>{
  assert.deepEqual(stickVector(0,0),{x:0,y:0});
  assert.deepEqual(stickVector(12,-4),{x:12,y:-4});
  assert.ok(Math.abs(Math.hypot(...Object.values(stickVector(100,-100)))-44)<1e-9);
});
