import React,{useEffect,useRef,useState} from 'react';
import StoreSpotlight from '../components/StoreSpotlight';
import {storeLocationCamera} from '../game/storeLocation';
import MapArtwork from '../components/MapArtwork';
import manifest from '../assets/figma.json';
import useExploration from '../game/useExploration';
import {getStore} from '../api/catalog';
import CrowdLayer from '../components/CrowdLayer';
import useGeolocation from '../game/useGeolocation';
import GpsStatus from '../components/GpsStatus';
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
    {state.waitsStale&&!locationPreview&&<p role="status" className="absolute inset-x-4 top-2 z-10 rounded border border-[#c9a989] bg-[#fff4df] px-3 py-1 text-center text-[10px] text-[#805532]">대기정보 갱신 지연 · 마지막 확인 정보를 표시해요.</p>}
    <div className="absolute left-0 top-0 w-full touch-none select-none" style={{height:sceneHeight}} {...(locationPreview?{}:mapHandlers)}>
      <MapArtwork layer="world" assets={manifest['40:41']} position={displayPosition} direction={direction} moving={moving} camera={camera} equipped={progress.equipped}>
    <div className="contents" inert={locationPreview?true:undefined}>
    <button aria-label="서문분식 들어가기" onClick={()=>onStore('seomun')} className="absolute left-[15px] top-[136px] h-[153px] w-[148px] rounded-xl"/>
    <button aria-label="시장칼국수 방문" onClick={()=>onStore('noodle')} className="absolute left-[249px] top-[136px] h-[140px] w-[142px] rounded-xl"/>
    <button aria-label="달콤호떡 방문" onClick={()=>onStore('hotteok')} className="absolute left-[10px] top-[493px] h-[155px] w-[150px]"/>
    <button aria-label="골목카페 방문" onClick={()=>onStore('coffee')} className="absolute left-[270px] top-[493px] h-[155px] w-[122px]"/>
    </div>
        <CrowdLayer store={getStore('seomun')} minutes={waits.seomun}/>
        {locationPreview&&<StoreSpotlight store={getStore(locationPreview.storeId)}/>}
      </MapArtwork>
    </div>
    <div className={locationPreview?'hidden':'contents'} inert={locationPreview?true:undefined} aria-hidden={locationPreview?true:undefined}>
    <div className="pointer-events-none absolute inset-0"><MapArtwork assets={manifest[screen]} nickname={preferences.nickname} balance={state.balance} joystick={joystick} stick={stick}/></div>
    <button aria-label="전체 지도 열기" onClick={()=>onModal('map')} className="hud-action absolute left-[328px] top-[174px] size-[64px]"/>
    <button aria-label="퀘스트 열기" onClick={()=>onModal('quests')} className="hud-action absolute left-[327px] top-[258px] size-[64px]"/>
    <button aria-label="내 영수증 열기" onClick={()=>onModal('receipts')} className="hud-action absolute left-[327px] top-[342px] size-[64px]">
      {state.orders.some(order=>order.status==='ready')&&<><span aria-hidden="true" className="absolute right-1 top-1 size-4 rounded-full border-2 border-[#fff4df] bg-orange-500 shadow"/><span className="sr-only">리뷰를 기다리는 조리 완료 주문이 있어요</span></>}
    </button>
    <button aria-label="코인 충전 열기" onClick={()=>onModal('coins')} className="hud-action absolute left-[345px] top-[65px] size-[44px]"/>
    <button aria-label="프로필 보기" onClick={()=>onModal('profile')} className="hud-action absolute left-[5px] top-[47px] h-[71px] w-[178px]"/>
    <button aria-label="발표 시연 컨트롤러 열기" onClick={()=>onModal('demo')} className="absolute left-[190px] top-[50px] z-20 flex h-[26px] items-center gap-1 rounded-full border-2 border-[#80502c] bg-[#ffeecb] px-2.5 font-retro text-[10px] text-[#513724] shadow-md hover:bg-[#ffdc8a] active:translate-y-0.5">🛠️ DEMO</button>
    <button aria-label="이동 조작 표시" aria-pressed={joystick} onClick={()=>setJoystick(x=>!x)} className="market-bottom-control absolute left-[306px] top-[761px] h-[63px] w-[93px]"/>
    {!joystick&&<GpsStatus gps={gps} onJoystick={()=>setJoystick(true)}/>}
    {joystick&&<div role="group" aria-label="이동 조이스틱" tabIndex={0} className="market-bottom-control absolute left-[17px] top-[665px] size-[160px] touch-none select-none rounded-full focus-visible:outline-2 focus-visible:outline-blue-500" {...stickHandlers}><span className="sr-only">드래그하여 이동. 키보드는 방향키 또는 WASD.</span></div>}
    </div>
    {locationPreview&&<button type="button" autoFocus onClick={onReturnLocation} aria-label="가게 상세로 돌아가기" className="absolute left-4 top-4 flex min-h-11 items-center gap-2 border-[3px] border-[#513724] bg-[#ffdf96] px-3 py-2 font-retro text-sm text-[#513724] shadow-[inset_0_3px_0_#fff2ca,inset_0_-3px_0_#c48a45,0_3px_0_#513724] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#fff2ca]">
      <span aria-hidden="true" className="text-xl leading-none">←</span>가게로 돌아가기
    </button>}
  </section>;
}
