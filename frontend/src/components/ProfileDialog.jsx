import React,{useState} from 'react';
import Dialog from './Dialog';
import PlayerCharacter from './PlayerCharacter';
import ProfileProgress from './ProfileProgress';
import MenuImage from './MenuImage';
import art from '../assets/exploration.json';
import mapArt from '../assets/figma.json';
import {menu,getStore} from '../api/catalog';
import {badges} from '../game/progression';
import {collectionFoods} from '../game/profile';

export default function ProfileDialog({state,preferences,progress,onClose,onEquip,onRename,busy,syncError,onRefresh,onDeleteReview,onRefreshReviews,onOpenFavorite,onRefreshFavorites}){
  const [tab,setTab]=useState('bag'),[editing,setEditing]=useState(false),[name,setName]=useState(preferences.nickname),[previewDirection,setPreviewDirection]=useState('down');
  const [deleting,setDeleting]=useState(null);
  const {items,equipped,counts}=progress;
  const serverProfile=Boolean(preferences.items);
  const foods=collectionFoods(preferences,menu,counts);
  return <Dialog label="내 프로필" onClose={onClose}>
    <section className="absolute inset-x-0 bottom-0 top-[134px] flex flex-col rounded-t-[30px] bg-[#fff9f0]">
      <header className="relative shrink-0 px-[38px] pb-4 pt-[25px]">
        {editing?<form className="mr-7 flex gap-2" onSubmit={async e=>{e.preventDefault();if(await onRename(name))setEditing(false);}}>
          <label className="sr-only" htmlFor="nickname">닉네임</label><input autoFocus id="nickname" value={name} onChange={e=>setName(e.target.value)} maxLength={16} className="min-w-0 w-[130px] rounded border border-[#c9a989] bg-white px-2 py-2 text-sm"/>
          <button disabled={busy||!name.trim()} className="rounded border border-[#c9a989] px-2 text-xs">저장</button><button type="button" onClick={()=>setEditing(false)} className="text-xs">취소</button>
        </form>:<><h2 className="max-w-[150px] truncate font-retro text-[25px]">{preferences.nickname}</h2><button onClick={()=>{setName(preferences.nickname);setEditing(true);}} className="absolute left-[203px] top-[18px] h-[61px] w-[137px]" aria-label="닉네임 변경"><img alt="" src={art.profile.imgImage118} className="absolute inset-0 h-[61px] w-[157px] max-w-none"/><span className="absolute left-[60px] top-[25px] whitespace-nowrap font-mona text-[11px] text-[#5b3b29]">닉네임 변경</span></button></>}
        <button onClick={onClose} aria-label="프로필 닫기" className="absolute right-[17px] top-[29px] h-[39px] w-[40px]"><img alt="" src={art.profile.imgImage51} className="size-full"/></button>
      </header>
      {serverProfile?<ProfileProgress profile={preferences} supported={state.features?.experience}/>:<p className="mx-5 mb-3 text-[10px] text-muted">로컬 시연 프로필 · 레벨/경험치 규칙 준비 중</p>}
      <div aria-live="polite" className="mx-5 mb-2 text-[11px] text-muted">{syncError?<><p role="alert">최신 정보를 불러오지 못했어요. 이전 정보를 표시하고 있어요.</p><button disabled={busy} onClick={onRefresh} className="mt-1 underline">프로필 다시 불러오기</button></>:serverProfile?'서버에 저장된 공용 게스트 프로필':null}</div>
      <nav aria-label="프로필 메뉴" className="mx-5 grid shrink-0 grid-cols-4 gap-[7px]">
        {[['bag','가방'],['reviews','내 리뷰'],['collection','수집 음식'],['favorites','즐겨찾기']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>{setTab(id);setDeleting(null);}} className={`h-[42px] rounded-[10px] text-[13px] ${tab===id?'bg-[#d9b99b] font-semibold text-[#49362c]':'bg-[#f0e4d6] text-[#806b5c]'}`}>{label}</button>)}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5" key={tab}>
        {tab==='bag'&&<>
          <div className="relative mx-[24px] mt-[27px] flex h-[280px] gap-3">
            <div className="relative min-w-0 flex-1 rounded-[10px] bg-[#f5e6d2] shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,.25)]">
              <div className="absolute left-1/2 top-[28px] size-[180px] -translate-x-1/2"><PlayerCharacter direction={previewDirection} equipped={equipped}/></div>
              <nav aria-label="캐릭터 미리보기 방향" className="absolute inset-x-2 bottom-3 flex justify-center gap-1">
                {[['down','앞'],['right','옆'],['up','뒤']].map(([direction,label])=><button key={direction} aria-pressed={previewDirection===direction} onClick={()=>setPreviewDirection(direction)} className={`rounded border px-3 py-1 text-[11px] ${previewDirection===direction?'border-[#946034] bg-[#e8c99d]':'border-[#d7c1a6] bg-[#fff7ea]'}`}>{label}</button>)}
              </nav>
            </div>
            <div aria-label="장비 착용 슬롯" className="grid w-[88px] shrink-0 grid-rows-4 gap-2">
              {['head','body','feet','neck'].map(slot=>{const item=items.find(i=>i.slot===slot),worn=item&&equipped[slot]===item.id;if(!item)return null;return <button key={slot} disabled={busy||!item.unlocked} aria-label={`${item.name} ${worn?'해제':'착용'}`} aria-pressed={worn} onClick={()=>onEquip(item.id)} className={`relative flex flex-col items-center justify-center rounded-[10px] border bg-[#fff7ea] disabled:opacity-50 ${worn?'border-[#ac762e] ring-1 ring-[#d9aa61]':'border-[#c9a989]'}`}>
                <img alt="" src={art.profile[item.image]} className={`h-[31px] w-[48px] object-contain ${worn?'opacity-100':'opacity-40'}`}/>
                <span className="text-[10px]">{item.name} · {worn?'해제':item.unlocked?'착용':'잠김'}</span>
              </button>;})}
            </div>
          </div>
          <h3 className="mx-[28px] mb-2 mt-4 font-retro text-[15px]">보유 아이템</h3>
          <div className="mx-[18px] grid grid-cols-4 gap-[6px] rounded-[15px] border-2 border-[#ecded0] bg-[#fdf3e780] p-[8px]">
            {items.map(item=><button key={item.id} disabled={busy||!item.unlocked} aria-label={`${item.name}: ${item.unlocked?(equipped[item.slot]===item.id?'착용 중, 해제':'획득 완료, 착용'):`잠김, ${item.targetFoodName||'떡볶이'} ${item.required}회 필요`}`} aria-pressed={equipped[item.slot]===item.id} onClick={()=>onEquip(item.id)} className={`flex min-h-[108px] flex-col items-center rounded-[10px] border py-2 ${item.unlocked?'border-[#d6a65d] bg-[#fff0cf]':'border-[#d8c7b4] bg-[#f6eadd]'}`}>
              <div className="relative h-[33px] w-[48px] overflow-hidden"><img alt="" src={art.profile[item.image]} className="size-full object-cover" style={item.slot==='neck'?{position:'absolute',height:'108.14%',width:'108.09%',left:'-4.13%',top:'-.08%'}:undefined}/></div>
              <span className="mt-1 rounded-full bg-[#e9d4be] px-1 text-[10px] text-[#76543d]">{item.targetFoodName||'떡볶이'} {item.required}회</span><span className="mt-1 text-xs font-semibold">{item.name}</span><span className="mt-1 text-[9px] text-muted">{item.unlocked?equipped[item.slot]===item.id?'착용 중':'획득 완료':`${item.count}/${item.required}회`}</span>
            </button>)}
            {[1,3,5,8].map(count=><div key={count} className="flex min-h-[108px] flex-col items-center rounded-[10px] border border-[#d8c7b4] bg-[#f6eadd] py-2"><img alt="잠김" src={art.profile.imgImage103} className="size-[43px]"/><span className="rounded-full bg-[#e9d4be] px-1 text-[10px]">칼국수 {count}회</span><span className="mt-1 text-xs">?</span><span className="mt-1 text-[9px] text-muted">장비 준비 중</span></div>)}
          </div><p className="mx-6 mt-2 text-[10px] leading-4 text-muted">{serverProfile?'서버가 확정한 획득·착용 상태예요.':'가방 조건은 Figma 기준 시연 규칙이에요.'} 횟수는 주문 메뉴 기록당 1회이며 수량과 구분해요.</p>
        </>}
        {tab==='favorites'&&<div className="space-y-3 p-5">
          <div className="flex items-center justify-between"><p className="text-xs text-muted">{serverProfile?'공용 게스트의 즐겨찾기':'이 기기의 즐겨찾기'}</p><button disabled={busy||state.favoritesSupported===false} onClick={onRefreshFavorites} className="rounded border border-[#c9a989] px-3 py-2 text-xs disabled:opacity-50">새로고침</button></div>
          {state.favoritesSupported===false?<p className="py-6 text-sm text-muted">현재 서버는 즐겨찾기 기능을 준비 중이에요.</p>:state.favorites.length===0?<p className="py-6 text-center text-sm text-muted">가게 화면의 별 버튼으로 즐겨찾기를 추가해 보세요.</p>:state.favorites.map(id=>{const store=getStore(id);if(store.id!==id)return null;return <button key={id} disabled={busy} onClick={()=>onOpenFavorite(id)} className="flex min-h-16 w-full items-center justify-between rounded-xl border border-[#c9a989] bg-[#fff0cf] p-4 text-left"><span><span className="block font-retro text-sm">{store.name}</span><span className="mt-1 block text-xs text-muted">{store.category}</span></span><span aria-hidden="true" className="text-[#946034]">→</span></button>;})}
        </div>}
        {tab==='reviews'&&<div className="space-y-3 p-5"><div className="flex justify-end"><button disabled={busy} onClick={onRefreshReviews} className="rounded border border-[#c9a989] px-3 py-2 text-xs disabled:opacity-50">리뷰 새로고침</button></div>
          {state.features?.reviewDelete===false&&<p className="rounded-lg border border-[#d8bfa2] bg-[#fff4df] p-3 text-xs leading-5 text-[#805532]">현재 서버는 리뷰 삭제 기능을 준비 중이에요. 작성한 리뷰는 확인할 수 있어요.</p>}
          {serverProfile&&<p className="text-xs text-muted">공용 게스트의 리뷰예요. 여러 사람이 같은 프로필을 사용해요.</p>}{state.reviews.length===0?<p className="py-10 text-center text-sm text-muted">아직 작성한 리뷰가 없어요. 영수증에서 리뷰를 남겨보세요.</p>:state.reviews.map(review=><article key={review.id} className="rounded-xl border border-[#d8bfa2] bg-paper p-4"><h3 className="font-semibold">{getStore(review.storeId).name}</h3><p className="my-2 text-sm text-[#9b5a19]" aria-label={`${review.rating}점`}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{review.text}</p>{review.imageUrls?.map((url,i)=><img key={i} src={url} alt="리뷰 사진" className="mt-2 max-h-[140px] max-w-full object-contain"/>)}{review.photos&&!review.imageUrls&&<img alt="시연 리뷰 음식 사진" src={mapArt['85:581'].imgImage54} className="mt-2 h-auto w-full"/>}<p className="mt-2 text-xs text-muted">{review.date} · {review.name}</p>
            {(serverProfile||review.orderId)&&state.features?.reviewDelete!==false&&(deleting===review.id?<div className="mt-3 rounded-lg border border-[#c9a989] bg-[#fff4df] p-3"><p className="text-xs leading-5">리뷰를 삭제할까요? 삭제 후 되돌릴 수 없으며, 영수증에서 새 리뷰를 작성할 수 있어요.</p><div className="mt-2 flex justify-end gap-2"><button disabled={busy} onClick={()=>setDeleting(null)} className="min-h-11 px-3 text-xs">취소</button><button disabled={busy} onClick={async()=>{if(await onDeleteReview(review.id))setDeleting(null);}} className="min-h-11 rounded border border-[#946034] bg-[#e9c49b] px-3 text-xs disabled:opacity-50">{busy?'삭제 중…':'삭제 확인'}</button></div></div>:<button disabled={busy} onClick={()=>setDeleting(review.id)} className="mt-2 min-h-11 rounded border border-[#c9a989] px-3 text-xs text-[#805532] disabled:opacity-50">리뷰 삭제</button>)}
          </article>)}
        </div>}
        {tab==='collection'&&<div className="space-y-3 p-5"><p className="text-xs text-muted">{serverProfile?'서버 누적 구매 기록':'시연 구매 기록'} · 배지 3회 / 5회 / 10회</p>
          {foods.map(({item,count,food})=>{const {earned,next}=food?{earned:food.badges.filter(b=>b.earned),next:food.nextBadge && {name:food.nextBadge.name,count:count+food.nextBadge.remainingCount}}:badges(count);return <article key={item.id} className="rounded-xl border border-[#d8bfa2] bg-paper p-3"><div className="flex items-center gap-3"><MenuImage item={item} width={72} height={54}/><div><p className="text-xs text-muted">{item.storeId?getStore(item.storeId).name:'수집 음식'}</p><h3 className="font-semibold">{item.name}</h3><p className="text-sm">누적 구매 {count}회</p></div></div><div className="mt-3 flex gap-2">{['브론즈','실버','골드'].map(name=><span key={name} className={`rounded-full border px-2 py-1 text-xs ${earned.some(b=>b.name===name)?'border-[#b47e36] bg-[#ffe8ac]':'border-[#d8c7b4] text-muted'}`}>{name} {earned.some(b=>b.name===name)?'획득':'잠김'}</span>)}</div><p className="mt-2 text-xs text-muted">{next?`${next.name}까지 ${next.count-count}회 남았어요.`:'모든 배지를 모았어요!'}</p></article>;})}
        </div>}
      </div>
    </section>
  </Dialog>;
}
