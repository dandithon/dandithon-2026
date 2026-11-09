import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import ProfileDialog from './components/ProfileDialog';
import FullMapDialog from './components/FullMapDialog';
import useOrderReadyAlert from './game/useOrderReadyAlert';
import CoinDialog from './components/CoinDialog';
import {explorationApi,marketApi,live,presenterMode,validateMode} from './api/service';
import {progression} from './game/progression';
import {readProfile} from './game/profile';
import useRoute from './game/useRoute';
import {sceneLayout,startLayout} from './game/layout';
import useModalMotion from './game/useModalMotion';
import {demoWaits} from './game/crowd';
import StartPage from './pages/StartPage';
import MarketPage from './pages/MarketPage';
import StoreExperience from './components/StoreExperience';
import OrderDialog from './components/OrderDialog';
import ReceiptDialog from './components/ReceiptDialog';
import QuestDialog from './components/QuestDialog';
import PurchaseComplete from './components/PurchaseComplete';
import {ReviewEditor,CartDialog} from './components/ExtraDialogs';
import DemoDialog from './components/DemoDialog';
import {getStore,menu} from './api/catalog';
import {storeLocations} from './game/storeLocation';


export default function App(){
  const [state,setState]=useState(null);
  const [{page,storeId,tab},navigate]=useRoute();
  const setPage=page=>navigate({page}),setStoreId=storeId=>navigate({storeId}),setTab=tab=>navigate({tab});
  const store=getStore(storeId);
  const [selected,setSelected]=useState(null),[reviewOrder,setReviewOrder]=useState(null);
  const {modal,setModal,close,closing}=useModalMotion();
  const [locationPreview,setLocationPreview]=useState(null);
  const locationTrigger=useRef(null);
  useEffect(()=>{const restore=()=>{setModal(null);setLocationPreview(null);};window.addEventListener('popstate',restore);window.addEventListener('hashchange',restore);return()=>{window.removeEventListener('popstate',restore);window.removeEventListener('hashchange',restore);};},[]);
  const [completedOrders,setCompletedOrders]=useState([]);
  const [busy,setBusy]=useState(false),[toast,setToast]=useState(''),[layout,setLayout]=useState({scale:1,height:874});
  const {scale,height:sceneHeight}=layout;
  const [preferences,setPreferences]=useState(null),[loadError,setLoadError]=useState('');
  const [profileError,setProfileError]=useState('');
  const {readyAlert,dismissReadyAlert}=useOrderReadyAlert(state?.orders);
  const progress=useMemo(()=>state&&preferences?progression(state,preferences):null,[state,preferences]);
  const loadId=useRef(0);
  const lock=useRef(false),toastTimer=useRef(),container=useRef(null);
  const notify=useCallback(message=>{setToast(message);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),5500);},[]);
  const load=useCallback(async()=>{
    const id=++loadId.current;setLoadError('');
    try{
      validateMode();
      const [data,profile]=await Promise.all([marketApi.load(),explorationApi.load()]);
      if(!data||!Number.isFinite(data.balance)||!['orders','reviews','cart','claimed','visits','favorites'].every(key=>Array.isArray(data[key])))throw Error('시장 저장 정보 형식을 확인할 수 없어요. 기존 데이터를 확인해 주세요.');
      if(id===loadId.current){setState(data);setPreferences(profile);setProfileError('');}
    }catch(error){if(id===loadId.current)setLoadError(error.message||'시장을 불러오지 못했어요.');}
  },[]);
  useEffect(()=>{load();return()=>{loadId.current++;clearTimeout(toastTimer.current);};},[load]);
  useEffect(()=>{
    const element=container.current;
    const resize=()=>{
      const style=getComputedStyle(element);
      const inset=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
      const visible=window.visualViewport;
      // Dynamic viewport units track browser chrome. VisualViewport also handles browsers
      // whose visible area is smaller. Keep layout stable during keyboard entry/zoom.
      const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
      const visibleHeight=!typing&&visible?.scale===1?Math.min(element.clientHeight,visible.height):element.clientHeight;
      const portraitPhone=window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches;
      setLayout(portraitPhone&&page==='start'?startLayout(element.clientWidth,visibleHeight-inset):sceneLayout(element.clientWidth,visibleHeight-inset,portraitPhone&&(page==='market'||page==='store'||page==='menu')));
    };
    const observer=new ResizeObserver(resize);observer.observe(element);window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);resize();
    return()=>{observer.disconnect();window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);};
  },[page]);
  const hasCookingOrders=Boolean(state?.orders.some(order=>order.status==='cooking'));
  useEffect(()=>{
    if(presenterMode||!state||busy||(!hasCookingOrders&&modal!=='receipts'))return;
    let active=true,pending=false,errorShown=false;
    const tick=async()=>{
      if(pending||lock.current||document.hidden)return;
      pending=true;
      try{
        const data=await marketApi.refreshOrders();
        if(active){setState(current=>({...current,orders:data.orders}));errorShown=false;}
      }catch(error){
        if(active&&!errorShown){notify(error.message||'주문 상태를 갱신하지 못했어요. 다시 확인할게요.');errorShown=true;}
      }finally{pending=false;}
    };
    const timer=setInterval(tick,1000);
    document.addEventListener('visibilitychange',tick);
    tick();
    return()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',tick);};
  },[Boolean(state),hasCookingOrders,modal,busy,notify]);
  useEffect(()=>{
    if(!live||page==='start'||!state||!preferences)return;
    let active=true,pending=false;
    const tick=async()=>{
      if(pending||lock.current||document.hidden)return;
      pending=true;
      try{const data=await marketApi.refreshStores();if(active)setState(current=>({...current,waits:data.waits,waitsStale:false}));}
      catch{if(active)setState(current=>({...current,waitsStale:true}));}
      finally{pending=false;}
    };
    const timer=setInterval(tick,presenterMode?2000:15000);document.addEventListener('visibilitychange',tick);tick();
    return()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',tick);};
  },[page,Boolean(state),Boolean(preferences)]);
  useEffect(()=>{
    if(!presenterMode||page==='start'||!state||!preferences||busy)return;
    let active=true,pending=false;
    const tick=async()=>{
      if(pending||lock.current||document.hidden)return;
      pending=true;
      try{
        const result=await marketApi.refreshPresenter(()=>active&&!lock.current);
        if(result){
          const {balance,orders,quests,claimed,favorites,reviews,lastReward}=result.state;
          setState(current=>({...current,balance,orders,quests,claimed,favorites,reviews,lastReward}));
          setPreferences(result.profile);
        }
      }catch{ /* Keep the last confirmed data and retry on the next tick. */ }
      finally{pending=false;}
    };
    const timer=setInterval(tick,2000);
    document.addEventListener('visibilitychange',tick);
    tick();
    return()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',tick);};
  },[page,Boolean(state),Boolean(preferences),busy]);
  const run=async task=>{if(lock.current)return;lock.current=true;setBusy(true);try{await task();return true;}catch(error){notify(error.message||'잠시 후 다시 시도해 주세요.');return false;}finally{lock.current=false;setBusy(false);}};
  const refreshProfile=async()=>{
    if(!live)return;
    const {profile,error}=await readProfile(explorationApi);
    setProfileError(error);
    if(profile){setPreferences(profile);setState(current=>({...current,balance:profile.balance,...(Array.isArray(profile.favorites)?{favorites:profile.favorites,favoritesSupported:true}:{})}));}
    return profile;
  };
  const openModal=name=>{
    if(name==='quests')return run(async()=>{setState(await marketApi.refreshQuests());setModal(name);});
    if(live && name==='profile')return run(async()=>{setState(await marketApi.refreshFeatures());await refreshProfile();setModal(name);});
    setModal(name);
  };
  const updateCoins=async amount=>{
    if(lock.current)throw Error('다른 요청을 처리하고 있어요. 잠시 후 다시 확인해 주세요.');
    lock.current=true;setBusy(true);
    try{
      const result=amount===undefined?await marketApi.syncBalance():await marketApi.charge(amount);
      setState(result.state);setPreferences(current=>({...current,...result.user}));
    }finally{lock.current=false;setBusy(false);}
  };
  const reloadAll=async()=>{
    if(lock.current)return;
    lock.current=true;setBusy(true);setModal(null);setPreferences(null);
    try{await load();}finally{lock.current=false;setBusy(false);}
  };
  const resetDemo=async()=>{
    if(lock.current)throw Error('다른 요청을 처리하고 있어요.');
    lock.current=true;setBusy(true);
    let resetAccepted=false;
    try{
      const result=await marketApi.resetDemo();resetAccepted=true;
      setState(result.state);setModal(null);setPreferences(null);setCompletedOrders([]);setReviewOrder(null);setSelected(null);setLocationPreview(null);setPage('market');
      if(!live)await explorationApi.resetPreferences();
      await load();
      notify('시연 데이터를 초기화했어요.');
    }catch(error){
      if(resetAccepted){setLoadError('초기화는 반영됐지만 화면을 다시 불러오지 못했어요. '+error.message);return;}
      throw error;
    }finally{lock.current=false;setBusy(false);}
  };
  const equip=id=>run(async()=>{
    setPreferences(await explorationApi.equip(id));
    try{setState(await marketApi.refreshQuests());}
    catch{notify('장비는 반영됐어요. 미션 창에서 최신 진행도를 다시 확인해 주세요.');}
  });
  const visit=id=>run(async()=>{
    // Store details were loaded with the catalog. Mission recording must not
    // prevent browsing when the deployed backend does not support it yet.
    navigate({storeId:id,page:'store',tab:'menu'});setModal(null);
    try{setState(await marketApi.visit(id));}
    catch{notify('가게 정보는 볼 수 있어요. 둘러보기 미션 기록은 반영 여부를 확인하지 못했어요.');}
  });
  const showLocation=event=>{
    if(!storeLocations[store.id]){notify('이 가게의 지도 위치를 준비하고 있어요.');return;}
    locationTrigger.current=event.currentTarget;
    setLocationPreview({storeId:store.id,returnPage:page,returnTab:tab});setModal(null);setPage('market');
  };
  const returnLocation=()=>{
    if(!locationPreview)return;
    navigate({storeId:locationPreview.storeId,tab:locationPreview.returnTab,page:locationPreview.returnPage});setLocationPreview(null);
    requestAnimationFrame(()=>locationTrigger.current?.isConnected&&locationTrigger.current.focus());
  };
  const favorite=()=>run(async()=>{setState(await marketApi.favorite(storeId));});
  const order=(items,fromCart=false)=>run(async()=>{const result=await marketApi.order(items,{fromCart});setState(result.state);setCompletedOrders(result.orders);setPage('market');setModal('success');const profile=await refreshProfile();if(profile&&profile.level>preferences.level)notify(`레벨 업! 레벨 ${profile.level}이 되었어요.`);});
  const deleteReview=id=>run(async()=>{
    setState(await marketApi.deleteReview(id));notify('리뷰를 삭제했어요. 영수증에서 다시 작성할 수 있어요.');
    try{setState(await marketApi.refreshOrders());}
    catch{notify('삭제는 완료됐어요. 영수증을 다시 열어 작성 가능 상태를 확인해 주세요.');}
  });
  const refreshFavorites=()=>run(async()=>setState(await marketApi.refreshFavorites()));
  const refreshReviews=()=>run(async()=>setState(await marketApi.refreshReviews()));
  const openFavorite=id=>{if(lock.current)return;setModal(null);visit(id);};
  const saveReview=(id,text,rating,imageUrls=[])=>run(async()=>{
    setState(await marketApi.review(id,text,rating,preferences.nickname,imageUrls));setModal(null);toMenu('reviews');notify('리뷰가 저장됐어요.');
    try{setState(await marketApi.refreshQuests());}
    catch{notify('리뷰는 저장됐어요. 미션 창에서 최신 진행도를 확인해 주세요.');}
  });
  const add=(id,q)=>run(async()=>{setState(await marketApi.addToCart(id,q));setModal(null);notify('메뉴를 담았어요. 화면 아래에서 담은 메뉴를 확인하세요.');});
  const openReview=id=>run(async()=>{const data=await marketApi.refreshOrders();setState(data);const ready=data.orders.find(o=>(o.canReview??o.status==='ready')&&(id?o.id===id:menu.find(m=>m.id===o.itemId)?.storeId===storeId));if(!ready){notify('리뷰 작성이 가능한 주문이 없어요. 영수증을 확인해 주세요.');return;}setStoreId(menu.find(m=>m.id===ready.itemId).storeId);setReviewOrder(ready.id);setModal('review');});
  const toMenu=next=>navigate({tab:next,page:'menu'});
  return <div ref={container} className="app-shell mx-auto w-full">
    <main className="relative mx-auto shrink-0 overflow-hidden shadow-2xl" style={{height:sceneHeight*scale,width:402*scale}}>
      <div className="absolute left-0 top-0 w-[402px] origin-top-left bg-paper font-sans" style={{height:sceneHeight,transform:`scale(${scale})`,'--controls-shift':`${sceneHeight-874}px`}}>
        {!state||!preferences?<section className="p-8 pt-40 text-center" aria-live="polite">{loadError?<><h1 className="font-retro text-xl">잠시 쉬어갈까요?</h1><p role="alert" className="my-6 break-words text-sm leading-6">{loadError}</p><button onClick={load} className="rounded-lg border-2 border-[#946034] bg-[#ffc857] px-5 py-3">다시 시도</button>{!live&&loadError.includes('프로필')&&<button className="mt-4 block w-full text-sm underline" onClick={async()=>{try{await explorationApi.resetPreferences();load();}catch(error){setLoadError(error.message);}}}>프로필 설정만 초기화 (주문·리뷰 유지)</button>}</>:<p>시장을 준비하고 있어요…</p>}</section>:<>
          <div className="size-full" inert={modal?true:undefined}>
            {page==='start'&&<StartPage sceneHeight={sceneHeight} onStart={()=>setPage('market')} onDemo={live&&!presenterMode?()=>setModal('demo'):undefined}/>}
            <div hidden={page!=='market'} className={`size-full ${page==='market'?'scene-enter':''}`}><MarketPage locationPreview={locationPreview} onReturnLocation={returnLocation} sceneHeight={sceneHeight} preferences={preferences} progress={progress} waits={state.waits || demoWaits} active={page==='market'} state={state} onStore={visit} onModal={openModal} notify={notify} overlay={modal}/></div>
            {(page==='store'||page==='menu'||locationPreview)&&<div hidden={page!=='store'&&page!=='menu'} className="size-full"><StoreExperience sceneHeight={sceneHeight} onLocation={showLocation} expanded={(locationPreview?.returnPage||page)==='menu'} store={store} state={state} tab={tab} setTab={setTab} onBack={()=>setPage(page==='menu'?'store':'market')} onFavorite={favorite} onMenu={()=>toMenu('menu')} onReviews={()=>toMenu('reviews')} notify={notify} onSelect={item=>{setSelected(item);setModal('order');}} onReview={()=>openReview()} onCart={()=>setModal('cart')}/></div>}
          </div>
          {modal&&<div key={modal} data-modal={modal} inert={closing?true:undefined} className={`modal-motion absolute inset-0 z-30 ${closing?'is-closing':''}`}>
          {modal==='coins'&&<CoinDialog balance={state.balance} busy={busy} live={live} onClose={close} onCharge={updateCoins} onCheckBalance={()=>updateCoins()} onReset={resetDemo} onReload={reloadAll}/>}
          {modal==='profile'&&<ProfileDialog state={state} preferences={preferences} progress={progress} onClose={close} onHome={()=>{setModal(null);setLocationPreview(null);setPage('start');}} busy={busy} syncError={profileError} onRefresh={()=>run(refreshProfile)} onEquip={equip} onDeleteReview={deleteReview} onRefreshReviews={refreshReviews} onOpenFavorite={openFavorite} onRefreshFavorites={refreshFavorites} onRename={name=>run(async()=>setPreferences(await explorationApi.rename(name)))}/>}
          {modal==='map'&&<FullMapDialog zones={state.zones} notify={notify} onClose={close} onReturn={()=>{close();setPage('market');setLocationPreview(null);setToast('');}}/>}
          {modal==='order'&&<OrderDialog item={selected} onClose={close} onOrder={order} onAdd={add} busy={busy}/>}
          {modal==='success'&&<PurchaseComplete orders={completedOrders} onClose={close} onReceipts={()=>setModal('receipts')}/>}
          {modal==='receipts'&&<ReceiptDialog orders={state.orders} onClose={close} onReview={openReview}/>}
          {modal==='quests'&&<QuestDialog state={state} onClose={close} onRefresh={()=>run(async()=>setState(await marketApi.refreshQuests()))} onClaim={id=>run(async()=>{const updated=await marketApi.claim(id);setState(updated);notify(`${updated.lastReward?.amount?.toLocaleString('ko-KR')||''} 코인 보상을 받았어요!`);await refreshProfile();})} notify={notify} busy={busy}/>}
          {modal==='review'&&<ReviewEditor orderId={reviewOrder} onClose={close} busy={busy} onSave={saveReview} onUpload={marketApi.uploadReviewPhoto} photoSupported={state.features?.photoUpload}/>}
          {modal==='cart'&&<CartDialog state={state} onClose={close} onOrder={items=>order(items,true)} onRemove={id=>run(async()=>setState(await marketApi.removeFromCart(id)))} busy={busy}/>}
          {modal==='demo'&&<DemoDialog onClose={close}/>}
          </div>}
        </>}
        {readyAlert&&!modal&&<div role="status" className="absolute inset-x-4 top-4 z-50 flex items-start gap-2 rounded-xl border-2 border-[#d78a29] bg-[#fff4df] p-4 text-[#513724] shadow-xl">
          <button onClick={()=>{dismissReadyAlert();setModal('receipts');}} className="flex-1 text-left text-sm leading-6">주문하신 음식이 조리 완료되었어요! 영수증에서 리뷰를 남겨보세요 🍜</button>
          <button onClick={dismissReadyAlert} aria-label="조리 완료 알림 닫기" className="flex size-9 shrink-0 items-center justify-center text-xl">×</button>
        </div>}
        {toast&&<div role="status" className="pointer-events-none absolute inset-x-[24px] bottom-[24px] z-50 rounded-xl border border-[#dec69c] bg-[#3c2b20f2] px-5 py-4 text-center text-[13px] leading-6 text-[#fff4de] shadow-xl">{toast}</div>}
      </div>
    </main>
  </div>;
}
