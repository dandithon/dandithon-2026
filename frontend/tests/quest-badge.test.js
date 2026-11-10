import test from 'node:test';
import assert from 'node:assert/strict';
import {hasClaimableQuest} from '../src/game/quests.js';
import {readRoute} from '../src/game/routes.js';
test('quest dot follows unclaimed completion across all quest groups',()=>{
  assert.equal(hasClaimableQuest({}),false);
  for(const group of ['daily','achievement','event']){
    const task={id:'quest',status:'IN_PROGRESS',current:3,target:3};
    const state={quests:{[group]:[task]},claimed:[]};
    assert.equal(hasClaimableQuest(state),false);
    task.status='COMPLETED';
    assert.equal(hasClaimableQuest(state),true);
    state.claimed.push(task.id);
    assert.equal(hasClaimableQuest(state),false);
    state.claimed=[];task.status='CLAIMED';
    assert.equal(hasClaimableQuest(state),false);
  }
});
test('removed summary deep links open the menu',()=>{
  assert.deepEqual(readRoute('#menu/coffee/summary'),{page:'menu',storeId:'coffee',tab:'menu'});
});
