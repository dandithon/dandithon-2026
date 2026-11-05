import React from 'react';
import {locationMessages} from '../game/useGeolocation';
export default function GpsStatus({gps,onJoystick}){
  const fallback=gps.status!=='mapped';
  return <section role="status" className="absolute bottom-[125px] left-5 right-5 rounded-xl border-2 border-[#b68d59] bg-paper p-3 text-xs leading-5 shadow-lg">
    <p className="font-retro">GPS 모드</p><p className="mt-1 font-sans">{locationMessages[gps.status]}</p>
    {gps.accuracy!==undefined&&<p className="text-[10px] text-muted">현재 위치 오차 약 {gps.accuracy}m</p>}
    {fallback&&<><p className="mt-1 font-sans text-[10px] text-muted">캐릭터는 마지막 위치를 유지해요. 위치를 확인할 수 없을 때는 조이스틱을 이용해 주세요.</p><button type="button" onClick={onJoystick} className="mt-2 min-h-11 w-full rounded border-2 border-[#946034] bg-[#ffdc8a] px-3 font-retro text-xs">조이스틱으로 돌아가기</button></>}
    {['denied','timeout','unavailable','inaccurate'].includes(gps.status)&&<button type="button" onClick={gps.retry} className="mt-1 min-h-11 w-full underline">위치 다시 확인</button>}
  </section>;
}
