import {playerOrigin} from './movement.js';
// Three surveyed, non-collinear anchors are required. Never guess market coordinates.
export function projectLocation(coords,calibration){
  if(!calibration)return {status:'unmapped',point:null};
  const {anchors,maxAccuracy}=calibration;
  if(!Array.isArray(anchors)||anchors.length!==3||!Number.isFinite(maxAccuracy)||maxAccuracy<=0)return {status:'invalid-config',point:null};
  if(!Number.isFinite(coords?.latitude)||!Number.isFinite(coords?.longitude)||!Number.isFinite(coords?.accuracy)||coords.accuracy<0)return {status:'invalid-location',point:null};
  if(coords.accuracy>maxAccuracy)return {status:'inaccurate',point:null};
  if(anchors.some(a=>!['latitude','longitude','x','y'].every(k=>Number.isFinite(a[k]))))return {status:'invalid-config',point:null};
  const [a,b,c]=anchors;
  const bx=b.longitude-a.longitude,by=b.latitude-a.latitude,cx=c.longitude-a.longitude,cy=c.latitude-a.latitude;
  const det=bx*cy-by*cx;
  if(Math.abs(det)<1e-14)return {status:'invalid-config',point:null};
  const dx=coords.longitude-a.longitude,dy=coords.latitude-a.latitude;
  const u=(dx*cy-dy*cx)/det,v=(bx*dy-by*dx)/det;
  const x=a.x+u*(b.x-a.x)+v*(c.x-a.x),y=a.y+u*(b.y-a.y)+v*(c.y-a.y);
  if(x<0||x>402||y<0||y>874)return {status:'outside',point:null};
  return {status:'mapped',point:{x:x-playerOrigin.x,y:y-playerOrigin.y}};
}
