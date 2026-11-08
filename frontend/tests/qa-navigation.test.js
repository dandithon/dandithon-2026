import test from 'node:test';
import assert from 'node:assert/strict';
import {readRoute,routeHash} from '../src/game/routes.js';
import {validNickname} from '../src/game/nickname.js';

test('shared store and menu links round-trip while market and start have distinct URLs',()=>{
  for(const hash of ['#store/coffee','#menu/noodle/reviews','#menu/hotteok/info','#market',''])assert.equal(routeHash(readRoute(hash)),hash);
  assert.equal(readRoute('#unknown').page,'start');
  assert.equal(readRoute('#menu/noodle/unknown').tab,'menu');
});
test('nickname uses code points after trimming and rejects blank, long and control input',()=>{
  for(const value of ['조웅',' ABCDEFGH ','😀'.repeat(8)])assert.equal(validNickname(value),true);
  for(const value of ['', '   ','ABCDEFGHI','😀'.repeat(9),'조\n웅'])assert.equal(validNickname(value),false);
});
