import test from 'node:test';
import assert from 'node:assert/strict';

test('profile changes persist, refuse locked equipment and report failed storage',async()=>{
  const records=new Map();globalThis.localStorage={getItem:k=>records.get(k)||null,setItem:(k,v)=>records.set(k,v)};
  const {explorationApi}=await import('../src/api/exploration.js');
  assert.equal((await explorationApi.load()).nickname,'승우');
  await assert.rejects(explorationApi.equip('tteok-jacket'));
  assert.equal((await explorationApi.equip('tteok-hat')).equipped.head,'tteok-hat');
  assert.equal((await explorationApi.equip('tteok-hat')).equipped.head,undefined);
  await explorationApi.rename('조웅');assert.equal((await explorationApi.load()).nickname,'조웅');
  await assert.rejects(explorationApi.rename('   '));
  const saved=records.get('dandithon-exploration-v1');
  localStorage.setItem=()=>{throw Error('quota');};
  await assert.rejects(explorationApi.rename('다른이름'),/저장/);
  assert.equal(records.get('dandithon-exploration-v1'),saved);
  records.set('dandithon-exploration-v1','broken');
  await assert.rejects(explorationApi.load(),/프로필/);
});
