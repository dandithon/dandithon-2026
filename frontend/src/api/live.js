import {menu,stores,useServerCatalog,updateStoreSummaries} from './catalog.js';
import {equipment} from '../game/progression.js';
import {validateCharge,confirmedBalance} from '../game/coins.js';

const lineId = (orderId, menuId) => orderId + ':' + menuId;
const receiptLine = row => ({...row, id:lineId(row.orderId,row.menuId), itemId:row.menuId});
const reviewView = (row, storeId) => ({...row, storeId, name:row.authorName});

export function createLiveApi(request, storage,discoverFeatures,mediaBaseUrl) {
  const key='dandi-api-guest-local-v1';
  let local={cart:[],favorites:[],visits:[]};
  let state={}, preferences={};
  const mediaUrl=url=>url?.startsWith('/api/v1/review-photos/')&&mediaBaseUrl?new URL(url,mediaBaseUrl).href:url;
  const reviewWithPhotos=(row,storeId)=>({...reviewView(row,storeId),imageUrls:row.imageUrls?.map(mediaUrl)});
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
      state.balance=user.balance;
      if(Array.isArray(user.favorites))local.favorites=[...user.favorites];
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
    async resetDemo(){
      const user=await request('/demo/reset',{method:'POST'});
      const balance=confirmedBalance(user);
      local={cart:[],favorites:Array.isArray(user.favorites)?user.favorites:[],visits:[]};
      state={...state,balance,orders:[],reviews:[],claimed:[],lastReward:null};
      setQuests({daily:[],achievement:[],event:[]});
      preferences={...user};
      // Server reset is already committed. A device-cache error must not ask the
      // caller to submit the destructive operation a second time.
      try{persist();}catch{ /* A full reload rechecks authoritative server data. */ }
      return {state:snapshot(),user};
    },
    async charge(amount){
      validateCharge(amount);
      const user=await request('/users/me/charge',{method:'POST',body:{amount}});
      state.balance=confirmedBalance(user);preferences={...preferences,...user};
      return {state:snapshot(),user};
    },
    async syncBalance(){
      const user=await request('/users/me');
      state.balance=confirmedBalance(user);preferences={...preferences,...user};
      return {state:snapshot(),user};
    },
    async load(){
      try {
        const saved=JSON.parse(storage.getItem(key));
        if(saved && ['cart','favorites','visits'].every(field=>Array.isArray(saved[field])))local=saved;
      } catch { /* Invalid device cache can be rebuilt from an empty basket. */ }
      const [{stores},user,{receipts},quests,{zones},features]=await Promise.all([
        request('/stores'),request('/users/me'),request('/orders/receipts'),request('/quests'),request('/map/zones'),
        discoverFeatures?discoverFeatures().catch(()=>null):null
      ]);
      local.favorites=Array.isArray(user?.favorites)?[...user.favorites]:[];
      const entries=await Promise.all(stores.map(async summary=>{
        const path='/stores/'+encodeURIComponent(summary.id);
        const [detail,{reviews}]=await Promise.all([request(path),request(path+'/reviews')]);
        return {store:{...summary,...detail},reviews:reviews.map(r=>reviewWithPhotos(r,summary.id))};
      }));
      useServerCatalog(entries.map(e=>e.store));
      local.cart=local.cart.filter(line=>menu.some(m=>m.id===line.itemId));
      state={balance:user.balance,features,favoritesSupported:Array.isArray(user.favorites)&&features?.favorites!==false,orders:receipts.map(receiptLine),reviews:entries.flatMap(e=>e.reviews),
        zones, waits:Object.fromEntries(stores.map(s=>[s.id,s.waitTimeMinutes]))};
      setQuests(quests);
      return snapshot();
    },
    async refreshOrders(){
      const {receipts}=await request('/orders/receipts');
      state.orders=receipts.map(receiptLine);
      return snapshot();
    },
    async refreshFeatures(){
      if(discoverFeatures){
        try{state.features=await discoverFeatures();}catch{ /* Keep the last known contract if docs are unavailable. */ }
      }
      return snapshot();
    },
    async refreshReviews(){
      const entries=await Promise.all(stores.map(async store=>{
        const {reviews}=await request('/stores/'+encodeURIComponent(store.id)+'/reviews');
        return reviews.map(review=>reviewWithPhotos(review,store.id));
      }));
      state.reviews=entries.flat();return snapshot();
    },
    async refreshStores(){
      const {stores}=await request('/stores');
      updateStoreSummaries(stores);
      state.waits=Object.fromEntries(stores.map(store=>[store.id,store.waitTimeMinutes]));
      state.waitsStale=false;
      return snapshot();
    },
    async refreshQuests(){setQuests(await request('/quests'));return snapshot();},
    async visit(id){
      setQuests(await request('/stores/'+encodeURIComponent(id)+'/browse',{method:'POST'}));
      if(!local.visits.includes(id))local.visits.push(id);
      persist();return snapshot();
    },
    async favorite(id){
      if(state.favoritesSupported===false)throw Error('현재 서버는 즐겨찾기 기능을 준비 중이에요.');
      const res=await request('/users/me/favorites/'+encodeURIComponent(id),{method:'PATCH'});
      if(!Array.isArray(res?.favorites))throw Error('즐겨찾기 반영 여부를 확인하지 못했어요. 프로필을 다시 열어 확인해 주세요.');
      local.favorites=[...res.favorites];
      // The server has committed the toggle; cache failure must not encourage
      // another toggle that would undo the confirmed action.
      try{persist();}catch{}
      return snapshot();
    },
    async refreshFavorites(){
      const {favorites}=await request('/users/me/favorites');
      if(!Array.isArray(favorites))throw Error('즐겨찾기 목록을 확인할 수 없어요.');
      local.favorites=[...favorites];state.favoritesSupported=true;
      try{persist();}catch{}
      return snapshot();
    },
    async deleteReview(id){
      if(state.features?.reviewDelete===false)throw Error('현재 서버는 리뷰 삭제 기능을 준비 중이에요.');
      let result;
      try{result=await request('/reviews/'+encodeURIComponent(id),{method:'DELETE'});}
      catch(error){
        if(error.status===404&&error.code==='INVALID_INPUT_VALUE')throw Error('현재 서버는 리뷰 삭제 기능을 준비 중이에요. 리뷰는 그대로 유지돼요.');
        throw error;
      }
      if(result?.deleted!==true)throw Error('리뷰 삭제 결과를 확인하지 못했어요. 목록을 다시 확인해 주세요.');
      state.reviews=state.reviews.filter(review=>review.id!==id);
      return snapshot();
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
      const orders=result.items.map(row=>receiptLine({...row,orderId:result.orderId,storeId,status:result.status,canReview:result.status==='ready',readyAfterSeconds:result.readyAfterSeconds}));
      state.balance=result.remainingBalance;
      state.orders=[...orders,...state.orders.filter(o=>o.orderId!==result.orderId)];
      if(fromCart)local.cart=local.cart.filter(row=>!items.some(i=>i.menuId===row.itemId));
      delete local.pending[signature];persist();
      return {state:snapshot(),orders};
    },
    async uploadReviewPhoto(id,file){
      if(state.features?.photoUpload===false)throw Error('현재 서버는 사진 첨부 기능을 준비 중이에요.');
      const order=state.orders.find(row=>row.id===id);
      if(!order)throw Error('영수증을 다시 열어 주세요.');
      const form=new FormData();form.append('orderId',order.orderId);form.append('file',file,'review.jpg');
      const result=await request('/review-photos',{method:'POST',body:form});
      if(!result?.url?.startsWith('/api/v1/review-photos/'))throw Error('사진 업로드 결과를 확인하지 못했어요.');
      return {url:result.url,preview:mediaUrl(result.url)};
    },
    async review(id,text,rating,_nickname,imageUrls=[]){
      const order=state.orders.find(o=>o.id===id);
      if(!order)throw Error('영수증을 다시 열어 주세요.');
      const result=await request('/reviews',{method:'POST',body:{orderId:order.orderId,text,rating,imageUrls}});
      state.reviews=[reviewWithPhotos({...result,id:result.reviewId,photos:imageUrls.length>0,imageUrls},order.storeId),...state.reviews];
      state.orders=state.orders.map(o=>o.orderId===order.orderId?{...o,status:'reviewed',canReview:false}:o);
      return snapshot();
    },
    async claim(id){
      const result=await request('/quests/'+encodeURIComponent(id)+'/claim',{method:'POST'});
      state.balance=confirmedBalance({balance:result.currentBalance});
      setQuests(Object.fromEntries(Object.entries(state.quests).map(([group,quests])=>[group,quests.map(q=>q.id===id?{...q,status:'CLAIMED'}:q)])));
      state.lastReward={id,amount:result.rewardCoin};
      return snapshot();
    }
  };
  return {market,profile};
}
