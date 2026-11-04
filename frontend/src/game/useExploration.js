import {useCallback,useEffect,useRef,useState} from 'react';
import {movePlayer,resolvePosition} from './movement';
import {clampCamera,followPlayer,stickVector,zoomCamera} from './camera';

const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
export default function useExploration(enabled,viewHeight=874){
  const view={width:402,height:viewHeight};
  const [position,setPosition]=useState({x:0,y:0}),[direction,setDirection]=useState('up'),[moving,setMoving]=useState(false);
  const [camera,setCamera]=useState({zoom:1,x:0,y:0}),[stick,setStick]=useState({x:0,y:0});
  const point=useRef(position),cameraRef=useRef(camera),input=useRef({x:0,y:0}),held=useRef(new Set());
  const pointers=useRef(new Map()),gesture=useRef(null),dragged=useRef(false),stickId=useRef(null);
  const updateCamera=next=>{cameraRef.current=next;setCamera(next);};
  const centerOn=useCallback(position=>{const next=followPlayer(cameraRef.current,position,view);cameraRef.current=next;setCamera(next);},[viewHeight]);
  const stop=()=>{setMoving(false);input.current={x:0,y:0};held.current.clear();setStick({x:0,y:0});stickId.current=null;pointers.current.clear();gesture.current=null;};
  useEffect(()=>{
    if(!enabled){stop();return;}
    point.current=resolvePosition(point.current);setPosition(point.current);
    const down=e=>{if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;if(keys[e.key]){e.preventDefault();held.current.add(e.key);}};
    const up=e=>held.current.delete(e.key);
    const hide=()=>{if(document.hidden)stop();};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',hide);
    let frame,last;
    const tick=time=>{
      const elapsed=last===undefined?0:Math.min((time-last)/1000,.05);last=time;
      let {x,y}=input.current;
      if(!x&&!y)for(const key of held.current){x+=keys[key][0];y+=keys[key][1];}
      const length=Math.hypot(x,y);
      if(length>.08){
        if(length>1){x/=length;y/=length;}
        setDirection(Math.abs(x)>Math.abs(y)?x>0?'right':'left':y>0?'down':'up');
        const next=movePlayer(point.current,x*105*elapsed,y*105*elapsed);
        setMoving(next.x!==point.current.x||next.y!==point.current.y);point.current=next;setPosition(next);
        updateCamera(followPlayer(cameraRef.current,point.current,view));
      }else setMoving(false);
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',hide);stop();};
  },[enabled,viewHeight]);
  const local=e=>{const r=e.currentTarget.getBoundingClientRect();return {x:(e.clientX-r.left)*402/r.width,y:(e.clientY-r.top)*874/r.height};};
  const snapshot=()=>{const points=[...pointers.current.values()];return points.length>1?{center:{x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2},distance:Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y)}:{center:points[0],distance:0};};
  const mapHandlers={
    onPointerDown:e=>{if(e.button!==0)return;if(pointers.current.size===0)dragged.current=false;pointers.current.set(e.pointerId,local(e));gesture.current=snapshot();if(pointers.current.size>1)dragged.current=true;},
    onPointerMove:e=>{
      if(!pointers.current.has(e.pointerId))return;
      const previous=gesture.current;pointers.current.set(e.pointerId,local(e));const next=snapshot();
      if(!previous?.center||!next.center)return;
      const dx=next.center.x-previous.center.x,dy=next.center.y-previous.center.y;
      if(!dragged.current&&Math.hypot(dx,dy)<5)return;
      dragged.current=true;
      if(!e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.setPointerCapture(e.pointerId);
      updateCamera(next.distance&&previous.distance?zoomCamera(cameraRef.current,previous.center,next.center,next.distance/previous.distance,view):clampCamera({...cameraRef.current,x:cameraRef.current.x+dx,y:cameraRef.current.y+dy},view));
      gesture.current=next;
    },
    onPointerUp:e=>{pointers.current.delete(e.pointerId);gesture.current=pointers.current.size?snapshot():null;},
    onPointerCancel:e=>{pointers.current.delete(e.pointerId);gesture.current=pointers.current.size?snapshot():null;dragged.current=true;},
    onLostPointerCapture:e=>{pointers.current.delete(e.pointerId);gesture.current=pointers.current.size?snapshot():null;},
    onClickCapture:e=>{if(dragged.current&&e.detail!==0){e.preventDefault();e.stopPropagation();}},
    onWheel:e=>{const p=local(e);updateCamera(zoomCamera(cameraRef.current,p,p,Math.exp(-e.deltaY*.002),view));},
  };
  const moveStick=e=>{const r=e.currentTarget.getBoundingClientRect();const vector=stickVector((e.clientX-r.left-r.width/2)*160/r.width,(e.clientY-r.top-r.height/2)*160/r.height);input.current={x:vector.x/44,y:vector.y/44};setStick(vector);};
  const release=e=>{if(e.pointerId===stickId.current){stickId.current=null;input.current={x:0,y:0};setStick({x:0,y:0});}};
  const stickHandlers={
    onPointerDown:e=>{if(!enabled||stickId.current!==null||e.button!==0)return;e.preventDefault();stickId.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);moveStick(e);},
    onPointerMove:e=>{if(e.pointerId===stickId.current)moveStick(e);},
    onPointerUp:release,onPointerCancel:release,onLostPointerCapture:release,
  };
  return {position,direction,moving,camera,stick,mapHandlers,stickHandlers,centerOn};
}
