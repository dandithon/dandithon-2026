import React,{useEffect,useState} from 'react';
import MapArtwork from '../components/MapArtwork';
import manifest from '../assets/figma.json';
import {movePlayer} from '../game/movement';
export default function MarketPage({state,onStore,onModal,notify,overlay}){
  const [joystick,setJoystick]=useState(true),[position,setPosition]=useState({x:0,y:0}),[direction,setDirection]=useState('up');
  const move=(x,y)=>{
    setDirection(y>0?'down':y<0?'up':x>0?'right':'left');
    setPosition(p=>movePlayer(p,x,y));
  };
  useEffect(()=>{const key=e=>{if(overlay||!joystick)return;const d={ArrowUp:[0,-12],ArrowDown:[0,12],ArrowLeft:[-12,0],ArrowRight:[12,0]}[e.key];if(d){e.preventDefault();move(...d);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[overlay,joystick]);
  const screen=overlay==='receipts'?'125:1186':overlay==='quests'?'125:1213':joystick?'40:41':'138:1528';
  return <section className="relative size-full overflow-hidden" aria-label="서문시장 지도">
    <MapArtwork assets={manifest[screen]} balance={state.balance} joystick={joystick} position={position} direction={direction} overlay={screen==='125:1186'||screen==='125:1213'}/>
    <button aria-label="서문분식 들어가기" onClick={()=>onStore('seomun')} className="absolute left-[15px] top-[136px] h-[153px] w-[148px] rounded-xl"/>
    <button aria-label="칼국수 가게 방문" onClick={()=>onStore('noodle')} className="absolute left-[268px] top-[136px] h-[140px] w-[58px]"/>
    <button aria-label="호떡 가게 방문" onClick={()=>onStore('hotteok')} className="absolute left-[10px] top-[493px] h-[155px] w-[150px]"/>
    <button aria-label="커피 디저트 가게 방문" onClick={()=>onStore('coffee')} className="absolute left-[270px] top-[493px] h-[155px] w-[122px]"/>
    <button aria-label="지도 안내" onClick={()=>notify('가게를 누르면 입장해요. 방향키 또는 화면의 화살표로 이동할 수 있어요.')} className="absolute left-[328px] top-[174px] size-[64px]"/>
    <button aria-label="퀘스트 열기" onClick={()=>onModal('quests')} className="absolute left-[327px] top-[258px] size-[64px]"/>
    <button aria-label="내 영수증 열기" onClick={()=>onModal('receipts')} className="absolute left-[327px] top-[342px] size-[64px]"/>
    <button aria-label="코인 안내" onClick={()=>notify('데모 코인이에요. 퀘스트를 완료하면 보상을 받을 수 있어요.')} className="absolute left-[345px] top-[65px] size-[44px]"/>
    <button aria-label="프로필 보기" onClick={()=>notify('승우 · 서문시장을 탐험하는 여행자')} className="absolute left-[5px] top-[47px] h-[71px] w-[178px]"/>
    <button aria-label="이동 조작 표시" aria-pressed={joystick} onClick={()=>setJoystick(x=>!x)} className="absolute left-[306px] top-[761px] h-[63px] w-[93px]"/>
    {joystick&&<div aria-label="방향 조작">
      <button aria-label="위로 이동" onClick={()=>move(0,-12)} className="absolute left-[69px] top-[667px] size-[50px]"/>
      <button aria-label="아래로 이동" onClick={()=>move(0,12)} className="absolute left-[69px] top-[767px] size-[50px]"/>
      <button aria-label="왼쪽으로 이동" onClick={()=>move(-12,0)} className="absolute left-[18px] top-[716px] size-[50px]"/>
      <button aria-label="오른쪽으로 이동" onClick={()=>move(12,0)} className="absolute left-[121px] top-[716px] size-[50px]"/>
    </div>}
  </section>;
}
