import React from 'react';
import StoreScene from '../components/StoreScene';
import {Art,ArtButton} from '../components/Art';
export default function StorePage({store,state,onBack,onFavorite,onMenu,onReviews,notify}){
  const share=async()=>{try{await navigator.clipboard.writeText(window.location.origin+'/#store/'+store.id);notify('가게 링크를 복사했어요. 같은 컴퓨터에서 열 수 있는 로컬 데모 링크예요.');}catch{notify('브라우저 주소를 복사해서 공유해 주세요.');}};
  return <section className="relative size-full overflow-hidden bg-paper" aria-label={`${store.name} 가게 정보`}>
    <StoreScene store={store} onBack={onBack} onFavorite={onFavorite} favorite={state.favorites.includes(store.id)}/>
    <button onClick={onMenu} aria-label="가게 메뉴 보기" className="absolute left-[232px] top-[199px] h-[72px] w-[132px] text-left font-retro text-[13px] leading-[15px] text-black"><span className="ml-[21px] block whitespace-pre-line">{store.greeting}</span></button>
    <section className="absolute inset-x-0 bottom-0 flex h-[370px] flex-col rounded-t-[30px] bg-paper">
      <button onClick={onMenu} aria-label="메뉴 펼치기" className="mx-auto mt-[8px] flex h-[24px] w-[100px] items-start justify-center pt-[5px]"><span className="h-[4px] w-[82px] rounded-full bg-[#ccb8a2]"/></button>
      <div className="relative mt-[9px] flex items-center justify-between px-[25px]">
        <button onClick={onMenu} className="font-retro text-[25px] leading-[30px] text-black">{store.name}</button>
        <div className="-mr-[19px] -mt-[9px]"><Art screen="48:143" name="imgImage23" width={90} height={45}/><span className="absolute right-[35px] top-[6px] font-retro text-[14px] text-[#6b2b0f]">{store.category}</span></div>
      </div>
      <button onClick={onReviews} className="-mt-[8px] flex h-[45px] items-center gap-[3px] pl-[9px] text-left font-retro text-[14px] text-[#938779]"><Art screen="48:143" name="imgImage22" width={135} height={45}/><span className="-ml-[7px] mr-[3px] text-[16px] text-[#6b5545]">{store.id==='seomun'?'4.0':state.reviews.some(r=>r.storeId===store.id)?(state.reviews.filter(r=>r.storeId===store.id).reduce((n,r)=>n+r.rating,0)/state.reviews.filter(r=>r.storeId===store.id).length).toFixed(1):'—'}</span><span>{store.id==='seomun'?'(리뷰 348개)':`(리뷰 ${state.reviews.filter(r=>r.storeId===store.id).length}개)`}</span></button>
      <button onClick={onMenu} className="mt-[6px] px-[25px] text-left text-[14px] leading-[22.4px] tracking-[.14px] text-[#4a382c]">{store.description}</button>
      <div className="mt-[20px] flex gap-[6px] px-[15px]">{store.tags.map(t=><span key={t} className="flex h-[33px] flex-1 items-center justify-center whitespace-nowrap rounded-full bg-[#e8ddcc] px-[12px] text-[12px] text-[#594536]">{t}</span>)}</div>
      <div className="mt-[11px] flex flex-1 bg-gradient-to-t from-[#fdf3e780] to-[#eae0cd80] px-[4px]">
        {[['imgImage31','위치 보기',onBack],['imgImage30','영업 정보',()=>notify('영업시간 정보는 백엔드 연결 후 제공될 예정이에요.')],['imgImage29','공유하기',share]].map(([name,label,action],i)=><div key={label} className="relative flex flex-1 flex-col items-center pt-[5px]"><ArtButton screen="48:143" name={name} width={131} height={84} label={label} onClick={action} crop={i===2?{height:'100%',width:'103.18%',left:'-.27%',top:'-.54%'}:undefined}/><span className="pointer-events-none -mt-[8px] font-retro text-[12px]">{label}</span></div>)}
      </div>
    </section>
  </section>;
}
