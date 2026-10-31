import { menu, initialState, stores } from '../mocks/fixtures.js';
const KEY='hackton-market-demo-v1';
const fresh=()=>structuredClone(initialState);
function read(){try{const s=JSON.parse(localStorage.getItem(KEY));return s?.version===1?s.data:fresh();}catch{return fresh();}}
function save(s){try{localStorage.setItem(KEY,JSON.stringify({version:1,data:s}));}catch{}return structuredClone(s);}
let state;
function current(){
 if(!state){state=read();state.favorites??=state.favorite?['seomun']:[];state.reviews=state.reviews.map(r=>({...r,storeId:r.storeId||'seomun'}));}
 return state;
}
// Replace these asynchronous adapter methods with the team's agreed server API.
// This demo never submits a real order or charges money.
export const marketApi={
  async load(){return structuredClone(current());},
  async favorite(storeId='seomun'){if(!stores.some(s=>s.id===storeId))throw Error('가게를 확인해 주세요.');const s=current();s.favorites=s.favorites.includes(storeId)?s.favorites.filter(id=>id!==storeId):[...s.favorites,storeId];s.favorite=s.favorites.includes('seomun');return save(s);},
  async visit(id){if(!stores.some(s=>s.id===id))throw Error('가게를 확인해 주세요.');if(!current().visits.includes(id))current().visits.push(id);return save(current());},
  async addToCart(itemId,quantity){validate(itemId,quantity);const item=current().cart.find(x=>x.itemId===itemId);if(item){if(item.quantity+quantity>99)throw Error('한 메뉴는 최대 99개까지 담을 수 있어요.');item.quantity+=quantity;}else current().cart.push({itemId,quantity});return save(current());},
  async removeFromCart(itemId){current().cart=current().cart.filter(x=>x.itemId!==itemId);return save(current());},
  async order(items){
    if(!items.length)throw Error('주문할 메뉴를 선택해 주세요.');
    const total=items.reduce((sum,item)=>sum+validate(item.itemId,item.quantity).price*item.quantity,0);
    if(total>current().balance)throw Error('보유 코인이 부족해요. 수량을 줄여 주세요.');
    const placed=items.map(item=>({...item,storeId:menu.find(m=>m.id===item.itemId).storeId,id:crypto.randomUUID(),status:'cooking',readyAt:Date.now()+15000}));
    current().balance-=total;current().orders.unshift(...placed);current().cart=[];
    return {state:save(current()),orders:placed};
  },
  async refreshOrders(){current().orders.forEach(o=>{if(o.readyAt&&o.readyAt<=Date.now()&&o.status==='cooking')o.status='ready';});return save(current());},
  async review(orderId,text,rating){
    const order=current().orders.find(x=>x.id===orderId);
    if(!order||order.status!=='ready')throw Error('조리가 완료된 주문만 리뷰를 작성할 수 있어요.');
    if(!text.trim()||text.length>500)throw Error('리뷰를 1~500자로 입력해 주세요.');
    if(!Number.isInteger(rating)||rating<1||rating>5)throw Error('별점을 선택해 주세요.');
    order.status='reviewed';current().reviews.unshift({id:crypto.randomUUID(),storeId:menu.find(m=>m.id===order.itemId).storeId,name:'승우',rating,text:text.trim(),date:new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul'}).format(new Date()),photos:false});return save(current());
  },
  async claim(id){const ok=id==='photo'||(id==='visit'&&current().visits.length>=3)||(id==='review'&&current().reviews.length>2);if(!ok||current().claimed.includes(id))throw Error('아직 받을 수 없는 보상이에요.');current().claimed.push(id);current().balance+=({photo:100,visit:300,review:200})[id];return save(current());},
};
function validate(id,q){const item=menu.find(x=>x.id===id);if(!item||!Number.isInteger(q)||q<1||q>99)throw Error('메뉴와 수량을 확인해 주세요.');return item;}
