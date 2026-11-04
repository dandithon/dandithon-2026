export function sceneLayout(width,height,exploring){
  const available=Math.max(1,height);
  const scale=exploring?Math.min(width/402,available/560):Math.min(1,width/402,available/874);
  return {scale,height:exploring?Math.min(874,available/scale):874};
}
