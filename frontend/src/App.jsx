import React,{useCallback,useEffect,useRef,useState} from 'react';
import StartPage from './pages/StartPage';
import MarketPage from './pages/MarketPage';
import StorePage from './pages/StorePage';
import MenuPage from './pages/MenuPage';
import OrderDialog from './components/OrderDialog';
import ReceiptDialog from './components/ReceiptDialog';
import QuestDialog from './components/QuestDialog';
import {ReviewEditor,CartDialog} from './components/ExtraDialogs';
import {getStore,menu} from './mocks/fixtures';
import {marketApi} from './api/market';

export default function App(){
  const [state,setState]=useState(null),[page,setPage]=useState(()=>location.hash.startsWith('#store')?'store':'start');
  const [storeId,setStoreId]=useState(()=>getStore(location.hash.split('/')[1]).id);
  const store=getStore(storeId);
  const [tab,setTab]=useState('menu'),[modal,setModal]=useState(null),[selected,setSelected]=useState(null),[reviewOrder,setReviewOrder]=useState(null);
  const [busy,setBusy]=useState(false),[toast,setToast]=useState(''),[scale,setScale]=useState(1);
  const lock=useRef(false),toastTimer=useRef(),container=useRef(null);
  const close=useCallback(()=>setModal(null),[]);
  const notify=useCallback(message=>{setToast(message);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),5500);},[]);
  useEffect(()=>{marketApi.load().then(setState);return()=>clearTimeout(toastTimer.current);},[]);
  useEffect(()=>{const element=container.current;const observer=new ResizeObserver(entries=>setScale(Math.min(1,entries[0].contentRect.width/402)));observer.observe(element);return()=>observer.disconnect();},[]);
  useEffect(()=>{if(modal!=='receipts')return;const tick=()=>marketApi.refreshOrders().then(setState);tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer);},[modal]);
  const run=async task=>{if(lock.current)return;lock.current=true;setBusy(true);try{await task();}catch(error){notify(error.message||'잠시 후 다시 시도해 주세요.');}finally{lock.current=false;setBusy(false);}};
  const visit=id=>run(async()=>{setState(await marketApi.visit(id));setStoreId(id);setPage('store');});
  const favorite=()=>run(async()=>{setState(await marketApi.favorite(storeId));});
  const order=items=>run(async()=>{const result=await marketApi.order(items);setState(result.state);setPage('market');setModal('receipts');notify('데모 주문이 완료됐어요. 약 15초 뒤 조리 완료로 바뀌어요.');});
  const add=(id,q)=>run(async()=>{setState(await marketApi.addToCart(id,q));setModal(null);notify('메뉴를 담았어요. 화면 아래에서 담은 메뉴를 확인하세요.');});
  const openReview=id=>{const ready=id||state.orders.find(o=>o.status==='ready'&&menu.find(m=>m.id===o.itemId)?.storeId===storeId)?.id;if(!ready){notify('조리가 완료된 주문이 있어야 리뷰를 작성할 수 있어요.');return;}setStoreId(menu.find(m=>m.id===state.orders.find(o=>o.id===ready).itemId).storeId);setReviewOrder(ready);setModal('review');};
  const toMenu=next=>{setTab(next);setPage('menu');};
  return <div ref={container} className="mx-auto w-full max-w-[402px]">
    <main className="relative overflow-hidden shadow-2xl" style={{height:874*scale}}>
      <div className="absolute left-0 top-0 h-[874px] w-[402px] origin-top-left bg-paper font-sans" style={{transform:`scale(${scale})`}}>
        {!state?<p className="p-8 text-center">시장을 준비하고 있어요…</p>:<>
          <div className="size-full" inert={modal?true:undefined}>
            {page==='start'&&<StartPage onStart={()=>setPage('market')}/>}
            {page==='market'&&<MarketPage state={state} onStore={visit} onModal={setModal} notify={notify} overlay={modal}/>}
            {page==='store'&&<StorePage store={store} state={state} onBack={()=>setPage('market')} onFavorite={favorite} onMenu={()=>toMenu('menu')} onReviews={()=>toMenu('reviews')} notify={notify}/>}
            {page==='menu'&&<MenuPage store={store} state={state} tab={tab} setTab={setTab} onBack={()=>setPage('store')} onFavorite={favorite} onSelect={item=>{setSelected(item);setModal('order');}} onReview={()=>openReview()} onCart={()=>setModal('cart')}/>}
          </div>
          {modal==='order'&&<OrderDialog item={selected} onClose={close} onOrder={order} onAdd={add} busy={busy}/>}
          {modal==='receipts'&&<ReceiptDialog orders={state.orders} onClose={close} onReview={openReview}/>}
          {modal==='quests'&&<QuestDialog state={state} onClose={close} onClaim={id=>run(async()=>{setState(await marketApi.claim(id));notify('보상 코인을 받았어요!');})} notify={notify} busy={busy}/>}
          {modal==='review'&&<ReviewEditor orderId={reviewOrder} onClose={close} busy={busy} onSave={(id,text,rating)=>run(async()=>{setState(await marketApi.review(id,text,rating));setModal(null);toMenu('reviews');notify('리뷰가 저장됐어요.');})}/>}
          {modal==='cart'&&<CartDialog state={state} onClose={close} onOrder={order} onRemove={id=>run(async()=>setState(await marketApi.removeFromCart(id)))} busy={busy}/>}
        </>}
        {toast&&<div role="status" className="pointer-events-none absolute inset-x-[24px] bottom-[24px] z-50 rounded-xl border border-[#dec69c] bg-[#3c2b20f2] px-5 py-4 text-center text-[13px] leading-6 text-[#fff4de] shadow-xl">{toast}</div>}
      </div>
    </main>
    <footer className="flex items-center justify-between gap-4 px-4 py-3 text-[11px] text-[#d5dacb]"><span>프론트엔드 데모 · 실제 주문/결제 없음</span><button onClick={()=>{setModal(null);setPage('start');}} className="underline underline-offset-4">처음으로</button></footer>
  </div>;
}
