import test from 'node:test';
import assert from 'node:assert/strict';
import {createLiveApi} from '../src/api/live.js';

test('lost order response survives reload; review uses the server order ID for all lines',async()=>{
  const storage=new Map();
  const local={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
  const tokens=[];
  const read={
    '/stores':{stores:[{id:'seomun'}]}, '/stores/seomun':{id:'seomun',menus:[{id:'tteok'},{id:'fish'}]},
    '/users/me':{balance:1000},'/orders/receipts':{receipts:[]},'/quests':{daily:[],achievement:[],event:[]},
    '/map/zones':{zones:[]},'/stores/seomun/reviews':{reviews:[]}
  };
  async function request(path,opts){
    if(!opts)return read[path];
    if(path==='/reviews'){
      assert.equal(opts.body.orderId,'ord-test');
      return {reviewId:'review-test',authorName:'승우',...opts.body};
    }
    assert.equal(path,'/orders');
    assert.equal(opts.body.storeId,'seomun');
    tokens.push(opts.headers['Idempotency-Key']);
    if(tokens.length===1)throw Error('connection lost after submit');
    return {orderId:'ord-test',items:opts.body.items,remainingBalance:400,status:'ready'};
  }
  let {market}=createLiveApi(request,local);
  await market.load();
  await market.addToCart('fish',1);
  const {cart}=await market.addToCart('tteok',1);
  await assert.rejects(market.order(cart,{fromCart:true}),/connection lost/);
  market=createLiveApi(request,local).market;
  assert.deepEqual((await market.load()).cart,cart);
  const {orders,state}=await market.order(cart,{fromCart:true});
  assert.equal(tokens[0],tokens[1]);
  assert.equal(state.balance,400);
  assert.equal(state.cart.length,0);
  assert.equal(new Set(orders.map(o=>o.id)).size,2);
  const reviewed=await market.review(orders[1].id,'테스트',5);
  assert.ok(reviewed.orders.every(o=>o.status==='reviewed'));
  assert.equal(reviewed.reviews[0].storeId,'seomun');
});

test('late receipt responses cannot erase a confirmed purchase or undo a review',async()=>{
  let finishReceipt;
  const request=async(path,options)=>{
    if(path==='/orders/receipts' && finishReceipt!==undefined)
      return new Promise(resolve=>{finishReceipt=resolve;});
    if(path==='/orders')return {orderId:'new-order',storeId:'seomun',items:options.body.items,remainingBalance:700,status:'ready'};
    if(path==='/reviews')return {reviewId:'new-review',authorName:'테스트',...options.body};
    return {
      '/stores':{stores:[{id:'seomun'}]},
      '/stores/seomun':{id:'seomun',menus:[{id:'tteok',price:300}]},
      '/stores/seomun/reviews':{reviews:[]},
      '/users/me':{balance:1000}, '/orders/receipts':{receipts:[]},
      '/quests':{daily:[],achievement:[],event:[]}, '/map/zones':{zones:[]}
    }[path];
  };
  const {market}=createLiveApi(request,{getItem:()=>null,setItem(){}});
  await market.load();
  finishReceipt=null;
  const beforePurchase=market.refreshOrders();
  const placed=await market.order([{itemId:'tteok',quantity:1}]);
  finishReceipt({receipts:[]});
  assert.equal((await beforePurchase).orders[0].id,placed.orders[0].id);
  const beforeReview=market.refreshOrders();
  await market.review(placed.orders[0].id,'후기',5);
  finishReceipt({receipts:[{orderId:'new-order',menuId:'tteok',status:'ready',canReview:true}]});
  const afterReview=await beforeReview;
  assert.equal(afterReview.orders[0].status,'reviewed');
  assert.equal(afterReview.orders[0].canReview,false);
  assert.equal(afterReview.balance,700);
});
