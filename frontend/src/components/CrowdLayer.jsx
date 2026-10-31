import React from 'react';
import art from '../assets/exploration.json';
import {crowdLevel} from '../game/crowd';
const people=[['imgImage88',64,214],['imgImage90',102,237,{left:'0.24%',top:'-0.03%',width:'107.59%'}],['imgImage91',26,237],['imgImage92',65,262,{height:'90.81%',left:'-1.24%',top:'-0.22%',width:'114.18%'}],['imgImage93',65,307,{height:'94.39%',left:'0.47%',top:'5.61%',width:'111.75%'}],['imgImage94',26,272],['imgImage95',102,280]];
export default function CrowdLayer({minutes}){
  const {count,label}=crowdLevel(minutes);
  return <div className="pointer-events-none absolute inset-0" role="img" aria-label={`서문분식 시연 혼잡도: ${label}, ${minutes??'알 수 없음'}분`}>
    {people.slice(0,count).map(([name,left,top,crop])=><div key={name} className="absolute overflow-hidden" style={{left,top,width:39,height:85}}><img alt="" src={art.crowd[name]} className="absolute size-full max-w-none object-cover" style={crop}/></div>)}
    <img alt="" src={count<5?art.crowd.calmBubble:art.crowd.imgImage89} className="absolute left-[51px] top-[155px] h-[86px] w-[100px]"/>
    <p className="absolute left-[65px] top-[182px] w-[72px] text-center font-retro text-[11px] text-[#795548]">시연 대기시간</p>
    <p className="absolute left-[65px] top-[199px] w-[72px] text-center font-retro text-[10px]">{minutes===null?'정보 없음':`약 ${minutes}분`}</p>
    {count>=5&&<img alt="" src={art.crowd.imgImage97} className="absolute left-[59px] top-[286px] h-[49px] w-[50px]"/>}
    {count>=7&&<img alt="" src={art.crowd.imgImage97} className="absolute left-[94px] top-[251px] h-[49px] w-[50px]"/>}
  </div>;
}
