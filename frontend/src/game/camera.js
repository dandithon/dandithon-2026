export const viewport={width:402,height:874};
export function clampCamera(camera,view=viewport){
  const zoom=Math.max(1,Math.min(2.5,camera.zoom));
  return {zoom,x:Math.max(Math.min(0,view.width-viewport.width*zoom),Math.min(0,camera.x)),y:Math.max(Math.min(0,view.height-viewport.height*zoom),Math.min(0,camera.y))};
}
export function zoomCamera(camera,from,to,ratio,view=viewport){
  const zoom=Math.max(1,Math.min(2.5,camera.zoom*ratio));
  return clampCamera({zoom,x:to.x-(from.x-camera.x)*zoom/camera.zoom,y:to.y-(from.y-camera.y)*zoom/camera.zoom},view);
}
export function followPlayer(camera,position,view=viewport){
  return clampCamera({...camera,x:view.width/2-(201.5+position.x)*camera.zoom,y:view.height/2+21-(458+position.y)*camera.zoom},view);
}
export function stickVector(x,y,radius=44){
  const length=Math.hypot(x,y),factor=length>radius?radius/length:1;
  return {x:x*factor,y:y*factor};
}
