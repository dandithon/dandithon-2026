import test from 'node:test';
import assert from 'node:assert/strict';
import {createFrameTask} from '../src/game/frameTask.js';

function setup(){
  let id=0;const frames=new Map();
  return {frames,task:createFrameTask(fn=>{frames.set(++id,fn);return id;},id=>frames.delete(id)),tick(){const ready=[...frames.values()];frames.clear();ready.forEach(fn=>fn());}};
}
test('many pointer samples produce one camera update with the latest pair of fingers',()=>{
  const {task,frames,tick}=setup();const updates=[];
  for(let i=0;i<120;i++)task.schedule(()=>updates.push(i));
  assert.equal(frames.size,1);tick();assert.deepEqual(updates,[119]);
  task.schedule(()=>updates.push(120));tick();assert.deepEqual(updates,[119,120]);
});
test('finger release flushes the last visual sample once without a delayed jump',()=>{
  const {task,tick}=setup();let updates=0;
  task.schedule(()=>updates++);task.flush();tick();assert.equal(updates,1);
});
test('closing or cancelling a gesture discards pending camera changes',()=>{
  const {task,tick}=setup();let updates=0;
  task.schedule(()=>updates++);task.cancel();tick();assert.equal(updates,0);
});
