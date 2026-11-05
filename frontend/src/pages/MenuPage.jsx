import React,{useState} from 'react';
import SheetHandle from '../components/SheetHandle';
import MenuImage from '../components/MenuImage';
import StoreScene from '../components/StoreScene';
import {Art,ArtButton} from '../components/Art';
import {menu} from '../api/catalog';
export default function MenuPage({store,state,tab,setTab,onBack,onFavorite,onSelect,onReview,onCart,embedded=false}){
  const [dragOffset,setDragOffset]=useState(0);
  const reviews=state.reviews.filter(r=>r.storeId===store.id);
  return <section className={`relative size-full overflow-hidden ${embedded?'':'bg-paper'}`} aria-label={`${store.name} 메뉴와 리뷰`}>
    {!embedded&&<StoreScene store={store} onBack={onBack} onFavorite={onFavorite} favorite={state.favorites.includes(store.id)} favoritesSupported={state.favoritesSupported} screen={tab==='reviews'?'85:581':'75:189'} dim/>}
    <section style={{height:embedded?'100%':Math.max(370,Math.min(652,652-dragOffset))}} className="absolute inset-x-0 bottom-0 flex h-[652px] flex-col rounded-t-[30px] bg-paper">
      {embedded?<div className="h-[40px] shrink-0"/>:<SheetHandle onDrag={setDragOffset} expanded onToggle={onBack}/>}
      <nav className="mt-[28px] grid shrink-0 grid-cols-4 gap-[7px] px-[20px]" aria-label="가게 상세 탭">
        {[['menu','메뉴'],['reviews',`리뷰(${reviews.length})`],['summary','AI 요약'],['info','상세 정보']].map(([id,label])=><button key={id} onClick={()=>setTab(id)} aria-current={tab===id?'page':undefined} className={`h-[35px] rounded-[10px] text-[14px] ${tab===id?'bg-[#e5ceb0] font-semibold text-[#4a3022]':'bg-[#f3e5d2] text-[#948373]'}`}>{label}</button>)}
      </nav>
      <div className="mt-[28px] min-h-0 flex-1 overflow-y-auto px-[16px] pb-[35px]">
        {tab==='menu'&&<div className="flex flex-col gap-[14px]">{store.id!=='seomun'&&<p className="text-xs text-muted">데모용 임시 메뉴 · 가격 단위: 코인</p>}{menu.filter(item=>item.storeId===store.id).map(item=><article key={item.id} className="flex h-[110px] shrink-0 items-center gap-[16px] rounded-[10px] border border-[#d8bfa2] bg-[#fff1de] pl-[14px] pr-[10px]">
          <button onClick={()=>onSelect(item)} aria-label={`${item.name} 상세 보기`} className="relative h-[80px] w-[109px] shrink-0 rounded-[10px] bg-[#efe2ce]"><span className="absolute left-[3px]" style={{top:({tteok:-1,sundae:-2,fried:5,fish:4})[item.id]??4}}><MenuImage item={item} width={98} height={72}/></span></button>
          <div className="min-w-0 flex-1 pt-[8px]"><div className="flex items-center gap-[6px]"><h2 className="text-[16px] font-semibold leading-[15px]">{item.name}</h2>{item.featured&&<span className="rounded-[5px] bg-[#c85a43] px-[8px] py-[2px] text-[11px] text-white">대표</span>}</div><p className="mt-[10px] break-words text-[11px] leading-[15px] text-muted">{item.description}</p><div className="mt-[1px] flex items-center justify-between"><span className="-ml-[3px] flex items-center font-retro text-[16px]"><Art screen="75:189" name="imgImage36" width={24} height={23}/>{item.price}</span><ArtButton screen="75:189" name="imgImage37" width={80} height={40} label={`${item.name} 담기`} onClick={()=>onSelect(item)}>담기</ArtButton></div></div>
        </article>)}</div>}
        {tab==='reviews'&&<div className="px-[4px]">{reviews.length===0&&<p className="py-8 text-center text-sm text-muted">아직 리뷰가 없어요. 첫 후기를 남겨 주세요!</p>}{reviews.map(review=><article key={review.id} className="relative min-h-[269px] border-t border-[#d8bfa2] pt-[18px]">
          <div className="flex gap-[10px]"><Art screen="85:581" name="imgImage52" width={70} height={63} className="-ml-[1px] -scale-x-100"/><div className="flex-1 pt-[13px]"><div className="flex items-center justify-between pr-[14px]"><h2 className="text-[17px] font-medium leading-[15px]">{review.name}</h2><time className="text-[12px] text-muted">{review.date}</time></div>{review.photos&&!review.imageUrls?<Art screen="85:581" name="imgImage32" width={103} height={34} className="-ml-[13px]"/>:<p className="py-2 text-amber-600" aria-label={`${review.rating}점`}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</p>}<p className="whitespace-pre-line text-[12px] leading-[15px] text-[#4a372b]">{review.text}</p></div></div>
          {review.imageUrls?.map((url,i)=><img key={i} src={url} alt="리뷰 사진" className="mt-2 max-h-[140px] max-w-full object-contain"/>)}{review.photos&&!review.imageUrls&&<Art screen="85:581" name="imgImage54" width={280} height={103} className="ml-[52px] mt-[11px]"/>}
        </article>)}</div>}
        {tab==='summary'&&<div className="rounded-xl border border-[#d8bfa2] bg-[#fff1de] p-6"><h2 className="font-semibold">AI 요약 준비 중</h2><p className="mt-3 text-sm leading-6 text-muted">백엔드의 리뷰 요약 기능이 연결되면 이곳에서 확인할 수 있어요.</p></div>}
        {tab==='info'&&<div className="rounded-xl border border-[#d8bfa2] bg-[#fff1de] p-6"><h2 className="font-semibold">{store.name}</h2><p className="mt-3 text-sm leading-6">{store.description}</p><p className="mt-4 text-sm text-muted">영업시간과 상세 위치는 아직 등록되지 않았어요.</p>{store.waitTimeSource==='SYNTHETIC_DEMO_QUEUE'&&<p className="mt-4 rounded-lg bg-[#f5e4c6] p-3 text-xs leading-5 text-[#805532]">AI 대기시간은 합성 주문으로 만든 가상 일반 손님의 시연 정보예요. 실제 손님 수나 실매장 대기시간이 아니며, 사용자 시연 주문은 별도로 우선 처리돼요.</p>}</div>}
      </div>
    </section>
    {tab==='reviews'&&<div className="absolute bottom-[15px] right-[14px]"><ArtButton screen="85:581" name="imgImage59" width={75} height={80} label="리뷰 작성하기" onClick={onReview} className="drop-shadow-md"/></div>}
    {state.cart.length>0&&tab==='menu'&&<button onClick={onCart} className="absolute bottom-[9px] left-1/2 -translate-x-1/2 rounded-lg border-2 border-[#80502c] bg-[#ffc857] px-4 py-2 font-retro text-xs shadow">담은 메뉴 {state.cart.reduce((n,x)=>n+x.quantity,0)}개 보기</button>}
  </section>;
}
