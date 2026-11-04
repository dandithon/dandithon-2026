// Demo equipment rules follow the Figma bag. Production rules belong to the API.
export const equipment=[
  {id:'tteok-hat',name:'모자',slot:'head',itemId:'tteok',required:1,image:'imgImage112'},
  {id:'tteok-jacket',name:'자켓',slot:'body',itemId:'tteok',required:3,image:'imgImage114'},
  {id:'tteok-shoes',name:'신발',slot:'feet',itemId:'tteok',required:5,image:'imgImage113'},
  {id:'tteok-scarf',name:'목도리',slot:'neck',itemId:'tteok',required:8,image:'imgImage123'},
];
export const badgeLevels=[{count:3,name:'브론즈'},{count:5,name:'실버'},{count:10,name:'골드'}];
export function purchaseCounts(orders=[]){
  const counts={},seen=new Set();
  for(const order of orders){
    if(!order.id||seen.has(order.id)||!['cooking','ready','reviewed'].includes(order.status))continue;
    seen.add(order.id);
    // Current demo has one ID per ordered menu line; quantity is not visit frequency.
    counts[order.itemId]=(counts[order.itemId]||0)+1;
  }
  return counts;
}
export function progression(state,preferences){
  if(preferences.items)return {counts:preferences.counts,items:preferences.items,equipped:preferences.equipped};
  const counts=purchaseCounts(state.orders);
  const items=equipment.map(item=>({...item,count:counts[item.itemId]||0,unlocked:(counts[item.itemId]||0)>=item.required}));
  const equipped=Object.fromEntries(Object.entries(preferences.equipped||{}).filter(([slot,id])=>items.some(i=>i.id===id&&i.slot===slot&&i.unlocked)));
  return {counts,items,equipped};
}
export function badges(count){return {earned:badgeLevels.filter(b=>count>=b.count),next:badgeLevels.find(b=>count<b.count)||null};}
export function hasOutfit(equipped){return equipped.head==='tteok-hat'&&equipped.body==='tteok-jacket'&&equipped.feet==='tteok-shoes'&&!equipped.neck;}
