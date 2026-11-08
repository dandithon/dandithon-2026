export function sceneLayout(width,height,exploring){
  const available=Math.max(1,height);
  const scale=exploring?Math.min(width/402,available/560):Math.min(1,width/402,available/874);
  return {scale,height:exploring?available/scale:874};
}
export function startLayout(width,height){const scale=Math.min(width/402,Math.max(1,height)/420);return {scale,height:Math.max(1,height)/scale};}
