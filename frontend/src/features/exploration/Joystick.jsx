import { useRef, useState } from 'react';
import { normalizeInput } from './movement.js';

export default function Joystick({ input, disabled }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const activePointer = useRef(null);
  function update(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const value = normalizeInput({ x: (event.clientX - rect.left - rect.width / 2) / 34, y: (event.clientY - rect.top - rect.height / 2) / 34 });
    input.current = value;
    setOffset(value);
  }
  function reset() {
    activePointer.current = null;
    input.current = { x: 0, y: 0 }; setOffset({ x: 0, y: 0 });
  }
  return <div className="joystick-wrap">
    <button className="joystick" type="button" aria-label="이동 조이스틱. 방향키 또는 W A S D로도 이동할 수 있습니다." disabled={disabled}
      onPointerDown={(event) => {
        if (activePointer.current !== null || event.button !== 0) return;
        activePointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId); update(event);
      }}
      onPointerMove={(event) => { if (activePointer.current === event.pointerId) update(event); }}
      onPointerUp={(event) => { if (activePointer.current === event.pointerId) reset(); }}
      onPointerCancel={reset} onLostPointerCapture={reset} onBlur={reset}>
      <span className="joystick-arrows" aria-hidden="true">✦</span>
      <span className="joystick-thumb" style={{ transform: `translate(${disabled ? 0 : offset.x * 30}px, ${disabled ? 0 : offset.y * 30}px)` }} />
    </button>
    <span>가상 이동</span>
  </div>;
}
