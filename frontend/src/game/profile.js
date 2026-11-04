// Server collections are authoritative, including foods absent from today's menu.
export function collectionFoods(preferences, menu, counts){
  if(preferences.foods)return preferences.foods.map(food=>{
    const item=menu.find(item=>item.id===food.foodId);
    return {item:item||{id:food.foodId,name:food.foodName},food,count:food.purchaseCount};
  });
  return menu.map(item=>({item,count:counts[item.id]||0}));
}

// A failed follow-up read must not turn a successful purchase into a retryable purchase.
export async function readProfile(api){
  try{return {profile:await api.load(),error:''};}
  catch(error){return {profile:null,error:error.message||'프로필을 갱신하지 못했어요.'};}
}
