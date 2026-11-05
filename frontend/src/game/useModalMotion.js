import {useCallback,useEffect,useRef,useState} from 'react';

export default function useModalMotion(){
  const [modal,updateModal]=useState(null),[closing,setClosing]=useState(false);
  const timer=useRef(null);
  const setModal=useCallback(next=>{
    clearTimeout(timer.current);timer.current=null;
    setClosing(false);updateModal(next);
  },[]);
  const close=useCallback(()=>{
    if(timer.current!==null)return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setModal(null);return;}
    setClosing(true);
    timer.current=setTimeout(()=>setModal(null),150);
  },[setModal]);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  return {modal,setModal,close,closing};
}
