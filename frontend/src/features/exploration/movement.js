export const PLAYER_RADIUS = 12;
const SPEED = 110;

export function normalizeInput({ x, y }) {
  const length = Math.hypot(x, y);
  return length > 1 ? { x: x / length, y: y / length } : { x, y };
}

export function canOccupy(position, world, obstacles, radius = PLAYER_RADIUS) {
  if (position.x < radius || position.x > world.width - radius ||
      position.y < radius || position.y > world.height - radius) return false;
  return !obstacles.some((box) =>
    position.x > box.x - radius && position.x < box.x + box.width + radius &&
    position.y > box.y - radius && position.y < box.y + box.height + radius);
}

// 화면 배율과 무관한 월드 좌표. 작은 단계로 나눠 낮은 프레임에서도 벽을 통과하지 않는다.
export function movePlayer(position, input, seconds, world, obstacles) {
  const direction = normalizeInput(input);
  const distance = SPEED * Math.max(0, Math.min(seconds, 0.1));
  const steps = Math.max(1, Math.ceil(distance / 4));
  let next = { ...position };
  for (let i = 0; i < steps; i += 1) {
    const horizontal = { ...next, x: next.x + direction.x * distance / steps };
    if (canOccupy(horizontal, world, obstacles)) next = horizontal;
    const vertical = { ...next, y: next.y + direction.y * distance / steps };
    if (canOccupy(vertical, world, obstacles)) next = vertical;
  }
  return next;
}
