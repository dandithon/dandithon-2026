import {useEffect,useState} from 'react';
import {projectLocation} from './geolocation';
export default function useGeolocation(active,calibration=null){
  const [location,setLocation]=useState({status:'idle',point:null}),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    if(!active)return;
    if(!window.isSecureContext){setLocation({status:'insecure',point:null});return;}
    if(!navigator.geolocation){setLocation({status:'unsupported',point:null});return;}
    let disposed=false;
    setLocation({status:'loading',point:null});
    const id=navigator.geolocation.watchPosition(({coords})=>{
      if(disposed)return;
      setLocation({...projectLocation(coords,calibration),accuracy:Math.round(coords.accuracy)});
    },error=>{if(!disposed)setLocation({status:({1:'denied',2:'unavailable',3:'timeout'})[error.code]||'unavailable',point:null});},{enableHighAccuracy:true,timeout:12000,maximumAge:5000});
    return()=>{disposed=true;navigator.geolocation.clearWatch(id);};
  },[active,attempt,calibration]);
  return {...location,retry:()=>setAttempt(n=>n+1)};
}
export const locationMessages={idle:'위치 확인 대기',loading:'위치를 확인하고 있어요…',unmapped:'위치는 수신했어요. 실제 위치와 시장 지도를 연결하는 기능은 준비 중이에요.',mapped:'GPS 위치로 이동 중',outside:'현재 위치가 시장 지도 밖이에요.',inaccurate:'GPS 신호가 약해요. 가상 조이스틱 모드를 추천해요.',denied:'위치 권한이 꺼져 있어요. 브라우저 설정을 확인해 주세요.',timeout:'위치 확인 시간이 초과됐어요.',unavailable:'위치를 가져올 수 없어요.',unsupported:'이 브라우저는 위치 기능을 지원하지 않아요.',insecure:'위치 기능은 HTTPS 연결에서 사용할 수 있어요.','invalid-config':'지도 좌표 설정을 확인해야 해요.','invalid-location':'올바른 위치 정보를 기다리고 있어요.'};
