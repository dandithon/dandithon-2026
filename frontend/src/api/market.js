import { menu, initialState, stores } from '../mocks/fixtures.js';
import {validateCharge} from '../game/coins.js';
const KEY='hackton-market-demo-v1';
const fresh=()=>structuredClone(initialState);
function read(){try{const s=JSON.parse(localStorage.getItem(KEY));return s?.version===1?s.data:fresh();}catch{return fresh();}}
function save(s){syncQuests(s);try{localStorage.setItem(KEY,JSON.stringify({version:1,data:s}));}catch{}return structuredClone(s);}
let state;
function current(){
 if(!state){state=read();state.favorites??=state.favorite?['seomun']:[];state.reviews=state.reviews.map(r=>({...r,storeId:r.storeId||'seomun'}));}
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()));
 if(state.dailyQuest?.day!==day)state.dailyQuest={day,stores:[],reviews:0,hat:false,claimed:[]};
 syncQuests(state);
 return state;
}
function syncQuests(s){
 const d=s.dailyQuest;if(!d)return;
 s.claimed=[...d.claimed];
 s.quests={daily:[
  {id:'visit-3',title:'가게 3곳 둘러보기',current:Math.min(d.stores.length,3),target:3,rewardCoin:300},
  {id:'review-1',title:'서문분식 리뷰 1개 작성하기',current:Math.min(d.reviews,1),target:1,rewardCoin:200},
  {id:'equip-hat',title:'모자 착용해보기',current:d.hat?1:0,target:1,rewardCoin:100}
 ].map(q=>({...q,status:d.claimed.includes(q.id)?'CLAIMED':q.current>=q.target?'COMPLETED':'IN_PROGRESS',verificationPending:false})),achievement:[],event:[]};
}
// Replace these asynchronous adapter methods with the team's agreed server API.
// This demo never submits a real order or charges money.
export const marketApi={
  async resetDemo(){
    state={...fresh(),balance:1000,orders:[],reviews:[],cart:[],visits:[],claimed:[],favorites:[],dailyQuest:undefined,lastReward:null};
    const result=save(current());
    return {state:result,user:{balance:1000}};
  },
  async charge(amount){validateCharge(amount);const s=current();if(!Number.isSafeInteger(s.balance+amount))throw Error('보유 코인을 확인해 주세요.');s.balance+=amount;return {state:save(s),user:{balance:s.balance}};},
  async syncBalance(){return {state:structuredClone(current()),user:{balance:current().balance}};},
  async load(){return structuredClone(current());},
  async favorite(storeId='seomun'){if(!stores.some(s=>s.id===storeId))throw Error('가게를 확인해 주세요.');const s=current();s.favorites=s.favorites.includes(storeId)?s.favorites.filter(id=>id!==storeId):[...s.favorites,storeId];s.favorite=s.favorites.includes('seomun');return save(s);},
  async visit(id){if(!stores.some(s=>s.id===id))throw Error('가게를 확인해 주세요.');const s=current();if(!s.visits.includes(id))s.visits.push(id);if(!s.dailyQuest.stores.includes(id))s.dailyQuest.stores.push(id);return save(s);},
  async refreshQuests(){return save(current());},
  async recordHatTry(){const s=current();s.dailyQuest.hat=true;return save(s);},
  async addToCart(itemId,quantity){validate(itemId,quantity);const item=current().cart.find(x=>x.itemId===itemId);if(item){if(item.quantity+quantity>99)throw Error('한 메뉴는 최대 99개까지 담을 수 있어요.');item.quantity+=quantity;}else current().cart.push({itemId,quantity});return save(current());},
  async removeFromCart(itemId){current().cart=current().cart.filter(x=>x.itemId!==itemId);return save(current());},
  async order(items,{fromCart=false}={}){
    if(!items.length)throw Error('주문할 메뉴를 선택해 주세요.');
    const total=items.reduce((sum,item)=>sum+validate(item.itemId,item.quantity).price*item.quantity,0);
    if(total>current().balance)throw Error('보유 코인이 부족해요. 수량을 줄여 주세요.');
    const placed=items.map(item=>({...item,storeId:menu.find(m=>m.id===item.itemId).storeId,id:crypto.randomUUID(),status:'cooking',readyAt:Date.now()+15000}));
    current().balance-=total;current().orders.unshift(...placed);if(fromCart)current().cart=current().cart.flatMap(line=>{const quantity=line.quantity-items.filter(i=>i.itemId===line.itemId).reduce((n,i)=>n+i.quantity,0);return quantity>0?[{...line,quantity}]:[];});
    return {state:save(current()),orders:placed};
  },
  async refreshOrders(){current().orders.forEach(o=>{if(o.readyAt&&o.readyAt<=Date.now()&&o.status==='cooking')o.status='ready';});return save(current());},
  async review(orderId,text,rating,nickname='승우'){
    const order=current().orders.find(x=>x.id===orderId);
    if(!order||order.status!=='ready')throw Error('조리가 완료된 주문만 리뷰를 작성할 수 있어요.');
    if(!text.trim()||text.length>500)throw Error('리뷰를 1~500자로 입력해 주세요.');
    if(!Number.isInteger(rating)||rating<1||rating>5)throw Error('별점을 선택해 주세요.');
    order.status='reviewed';if(menu.find(m=>m.id===order.itemId).storeId==='seomun')current().dailyQuest.reviews++;current().reviews.unshift({id:crypto.randomUUID(),storeId:menu.find(m=>m.id===order.itemId).storeId,name:nickname,rating,text:text.trim(),date:new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul'}).format(new Date()),photos:false});return save(current());
  },
  async claim(id){const s=current(),quest=s.quests.daily.find(q=>q.id===id);if(quest?.status!=='COMPLETED')throw Error('아직 받을 수 없는 보상이에요.');s.dailyQuest.claimed.push(id);s.balance+=quest.rewardCoin;s.lastReward={id,amount:quest.rewardCoin};return save(s);},
};
function validate(id,q){const item=menu.find(x=>x.id===id);if(!item||!Number.isInteger(q)||q<1||q>99)throw Error('메뉴와 수량을 확인해 주세요.');return item;}
