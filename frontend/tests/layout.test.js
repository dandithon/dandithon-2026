import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneLayout} from '../src/game/layout.js';
import {followPlayer,clampCamera} from '../src/game/camera.js';

test('phone controls stay inside the visible height without horizontal overflow',()=>{
  for(const [width,height] of [[390,620],[390,720],[360,590],[412,790],[320,460]]){
    const layout=sceneLayout(width,height,true);
    assert.ok(402*layout.scale<=width+.001);
    assert.ok(layout.height*layout.scale<=height+.001);
    const shift=layout.height-874;
    // Both rendered joystick artwork and its hit target move together.
    assert.ok((630+shift)*layout.scale>=0);
    assert.ok((849+shift)*layout.scale<height);
    assert.ok((824+shift)*layout.scale<height);
  }
});
test('short market viewport follows the player and can reveal the south of the world',()=>{
  const view={width:402,height:620};
  const center=followPlayer({zoom:1,x:0,y:0},{x:0,y:0},view);
  assert.equal(center.y,-127);
  const south=followPlayer(center,{x:0,y:300},view);
  assert.equal(south.y,620-874);
  assert.deepEqual(clampCamera({zoom:1,x:100,y:-999},view),{zoom:1,x:0,y:620-874});
});
test('start, shop and landscape screens preserve their full design within the viewport',()=>{
  for(const [width,height] of [[390,620],[740,320],[402,900]]){
    const layout=sceneLayout(width,height,false);
    assert.equal(layout.height,874);
    assert.ok(402*layout.scale<=width);
    assert.ok(874*layout.scale<=height+.001);
  }
});
