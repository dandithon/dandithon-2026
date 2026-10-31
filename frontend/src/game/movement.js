// Coordinates use the original 402 × 874 map, independent of viewport scale.
// The feet, rather than transparent sprite padding, form the collision box.
export const playerOrigin={x:201.5,y:458};
export const obstacles=[
  {id:'seomun',left:0,top:125,right:165,bottom:295},
  {id:'noodle',left:265,top:125,right:402,bottom:295},
  {id:'hotteok',left:0,top:485,right:166,bottom:650},
  {id:'coffee',left:265,top:485,right:402,bottom:650},
  {id:'west-planters',left:95,top:355,right:175,bottom:480},
  {id:'east-planters',left:235,top:355,right:290,bottom:480},
];
const bounds={left:-95,right:95,top:-80,bottom:220};
export function isBlocked(position){
  const x=playerOrigin.x+position.x,y=playerOrigin.y+position.y;
  return obstacles.some(o=>x+12>o.left&&x-12<o.right&&y+4>o.top&&y-4<o.bottom);
}
export function movePlayer(position,dx,dy){
  if(!Number.isFinite(dx)||!Number.isFinite(dy))return position;
  // Sweep in <= 1px increments so key repeat or a larger step cannot skip a wall.
  const steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy)));
  let next={...position};
  for(let i=0;i<steps;i++){
    const x=Math.max(bounds.left,Math.min(bounds.right,next.x+dx/steps));
    if(!isBlocked({...next,x}))next.x=x;
    const y=Math.max(bounds.top,Math.min(bounds.bottom,next.y+dy/steps));
    if(!isBlocked({...next,y}))next.y=y;
  }
  return next;
}
