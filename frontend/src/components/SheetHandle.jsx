import React,{useRef,useState} from 'react';

// Pointer coordinates are viewport pixels; the app renders on a scaled 402px canvas.
export default function SheetHandle({expanded=false,onToggle,onDrag}){
  const drag=useRef(null),skipClick=useRef(false);
  const [active,setActive]=useState(false);
  const reset=()=>{drag.current=null;setActive(false);onDrag?.(0);};
  return <button type="button" aria-label={expanded?'가게 정보로 돌아가기':'메뉴 펼치기'} aria-expanded={expanded}
    className={`mx-auto mt-[4px] flex h-[36px] w-[140px] shrink-0 touch-none select-none items-start justify-center pt-[9px] ${active?'cursor-grabbing':'cursor-grab'}`}
    onPointerDown={e=>{if(!e.isPrimary||e.button!==0)return;skipClick.current=false;drag.current={y:e.clientY,scale:e.currentTarget.getBoundingClientRect().width/140};e.currentTarget.setPointerCapture(e.pointerId);setActive(true);}}
    onPointerMove={e=>{if(!drag.current)return;if(Math.abs(e.clientY-drag.current.y)>6)skipClick.current=true;onDrag?.((e.clientY-drag.current.y)/drag.current.scale);}}
    onPointerUp={e=>{const start=drag.current;if(!start)return;const distance=(e.clientY-start.y)/start.scale;reset();if(Math.abs(distance)>6)skipClick.current=true;if((expanded&&distance>40)||(!expanded&&distance< -40))onToggle();}}
    onPointerCancel={()=>{skipClick.current=true;reset();}} onLostPointerCapture={reset}
    onClick={e=>{if(e.detail!==0&&skipClick.current){skipClick.current=false;return;}onToggle();}}
    onKeyDown={e=>{if((!expanded&&e.key==='ArrowUp')||(expanded&&e.key==='ArrowDown')){e.preventDefault();onToggle();}}}>
    <span className={`h-[4px] w-[82px] rounded-full ${active?'bg-[#9d7855]':'bg-[#ccb8a2]'}`}/>
  </button>;
}
