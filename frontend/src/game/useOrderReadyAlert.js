import {useEffect,useRef,useState} from 'react';

export default function useOrderReadyAlert(orders){
  const previous=useRef(new Map());
  const [readyAlert,setReadyAlert]=useState(false);
  useEffect(()=>{
    if(!orders){previous.current.clear();setReadyAlert(false);return;}
    const newlyReady=orders.some(order=>order.status==='ready'&&previous.current.get(order.id)==='cooking');
    previous.current=new Map(orders.map(order=>[order.id,order.status]));
    if(newlyReady)setReadyAlert(true);
    else if(!orders.some(order=>order.status==='ready'))setReadyAlert(false);
  },[orders]);
  return {readyAlert,dismissReadyAlert:()=>setReadyAlert(false)};
}
