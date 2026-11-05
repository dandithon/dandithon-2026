import {clampCamera} from './camera.js';

// Visual store bounds on the existing 402×874 game artwork; not GPS coordinates.
export const storeLocations={
  seomun:{x:10,y:136,width:150,height:160},
  noodle:{x:249,y:136,width:150,height:160},
  hotteok:{x:10,y:493,width:150,height:158},
  coffee:{x:249,y:493,width:150,height:158},
};
export function storeLocationCamera(id,height){
  const bounds=storeLocations[id];
  if(!bounds)throw Error('이 가게의 지도 위치를 준비하고 있어요.');
  return clampCamera({zoom:1,x:0,y:height*.45-(bounds.y+bounds.height/2)},{width:402,height});
}
