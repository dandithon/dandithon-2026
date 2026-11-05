import {menu, useServerCatalog} from './catalog.js';
import {equipment} from '../game/progression.js';

const lineId = (orderId, menuId) => orderId + ':' + menuId;
const receiptLine = row => ({...row, id:lineId(row.orderId,row.menuId), itemId:row.menuId});
const reviewView = (row, storeId) => ({...row, storeId, name:row.authorName});

export function createLiveApi(request, storage) {
  const key='dandi-api-guest-local-v1';
  let local={cart:[],favorites:[],visits:[]};
  let state={}, preferences={};
  const snapshot=()=>({...state, cart:[...local.cart], favorites:[...local.favorites], visits:[...local.visits]});
  const persist=()=>storage.setItem(key, JSON.stringify(local));
  const setQuests=quests=>{
    state.quests=quests;
    state.claimed=Object.values(quests).flat().filter(q=>q.status==='CLAIMED').map(q=>q.id);
  };
  const profile={
    async load(){
      const [user,{equipments},{foods}]=await Promise.all([
        request('/users/me'),request('/profile/equipments'),request('/profile/badges')
      ]);
      const items=equipments.map(e=>({...e, image:equipment.find(i=>i.id===e.id)?.image,
        itemId:e.targetFoodId, required:e.requiredCount, count:e.currentCount}));
      preferences={...user,items,foods,counts:Object.fromEntries(foods.map(f=>[f.foodId,f.purchaseCount]))};
      return preferences;
    },
    async equip(id){
      const result=await request('/profile/equipments/'+encodeURIComponent(id)+'/toggle',{method:'PATCH'});
      preferences={...preferences,...result};
      return preferences;
    },
    async rename(nickname){
      const result=await request('/users/me/nickname',{method:'PATCH',body:{nickname}});
      preferences={...preferences,...result};
      return preferences;
    }
  };
  const market={
    async load(){
      try {
        const saved=JSON.parse(storage.getItem(key));
        if(saved && ['cart','favorites','visits'].every(field=>Array.isArray(saved[field])))local=saved;
      } catch { /* Invalid device cache can be rebuilt from an empty basket. */ }
      const [{stores},user,{receipts},quests,{zones}]=await Promise.all([
        request('/stores'),request('/users/me'),request('/orders/receipts'),request('/quests'),request('/map/zones')
      ]);
      const entries=await Promise.all(stores.map(async summary=>{
        const path='/stores/'+encodeURIComponent(summary.id);
        const [detail,{reviews}]=await Promise.all([request(path),request(path+'/reviews')]);
        return {store:{...summary,...detail},reviews:reviews.map(r=>reviewView(r,summary.id))};
      }));
      useServerCatalog(entries.map(e=>e.store));
      local.cart=local.cart.filter(line=>menu.some(m=>m.id===line.itemId));
      state={balance:user.balance,orders:receipts.map(receiptLine),reviews:entries.flatMap(e=>e.reviews),
        zones, waits:Object.fromEntries(stores.map(s=>[s.id,s.waitTimeMinutes]))};
      setQuests(quests);
      return snapshot();
    },
    async refreshOrders(){
      const {receipts}=await request('/orders/receipts');
      state.orders=receipts.map(receiptLine);
      return snapshot();
    },
    async refreshQuests(){setQuests(await request('/quests'));return snapshot();},
    async visit(id){
      setQuests(await request('/stores/'+encodeURIComponent(id)+'/browse',{method:'POST'}));
      if(!local.visits.includes(id))local.visits.push(id);
      persist();return snapshot();
    },
    async favorite(id){
      local.favorites=local.favorites.includes(id)?local.favorites.filter(s=>s!==id):[...local.favorites,id];
      persist();return snapshot();
    },
    async addToCart(itemId,quantity){
      const line=local.cart.find(i=>i.itemId===itemId);
      if(!menu.some(i=>i.id===itemId)||!Number.isInteger(quantity)||quantity<1||(line?.quantity||0)+quantity>99)
        throw Error('메뉴당 1~99개까지 담을 수 있어요.');
      if(line)line.quantity+=quantity;else local.cart.push({itemId,quantity});
      persist();return snapshot();
    },
    async removeFromCart(itemId){
      local.cart=local.cart.filter(i=>i.itemId!==itemId);
      persist();return snapshot();
    },
    async order(lines,{fromCart=false}={}){
      const storeId=menu.find(m=>m.id===lines[0]?.itemId)?.storeId;
      if(!storeId||lines.some(l=>menu.find(m=>m.id===l.itemId)?.storeId!==storeId))
        throw Error('가게별로 주문해 주세요.');
      const items=lines.map(l=>({menuId:l.itemId,quantity:l.quantity})).sort((a,b)=>a.menuId.localeCompare(b.menuId));
      const body={storeId,items},signature=JSON.stringify(body);
      local.pending??={};
      const token=local.pending[signature]??=crypto.randomUUID();
      persist();
      let result;
      try {
        result=await request('/orders',{method:'POST',body,headers:{'Idempotency-Key':token}});
      } catch(error) {
        if(error.code && error.code!=='INTERNAL_SERVER_ERROR'){delete local.pending[signature];persist();}
        throw error;
      }
      const orders=result.items.map(row=>receiptLine({...row,orderId:result.orderId,storeId,status:result.status}));
      state.balance=result.remainingBalance;
      state.orders=[...orders,...state.orders.filter(o=>o.orderId!==result.orderId)];
      if(fromCart)local.cart=local.cart.filter(row=>!items.some(i=>i.menuId===row.itemId));
      delete local.pending[signature];persist();
      return {state:snapshot(),orders};
    },
    async review(id,text,rating){
      const order=state.orders.find(o=>o.id===id);
      if(!order)throw Error('영수증을 다시 열어 주세요.');
      const result=await request('/reviews',{method:'POST',body:{orderId:order.orderId,text,rating,imageUrls:[]}});
      state.reviews=[reviewView({...result,id:result.reviewId,photos:false},order.storeId),...state.reviews];
      state.orders=state.orders.map(o=>o.orderId===order.orderId?{...o,status:'reviewed'}:o);
      return snapshot();
    },
    async claim(id){
      const result=await request('/quests/'+encodeURIComponent(id)+'/claim',{method:'POST'});
      state.balance=result.currentBalance;
      state.claimed=[...state.claimed,id];
      return snapshot();
    }
  };
  return {market,profile};
}
