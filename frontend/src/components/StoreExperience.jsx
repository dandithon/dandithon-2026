import React,{useState} from 'react';
import StoreScene from './StoreScene';
import SheetHandle from './SheetHandle';
import StorePage from '../pages/StorePage';
import MenuPage from '../pages/MenuPage';

// Keep the scene and sheet mounted across information/menu navigation.
export default function StoreExperience({sceneHeight=874,expanded,store,state,onBack,onFavorite,onMenu,onReviews,notify,tab,setTab,onSelect,onReview,onCart,onLocation}){
  const [dragOffset,setDragOffset]=useState(0),[dragging,setDragging]=useState(false);
  const maxHeight=Math.min(652,sceneHeight-116);
  const minHeight=Math.min(370,maxHeight);
  const height=Math.max(minHeight,Math.min(maxHeight,(expanded?maxHeight:minHeight)-dragOffset));
  const toggle=()=>{setDragOffset(0);expanded?onBack():onMenu();};
  return <section className="relative size-full overflow-hidden bg-paper" aria-label={`${store.name} 가게`}>
    <StoreScene store={store} expanded={expanded} onBack={onBack} onFavorite={onFavorite} favorite={state.favorites.includes(store.id)} favoritesSupported={state.favoritesSupported}/>
    <button onClick={onMenu} aria-label="가게 메뉴 보기" disabled={expanded} className="store-scene-greeting absolute left-[232px] top-[199px] h-[72px] w-[132px] text-left font-retro text-[13px] leading-[15px] text-black" style={{opacity:expanded?0:1,pointerEvents:expanded?'none':'auto'}}><span className="ml-[21px] block whitespace-pre-line">{store.greeting}</span></button>
    <div className="store-scene-shade pointer-events-none absolute inset-0 bg-[#1e252b]" style={{opacity:expanded?.5:0}}/>
    {expanded&&<button type="button" aria-label="가게 첫 화면으로 돌아가기" onClick={onBack} className="absolute inset-x-0 top-0" style={{height:sceneHeight-height}}/>}
    <section data-store-sheet data-dragging={dragging} className="store-sheet absolute inset-x-0 bottom-0 overflow-hidden rounded-t-[30px] bg-paper" style={{height,transition:dragging?'none':undefined}}>
      <div className="store-sheet-content absolute inset-0" aria-hidden={expanded} inert={expanded?true:undefined} style={{opacity:expanded?0:1,pointerEvents:expanded?'none':'auto'}}>
        <StorePage onLocation={onLocation} embedded store={store} state={state} onBack={onBack} onFavorite={onFavorite} onMenu={onMenu} onReviews={onReviews} notify={notify}/>
      </div>
      <div className="store-sheet-content absolute inset-0" aria-hidden={!expanded} inert={!expanded?true:undefined} style={{opacity:expanded?1:0,pointerEvents:expanded?'auto':'none'}}>
        <MenuPage embedded store={store} state={state} tab={tab} setTab={setTab} onBack={onBack} onFavorite={onFavorite} onSelect={onSelect} onReview={onReview} onCart={onCart}/>
      </div>
      <div className="absolute inset-x-0 top-0"><SheetHandle expanded={expanded} onToggle={toggle} onDrag={setDragOffset} onDragState={setDragging}/></div>
    </section>
  </section>;
}
