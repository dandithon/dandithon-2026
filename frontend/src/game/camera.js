export const viewport={width:402,height:874};
export function clampCamera(camera){
  const zoom=Math.max(1,Math.min(2.5,camera.zoom));
  return {zoom,x:Math.max(viewport.width*(1-zoom),Math.min(0,camera.x)),y:Math.max(viewport.height*(1-zoom),Math.min(0,camera.y))};
}
export function zoomCamera(camera,from,to,ratio){
  const zoom=Math.max(1,Math.min(2.5,camera.zoom*ratio));
  return clampCamera({zoom,x:to.x-(from.x-camera.x)*zoom/camera.zoom,y:to.y-(from.y-camera.y)*zoom/camera.zoom});
}
export function followPlayer(camera,position){
  return clampCamera({...camera,x:201-(201.5+position.x)*camera.zoom,y:458-(458+position.y)*camera.zoom});
}
export function stickVector(x,y,radius=44){
  const length=Math.hypot(x,y),factor=length>radius?radius/length:1;
  return {x:x*factor,y:y*factor};
}
