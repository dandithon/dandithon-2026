// Visual demo thresholds from Figma; replace only after the team agrees on rules.
export const crowdRules=[{max:5,count:1,label:'여유'},{max:10,count:3,label:'보통'},{max:20,count:5,label:'혼잡'},{max:Infinity,count:7,label:'매우 혼잡'}];
export function crowdLevel(minutes){
  if(!Number.isFinite(minutes)||minutes<0)return {count:0,label:'정보 없음'};
  return crowdRules.find(rule=>minutes<=rule.max);
}
export const demoWaits={seomun:5,noodle:10,hotteok:15,coffee:null};
