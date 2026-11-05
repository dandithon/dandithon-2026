import React,{useEffect,useRef,useState} from 'react';
import StoreSpotlight from '../components/StoreSpotlight';
import {storeLocationCamera} from '../game/storeLocation';
import MapArtwork from '../components/MapArtwork';
import manifest from '../assets/figma.json';
import useExploration from '../game/useExploration';
import {getStore} from '../api/catalog';
import CrowdLayer from '../components/CrowdLayer';
import useGeolocation,{locationMessages} from '../game/useGeolocation';
import {mapCalibration} from '../game/mapCalibration';
export default function MarketPage({state,onStore,onModal,notify,overlay,active=true,preferences,progress,waits,sceneHeight=874,locationPreview,onReturnLocation}){
  const [joystick,setJoystick]=useState(true);
  const {position,direction,moving,camera,stick,mapHandlers,stickHandlers,centerOn,setViewCamera}=useExploration(active&&!overlay&&joystick&&!locationPreview,sceneHeight);
  const gps=useGeolocation(active&&!overlay&&!joystick&&!locationPreview,mapCalibration);
  const displayPosition=!joystick&&gps.point?gps.point:position;
  useEffect(()=>{if(locationPreview)return;if(!joystick&&gps.point)centerOn(gps.point);else if(joystick)centerOn(position);},[joystick,gps.point,centerOn,locationPreview]);
  const savedCamera=useRef(null);
  useEffect(()=>{
    if(locationPreview){
      if(!savedCamera.current)savedCamera.current={...camera};
      setViewCamera(storeLocationCamera(locationPreview.storeId,sceneHeight));
    }else if(savedCamera.current){setViewCamera(savedCamera.current);savedCamera.current=null;}
  },[locationPreview?.storeId,sceneHeight,setViewCamera]);
  // Dialogs shade the live map; they must never swap its world artwork.
  const screen=joystick?'40:41':'138:1528';
  return <section className="relative size-full overflow-hidden" aria-label="서문시장 지도">
    <div className="absolute left-0 top-0 h-[874px] w-full touch-none select-none" {...(locationPreview?{}:mapHandlers)}>
      <MapArtwork layer="world" assets={manifest['40:41']} position={displayPosition} direction={direction} moving={moving} camera={camera} equipped={progress.equipped}>
    <div className="contents" inert={locationPreview?true:undefined}>
    <button aria-label="서문분식 들어가기" onClick={()=>onStore('seomun')} className="absolute left-[15px] top-[136px] h-[153px] w-[148px] rounded-xl"/>
    <button aria-label="칼국수 가게 방문" onClick={()=>onStore('noodle')} className="absolute left-[268px] top-[136px] h-[140px] w-[58px]"/>
    <button aria-label="호떡 가게 방문" onClick={()=>onStore('hotteok')} className="absolute left-[10px] top-[493px] h-[155px] w-[150px]"/>
    <button aria-label="커피 디저트 가게 방문" onClick={()=>onStore('coffee')} className="absolute left-[270px] top-[493px] h-[155px] w-[122px]"/>
    </div>
        <CrowdLayer store={getStore('seomun')} minutes={waits.seomun}/>
        {locationPreview&&<StoreSpotlight store={getStore(locationPreview.storeId)}/>}
      </MapArtwork>
    </div>
    <div className={locationPreview?'hidden':'contents'} inert={locationPreview?true:undefined} aria-hidden={locationPreview?true:undefined}>
    <div className="pointer-events-none absolute inset-0"><MapArtwork assets={manifest[screen]} nickname={preferences.nickname} balance={state.balance} joystick={joystick} stick={stick}/></div>
    <button aria-label="전체 지도 열기" onClick={()=>onModal('map')} className="hud-action absolute left-[328px] top-[174px] size-[64px]"/>
    <button aria-label="퀘스트 열기" onClick={()=>onModal('quests')} className="hud-action absolute left-[327px] top-[258px] size-[64px]"/>
    <button aria-label="내 영수증 열기" onClick={()=>onModal('receipts')} className="hud-action absolute left-[327px] top-[342px] size-[64px]"/>
    <button aria-label="코인 충전 열기" onClick={()=>onModal('coins')} className="hud-action absolute left-[345px] top-[65px] size-[44px]"/>
    <button aria-label="프로필 보기" onClick={()=>onModal('profile')} className="hud-action absolute left-[5px] top-[47px] h-[71px] w-[178px]"/>
    <button aria-label="이동 조작 표시" aria-pressed={joystick} onClick={()=>setJoystick(x=>!x)} className="market-bottom-control absolute left-[306px] top-[761px] h-[63px] w-[93px]"/>
    {!joystick&&<section role="status" className="absolute bottom-[125px] left-5 right-5 rounded-xl border border-[#c9a989] bg-paper p-3 text-xs leading-5 shadow"><p>GPS 모드 · {locationMessages[gps.status]}</p>{gps.accuracy!==undefined&&<p>현재 위치 오차 약 {gps.accuracy}m</p>}{gps.status!=='mapped'&&<p>캐릭터는 마지막 위치에 표시돼요. 실제 방문은 기록하지 않아요.</p>}{['denied','timeout','unavailable'].includes(gps.status)&&<button onClick={gps.retry} className="mt-2 underline">위치 다시 확인</button>}</section>}
    {joystick&&<div role="group" aria-label="이동 조이스틱" tabIndex={0} className="market-bottom-control absolute left-[17px] top-[665px] size-[160px] touch-none select-none rounded-full focus-visible:outline-2 focus-visible:outline-blue-500" {...stickHandlers}><span className="sr-only">드래그하여 이동. 키보드는 방향키 또는 WASD.</span></div>}
    </div>
    {locationPreview&&<section role="status" className="absolute inset-x-3 top-3 rounded-xl border-2 border-[#946034] bg-[#fff4df] p-3 shadow-lg">
      <button autoFocus onClick={onReturnLocation} className="rounded-lg border border-[#b78a55] bg-[#ffdc8a] px-3 py-2 font-retro text-sm">← 가게 상세로 돌아가기</button>
      <p className="mt-2 text-xs text-[#806453]">{getStore(locationPreview.storeId).name} · 게임 지도에서의 위치입니다.</p>
    </section>}
  </section>;
}
