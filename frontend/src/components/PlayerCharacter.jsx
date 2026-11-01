import React,{useEffect,useState,useId} from 'react';
import sprites from '../assets/character.json';

const directions={down:0,right:1,left:1,up:2};
const labels={down:'정면',up:'뒷모습',left:'왼쪽',right:'오른쪽'};
// Registration offsets keep the head and feet anchored between generated frames.
const alignment=[[[ -18,0],[4,0],[19,0]],[[-16,6],[0,6],[17,6]],[[-11,25],[0,25],[12,25]]];
const cuts=[[58.5,82],[51,78],[47.5,76]];
const sequence=[0,1,0,2];

export default function PlayerCharacter({direction='up',equipped={},moving=false}){
  const [step,setStep]=useState(0);
  const paletteId=useId().replaceAll(':','');
  useEffect(()=>{
    setStep(0);
    if(!moving)return;
    const timer=setInterval(()=>setStep(value=>(value+1)%sequence.length),140);
    return()=>clearInterval(timer);
  },[moving]);
  const row=directions[direction]??0,frame=moving?sequence[step]:0;
  const [headEnd,bodyEnd]=cuts[row],offset=alignment[row][frame];
  const layers=[
    {slot:'head',top:0,bottom:100-headEnd,worn:equipped.head==='tteok-hat'},
    {slot:'body',top:headEnd,bottom:100-bodyEnd,worn:equipped.body==='tteok-jacket'},
    {slot:'feet',top:bodyEnd,bottom:0,worn:equipped.feet==='tteok-shoes'},
  ];
  const spriteStyle={width:'300%',height:'300%',maxWidth:'none',left:`-${frame*100}%`,top:`-${row*100}%`};
  return <div role="img" aria-label={`승우 캐릭터 ${labels[direction]}${moving?' 걷는 중':''}`} className="player-character relative size-full pointer-events-none" data-direction={direction} data-moving={moving} data-frame={frame} data-equipment={Object.values(equipped).sort().join(',')}>
    {/* Lift only near-black pixels toward the original Figma brown outline. */}
    <svg aria-hidden="true" width="0" height="0" className="absolute"><defs><filter id={paletteId} colorInterpolationFilters="sRGB" x="-10%" y="-10%" width="120%" height="120%">
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -2 -2 -2 0 1" result="darkness"/>
      <feComposite in="darkness" in2="SourceAlpha" operator="in" result="outlineMask"/>
      <feFlood floodColor="#3e2822" result="outlineBrown"/>
      <feComposite in="outlineBrown" in2="outlineMask" operator="in" result="softOutline"/>
      <feComposite in="softOutline" in2="SourceGraphic" operator="over"/>
    </filter></defs></svg>
    <div className="absolute top-0 h-full aspect-square" style={{filter:`url(#${paletteId})`,left:'50%',transform:`translateX(-50%) scaleX(${direction==='left'?-1:1})`}}>
      <div className="absolute inset-0" style={{transform:`translate(${offset[0]/418*100}%,${offset[1]/418*100}%)`}}>
        {layers.map(layer=><div key={layer.slot} data-slot={layer.slot} data-worn={layer.worn} className="absolute inset-0 overflow-hidden" style={{clipPath:`inset(${layer.top}% 0 ${layer.bottom}% 0)`}}>
          <img alt="" draggable={false} className="absolute pixelated" src={layer.worn?sprites.atlases.outfit:sprites.atlases.base} style={spriteStyle}/>
        </div>)}
        {equipped.neck==='tteok-scarf'&&<div data-slot="neck" className="absolute inset-0 overflow-hidden" style={{transform:`translate(${[4,9,1][row]}%,${[7.5,5,6][row]}%) scale(.45)`}}><img alt="" draggable={false} className="absolute pixelated" src={sprites.atlases.scarf} style={spriteStyle}/></div>}
      </div>
    </div>
  </div>;
}
