import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import ProfileDialog from './components/ProfileDialog';
import FullMapDialog from './components/FullMapDialog';
import {explorationApi,marketApi,live,validateMode} from './api/service';
import {progression} from './game/progression';
import {readProfile} from './game/profile';
import {sceneLayout} from './game/layout';
import {demoWaits} from './game/crowd';
import StartPage from './pages/StartPage';
import MarketPage from './pages/MarketPage';
import StoreExperience from './components/StoreExperience';
import OrderDialog from './components/OrderDialog';
import ReceiptDialog from './components/ReceiptDialog';
import QuestDialog from './components/QuestDialog';
import PurchaseComplete from './components/PurchaseComplete';
import {ReviewEditor,CartDialog} from './components/ExtraDialogs';
import {getStore,menu} from './api/catalog';


export default function App(){
  const [state,setState]=useState(null),[page,setPage]=useState(()=>location.hash.startsWith('#store')?'store':'start');
  const [storeId,setStoreId]=useState(()=>getStore(location.hash.split('/')[1]).id);
  const store=getStore(storeId);
  const [tab,setTab]=useState('menu'),[modal,setModal]=useState(null),[selected,setSelected]=useState(null),[reviewOrder,setReviewOrder]=useState(null);
  const [completedOrders,setCompletedOrders]=useState([]);
  const [busy,setBusy]=useState(false),[toast,setToast]=useState(''),[layout,setLayout]=useState({scale:1,height:874});
  const {scale,height:sceneHeight}=layout;
  const [preferences,setPreferences]=useState(null),[loadError,setLoadError]=useState('');
  const [profileError,setProfileError]=useState('');
  const progress=useMemo(()=>state&&preferences?progression(state,preferences):null,[state,preferences]);
  const loadId=useRef(0);
  const lock=useRef(false),toastTimer=useRef(),container=useRef(null);
  const close=useCallback(()=>setModal(null),[]);
  const notify=useCallback(message=>{setToast(message);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),5500);},[]);
  const load=useCallback(async()=>{
    const id=++loadId.current;setLoadError('');
    try{
      validateMode();
      const [data,profile]=await Promise.all([marketApi.load(),explorationApi.load()]);
      if(!data||!Number.isFinite(data.balance)||!['orders','reviews','cart','claimed','visits','favorites'].every(key=>Array.isArray(data[key])))throw Error('시장 저장 정보 형식을 확인할 수 없어요. 기존 데이터를 확인해 주세요.');
      if(id===loadId.current){setState(data);setPreferences(profile);}
    }catch(error){if(id===loadId.current)setLoadError(error.message||'시장을 불러오지 못했어요.');}
  },[]);
  useEffect(()=>{load();return()=>{loadId.current++;clearTimeout(toastTimer.current);};},[load]);
  useEffect(()=>{
    const element=container.current;
    const resize=()=>{
      const style=getComputedStyle(element);
      const inset=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
      const footer=element.querySelector('footer').offsetHeight;
      const visible=window.visualViewport;
      // svh reserves expanded browser chrome. VisualViewport also handles browsers
      // whose visible area is smaller. Keep layout stable during keyboard entry/zoom.
      const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
      const visibleHeight=!typing&&visible?.scale===1?Math.min(element.clientHeight,visible.height):element.clientHeight;
      const portraitPhone=window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches;
      setLayout(sceneLayout(element.clientWidth,visibleHeight-footer-inset,portraitPhone&&page==='market'));
    };
    const observer=new ResizeObserver(resize);observer.observe(element);observer.observe(element.querySelector('footer'));window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);resize();
    return()=>{observer.disconnect();window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);};
  },[page]);
  useEffect(()=>{if(modal!=='receipts')return;let active=true,pending=false;
    const tick=async()=>{if(pending)return;pending=true;try{const data=await marketApi.refreshOrders();if(active)setState(data);}catch(error){if(active){notify(error.message||'영수증을 갱신하지 못했어요.');clearInterval(timer);}}finally{pending=false;}};
    const timer=setInterval(tick,1000);tick();return()=>{active=false;clearInterval(timer);};
  },[modal,notify]);
  const run=async task=>{if(lock.current)return;lock.current=true;setBusy(true);try{await task();return true;}catch(error){notify(error.message||'잠시 후 다시 시도해 주세요.');return false;}finally{lock.current=false;setBusy(false);}};
  const refreshProfile=async()=>{
    if(!live)return;
    const {profile,error}=await readProfile(explorationApi);
    setProfileError(error);
    if(profile){setPreferences(profile);setState(current=>({...current,balance:profile.balance}));}
  };
  const openModal=name=>{
    if(live && name==='quests')return run(async()=>{setState(await marketApi.refreshQuests());setModal(name);});
    if(live && name==='profile')return run(async()=>{await refreshProfile();setModal(name);});
    setModal(name);
  };
  const visit=id=>run(async()=>{setState(await marketApi.visit(id));setStoreId(id);setPage('store');setModal(null);});
  const favorite=()=>run(async()=>{setState(await marketApi.favorite(storeId));});
  const order=(items,fromCart=false)=>run(async()=>{const result=await marketApi.order(items,{fromCart});setState(result.state);setCompletedOrders(result.orders);setPage('market');setModal('success');await refreshProfile();});
  const add=(id,q)=>run(async()=>{setState(await marketApi.addToCart(id,q));setModal(null);notify('메뉴를 담았어요. 화면 아래에서 담은 메뉴를 확인하세요.');});
  const openReview=id=>run(async()=>{const data=await marketApi.refreshOrders();setState(data);const ready=data.orders.find(o=>o.status==='ready'&&(id?o.id===id:menu.find(m=>m.id===o.itemId)?.storeId===storeId));if(!ready){notify('조리가 완료된 주문이 있어야 리뷰를 작성할 수 있어요.');return;}setStoreId(menu.find(m=>m.id===ready.itemId).storeId);setReviewOrder(ready.id);setModal('review');});
  const toMenu=next=>{setTab(next);setPage('menu');};
  return <div ref={container} className="app-shell mx-auto w-full">
    <main className="relative mx-auto shrink-0 overflow-hidden shadow-2xl" style={{height:sceneHeight*scale,width:402*scale}}>
      <div className="absolute left-0 top-0 w-[402px] origin-top-left bg-paper font-sans" style={{height:sceneHeight,transform:`scale(${scale})`,'--controls-shift':`${sceneHeight-874}px`}}>
        {!state||!preferences?<section className="p-8 pt-40 text-center" aria-live="polite">{loadError?<><h1 className="font-retro text-xl">잠시 쉬어갈까요?</h1><p role="alert" className="my-6 break-words text-sm leading-6">{loadError}</p><button onClick={load} className="rounded-lg border-2 border-[#946034] bg-[#ffc857] px-5 py-3">다시 시도</button>{!live&&loadError.includes('프로필')&&<button className="mt-4 block w-full text-sm underline" onClick={async()=>{try{await explorationApi.resetPreferences();load();}catch(error){setLoadError(error.message);}}}>프로필 설정만 초기화 (주문·리뷰 유지)</button>}</>:<p>시장을 준비하고 있어요…</p>}</section>:<>
          <div className="size-full" inert={modal?true:undefined}>
            {page==='start'&&<StartPage onStart={()=>setPage('market')}/>}
            <div hidden={page!=='market'} className="size-full"><MarketPage sceneHeight={sceneHeight} preferences={preferences} progress={progress} waits={state.waits || demoWaits} active={page==='market'} state={state} onStore={visit} onModal={openModal} notify={notify} overlay={modal}/></div>
            {(page==='store'||page==='menu')&&<StoreExperience expanded={page==='menu'} store={store} state={state} tab={tab} setTab={setTab} onBack={()=>setPage(page==='menu'?'store':'market')} onFavorite={favorite} onMenu={()=>toMenu('menu')} onReviews={()=>toMenu('reviews')} notify={notify} onSelect={item=>{setSelected(item);setModal('order');}} onReview={()=>openReview()} onCart={()=>setModal('cart')}/>}
          </div>
          {modal==='profile'&&<ProfileDialog state={state} preferences={preferences} progress={progress} onClose={close} busy={busy} syncError={profileError} onRefresh={()=>run(refreshProfile)} onEquip={id=>run(async()=>setPreferences(await explorationApi.equip(id)))} onRename={name=>run(async()=>setPreferences(await explorationApi.rename(name)))}/>}
          {modal==='map'&&<FullMapDialog zones={state.zones} onClose={close} onStore={visit} waits={state.waits || demoWaits} busy={busy}/>}
          {modal==='order'&&<OrderDialog item={selected} onClose={close} onOrder={order} onAdd={add} busy={busy}/>}
          {modal==='success'&&<PurchaseComplete orders={completedOrders} onClose={close} onReceipts={()=>setModal('receipts')}/>}
          {modal==='receipts'&&<ReceiptDialog orders={state.orders} onClose={close} onReview={openReview}/>}
          {modal==='quests'&&<QuestDialog state={state} onClose={close} onClaim={id=>run(async()=>{setState(await marketApi.claim(id));notify('보상 코인을 받았어요!');await refreshProfile();})} notify={notify} busy={busy}/>}
          {modal==='review'&&<ReviewEditor orderId={reviewOrder} onClose={close} busy={busy} onSave={(id,text,rating)=>run(async()=>{setState(await marketApi.review(id,text,rating,preferences.nickname));setModal(null);toMenu('reviews');notify('리뷰가 저장됐어요.');})}/>}
          {modal==='cart'&&<CartDialog state={state} onClose={close} onOrder={items=>order(items,true)} onRemove={id=>run(async()=>setState(await marketApi.removeFromCart(id)))} busy={busy}/>}
        </>}
        {toast&&<div role="status" className="pointer-events-none absolute inset-x-[24px] bottom-[24px] z-50 rounded-xl border border-[#dec69c] bg-[#3c2b20f2] px-5 py-4 text-center text-[13px] leading-6 text-[#fff4de] shadow-xl">{toast}</div>}
      </div>
    </main>
    <footer className="flex items-center justify-between gap-4 px-4 py-3 text-[11px] text-[#d5dacb]"><span>{live?'서버 연결 · 공용 게스트 · 게임 코인':'프론트엔드 데모 · 실제 주문/결제 없음'}</span><button onClick={()=>{setModal(null);setPage('start');}} className="underline underline-offset-4">처음으로</button></footer>
  </div>;
}
