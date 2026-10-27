import { useEffect, useRef } from 'react';
import { movePlayer } from './movement.js';
import { WORLD, obstacles } from '../../mocks/market.js';

const directions = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };

export function useMovement(enabled, setPosition) {
  const pointerInput = useRef({ x: 0, y: 0 });
  useEffect(() => {
    pointerInput.current = { x: 0, y: 0 };
    if (!enabled) return;
    const keys = new Set();
    let frame;
    let previous;
    const clear = () => { keys.clear(); pointerInput.current = { x: 0, y: 0 }; previous = undefined; };
    const keydown = (event) => {
      if (!directions[event.key] || event.ctrlKey || event.metaKey || event.altKey ||
          event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault(); keys.add(event.key);
    };
    const keyup = (event) => keys.delete(event.key);
    const tick = (time) => {
      if (previous !== undefined && !document.hidden) {
        let { x, y } = pointerInput.current;
        for (const key of keys) { x += directions[key][0]; y += directions[key][1]; }
        if (x || y) setPosition((position) => movePlayer(position, { x, y }, (time - previous) / 1000, WORLD, obstacles));
      }
      previous = time;
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); clear();
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', clear);
    };
  }, [enabled, setPosition]);
  return pointerInput;
}
