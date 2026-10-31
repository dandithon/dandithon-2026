import React from 'react';
import {hasOutfit} from '../game/progression';
import art from '../assets/exploration.json';

const labels={down:'정면',up:'뒷모습',left:'왼쪽',right:'오른쪽'};
export default function PlayerCharacter({direction='up',backImage,equipped={}}){
  if(direction==='down'&&hasOutfit(equipped))return <img alt="장비를 착용한 캐릭터 정면" src={art.profile.imgImage111} draggable={false} className="pointer-events-none size-full object-contain"/>;
  const side=direction==='left'||direction==='right';
  const src=direction==='up'?backImage:side?'/assets/character-side.png':'/assets/character-front.png';
  const geometry=direction==='up'?'inset-0 size-full object-cover':side?'h-[96.26%] left-[11.23%] top-[1.93%] w-[77.49%]':'h-[82.96%] left-[12.88%] top-[8.34%] w-[75.86%]';
  return <div className={`relative size-full overflow-hidden ${direction==='left'?'-scale-x-100':''}`} data-direction={direction}>
    <img alt={`승우 캐릭터 ${labels[direction]}`} draggable={false} className={`pointer-events-none absolute max-w-none ${geometry}`} src={src}/>
  </div>;
}
