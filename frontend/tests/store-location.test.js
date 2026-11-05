import test from 'node:test';
import assert from 'node:assert/strict';
import {storeLocations,storeLocationCamera} from '../src/game/storeLocation.js';

test('every selected store is visible inside short and full-height location previews',()=>{
  for(const height of [560,640,740,874])for(const id of ['seomun','noodle','hotteok','coffee']){
    const area=storeLocations[id],camera=storeLocationCamera(id,height);
    assert.equal(camera.zoom,1);
    assert.ok(area.x>=0&&area.x+area.width<=402);
    assert.ok(area.y+camera.y>=90,'highlight stays below the return banner');
    assert.ok(area.y+area.height+camera.y<=height,'highlight stays inside the visible scene');
  }
});
test('unknown store does not show an unrelated store location',()=>{
  assert.throws(()=>storeLocationCamera('unknown',640),/준비/);
});
