import test from 'node:test';
import assert from 'node:assert/strict';
import { movePlayer, canOccupy } from './movement.js';
import { WORLD, obstacles, START_POSITION } from '../../mocks/market.js';

test('임시 시작 위치는 가게 또는 지도 경계와 겹치지 않는다', () => {
  assert.equal(canOccupy(START_POSITION, WORLD, obstacles), true);
});
test('이동 시간 분할과 무관하게 같은 거리를 이동한다', () => {
  let result = START_POSITION;
  for (let i = 0; i < 10; i += 1) result = movePlayer(result, { x: 0, y: 1 }, .01, WORLD, obstacles);
  const single = movePlayer(START_POSITION, { x: 0, y: 1 }, .1, WORLD, obstacles);
  assert.ok(Math.abs(result.y - single.y) < .00001);
});
test('대각선 입력으로 이동 속도가 빨라지지 않는다', () => {
  const start = { x: 200, y: 280 };
  const straight = movePlayer(start, { x: 1, y: 0 }, .1, WORLD, obstacles);
  const diagonal = movePlayer(start, { x: 1, y: 1 }, .1, WORLD, obstacles);
  assert.ok(Math.abs(Math.hypot(diagonal.x - start.x, diagonal.y - start.y) - (straight.x - start.x)) < .00001);
});
test('지속적인 입력으로도 가게 벽과 지도 경계를 통과하지 않는다', () => {
  let wall = { x: 200, y: 180 };
  let boundary = { x: 200, y: 680 };
  for (let i = 0; i < 100; i += 1) {
    wall = movePlayer(wall, { x: -1, y: 0 }, .1, WORLD, obstacles);
    boundary = movePlayer(boundary, { x: 0, y: 1 }, .1, WORLD, obstacles);
  }
  assert.ok(wall.x >= 162);
  assert.ok(boundary.y <= 708);
  assert.equal(canOccupy(wall, WORLD, obstacles), true);
});
test('탭 복귀 후 큰 시간 차이가 순간 이동을 만들지 않는다', () => {
  const result = movePlayer(START_POSITION, { x: 0, y: 1 }, 60, WORLD, obstacles);
  assert.ok(result.y - START_POSITION.y <= 11.00001);
});
test('입력이 없으면 위치가 유지된다', () => {
  assert.deepEqual(movePlayer(START_POSITION, { x: 0, y: 0 }, .1, WORLD, obstacles), START_POSITION);
});
