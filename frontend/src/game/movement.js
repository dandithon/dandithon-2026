// Coordinates use the original 402 × 874 map, independent of viewport scale.
// The feet, rather than transparent sprite padding, form the collision box.
export const playerOrigin={x:201.5,y:458};
export const obstacles=[
  {id:'seomun',left:0,top:125,right:170,bottom:295},
  {id:'noodle',left:232,top:125,right:402,bottom:295},
  {id:'hotteok',left:0,top:485,right:170,bottom:650},
  {id:'coffee',left:232,top:485,right:402,bottom:650},
  {id:'west-planters',left:88,top:356,right:170,bottom:488},
  {id:'east-planters',left:232,top:356,right:319,bottom:488},
  {id:'west-lamp',left:125,top:330,right:153,bottom:370},
  {id:'east-lamp',left:250,top:330,right:279,bottom:370},
  {id:'west-side-garden',left:0,top:330,right:73,bottom:414},
  {id:'east-side-garden',left:328,top:330,right:402,bottom:414},
  {id:'west-shop-tree',left:0,top:445,right:84,bottom:490},
  {id:'east-shop-tree',left:320,top:445,right:402,bottom:490},
  {id:'north-west-garden',left:0,top:0,right:169,bottom:124},
  {id:'north-east-garden',left:232,top:0,right:402,bottom:124},
  {id:'south-west-garden',left:0,top:690,right:166,bottom:808},
  {id:'south-east-garden',left:240,top:690,right:402,bottom:808},
];
export const bounds={left:12-playerOrigin.x,right:390-playerOrigin.x,top:88-playerOrigin.y,bottom:850-playerOrigin.y};
export function isBlocked(position){
  const x=playerOrigin.x+position.x,y=playerOrigin.y+position.y;
  return obstacles.some(o=>x+9>o.left&&x-9<o.right&&y+5>o.top&&y-5<o.bottom);
}
// Recover a saved/hot-reloaded position after collision geometry changes.
export function resolvePosition(position){
  const point={x:Math.max(bounds.left,Math.min(bounds.right,position.x)),y:Math.max(bounds.top,Math.min(bounds.bottom,position.y))};
  if(!isBlocked(point))return point;
  const candidates=obstacles.flatMap(o=>[
    {x:o.left-9-playerOrigin.x,y:point.y},{x:o.right+9-playerOrigin.x,y:point.y},
    {x:point.x,y:o.top-5-playerOrigin.y},{x:point.x,y:o.bottom+5-playerOrigin.y},
  ]).filter(p=>p.x>=bounds.left&&p.x<=bounds.right&&p.y>=bounds.top&&p.y<=bounds.bottom&&!isBlocked(p));
  return candidates.sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y))[0]||{x:0,y:0};
}
export function movePlayer(position,dx,dy){
  if(!Number.isFinite(dx)||!Number.isFinite(dy))return position;
  // Sweep in <= 1px increments so key repeat or a larger step cannot skip a wall.
  const steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy)));
  let next=resolvePosition(position);
  for(let i=0;i<steps;i++){
    const x=Math.max(bounds.left,Math.min(bounds.right,next.x+dx/steps));
    if(!isBlocked({...next,x}))next.x=x;
    const y=Math.max(bounds.top,Math.min(bounds.bottom,next.y+dy/steps));
    if(!isBlocked({...next,y}))next.y=y;
  }
  return next;
}
