import React,{useState} from 'react';
import Dialog from './Dialog';
import PlayerCharacter from './PlayerCharacter';
import MenuImage from './MenuImage';
import art from '../assets/exploration.json';
import mapArt from '../assets/figma.json';
import {menu,getStore} from '../mocks/fixtures';
import {badges,hasOutfit} from '../game/progression';

export default function ProfileDialog({state,preferences,progress,onClose,onEquip,onRename,busy}){
  const [tab,setTab]=useState('bag'),[editing,setEditing]=useState(false),[name,setName]=useState(preferences.nickname);
  const {items,equipped,counts}=progress;
  const fullOutfit=hasOutfit(equipped);
  return <Dialog label="내 프로필" onClose={onClose}>
    <section className="absolute inset-x-0 bottom-0 top-[134px] flex flex-col rounded-t-[30px] bg-[#fff9f0]">
      <header className="relative h-[97px] shrink-0 px-[38px] pt-[31px]">
        {editing?<form className="mr-7 flex gap-2" onSubmit={async e=>{e.preventDefault();if(await onRename(name))setEditing(false);}}>
          <label className="sr-only" htmlFor="nickname">닉네임</label><input autoFocus id="nickname" value={name} onChange={e=>setName(e.target.value)} maxLength={16} className="min-w-0 w-[130px] rounded border border-[#c9a989] bg-white px-2 py-2 text-sm"/>
          <button disabled={busy||!name.trim()} className="rounded border border-[#c9a989] px-2 text-xs">저장</button><button type="button" onClick={()=>setEditing(false)} className="text-xs">취소</button>
        </form>:<><h2 className="max-w-[150px] truncate font-retro text-[25px]">{preferences.nickname}</h2><button onClick={()=>{setName(preferences.nickname);setEditing(true);}} className="absolute left-[203px] top-[18px] h-[61px] w-[137px]" aria-label="닉네임 변경"><img alt="" src={art.profile.imgImage118} className="absolute inset-0 h-[61px] w-[157px] max-w-none"/><span className="absolute left-[60px] top-[25px] whitespace-nowrap font-mona text-[11px] text-[#5b3b29]">닉네임 변경</span></button></>}
        <button onClick={onClose} aria-label="프로필 닫기" className="absolute right-[17px] top-[29px] h-[39px] w-[40px]"><img alt="" src={art.profile.imgImage51} className="size-full"/></button>
        <p className="mt-2 text-[10px] text-muted">로컬 시연 프로필 · 레벨/경험치 규칙 준비 중</p>
      </header>
      <nav aria-label="프로필 메뉴" className="mx-5 grid shrink-0 grid-cols-3 gap-[7px]">
        {[['bag','가방'],['reviews','내 리뷰'],['collection','수집 음식']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)} className={`h-[42px] rounded-[10px] text-[16px] ${tab===id?'bg-[#d9b99b] font-semibold text-[#49362c]':'bg-[#f0e4d6] text-[#806b5c]'}`}>{label}</button>)}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5" key={tab}>
        {tab==='bag'&&<>
          <div className="relative ml-[25px] mr-[38px] mt-[27px] flex h-[260px] justify-between">
            <div className="relative h-[260px] w-[228px] rounded-[10px] bg-[#f5e6d2] shadow-[inset_0px_4px_4px_0px_rgba(0,0,0,.25)]">
              {fullOutfit?<img alt="모자·자켓·신발을 착용한 캐릭터 정면" src={art.profile.imgImage111} className="absolute left-[62px] top-[43px] h-[174px] w-[104px]"/>:<div className="absolute left-[58px] top-[43px] h-[174px] w-[112px]"><PlayerCharacter direction="down" backImage={mapArt['40:41'].imgImage87}/></div>}
              {!fullOutfit&&Object.keys(equipped).length>0&&<p className="absolute inset-x-2 bottom-2 text-center text-[10px] text-muted">개별 장비 외형 준비 중 · 착용 상태는 오른쪽에 표시</p>}
            </div>
            <div className="flex w-[78px] flex-col justify-between">
              {['head','body','feet'].map(slot=>{const item=items.find(i=>i.slot===slot),worn=equipped[slot]===item.id;return <button key={slot} disabled={busy||!item.unlocked} aria-label={`${item.name} ${worn?'해제':'착용'}`} aria-pressed={worn} onClick={()=>onEquip(item.id)} className="relative h-[76px] rounded-[10px] border border-[#c9a989] bg-[#fff7ea] disabled:opacity-50"><img alt="" src={art.profile[item.image]} className="mx-auto h-[44px] w-[64px]"/><span className="absolute inset-x-0 bottom-1 text-[10px]">{worn?'착용 중':item.unlocked?'착용하기':'잠김'}</span></button>;})}
            </div>
          </div>
          <h3 className="mx-[28px] mb-2 mt-4 font-retro text-[15px]">보유 아이템</h3>
          <div className="mx-[18px] grid grid-cols-4 gap-[6px] rounded-[15px] border-2 border-[#ecded0] bg-[#fdf3e780] p-[8px]">
            {items.map(item=><button key={item.id} disabled={busy||!item.unlocked} aria-label={`${item.name}: ${item.unlocked?(equipped[item.slot]===item.id?'착용 중, 해제':'획득 완료, 착용'):`잠김, 떡볶이 ${item.required}회 필요`}`} aria-pressed={equipped[item.slot]===item.id} onClick={()=>onEquip(item.id)} className={`flex min-h-[108px] flex-col items-center rounded-[10px] border py-2 ${item.unlocked?'border-[#d6a65d] bg-[#fff0cf]':'border-[#d8c7b4] bg-[#f6eadd]'}`}>
              <div className="relative h-[33px] w-[48px] overflow-hidden"><img alt="" src={art.profile[item.image]} className="size-full object-cover" style={item.slot==='neck'?{position:'absolute',height:'108.14%',width:'108.09%',left:'-4.13%',top:'-.08%'}:undefined}/></div>
              <span className="mt-1 rounded-full bg-[#e9d4be] px-1 text-[10px] text-[#76543d]">떡볶이 {item.required}회</span><span className="mt-1 text-xs font-semibold">{item.name}</span><span className="mt-1 text-[9px] text-muted">{item.unlocked?equipped[item.slot]===item.id?'착용 중':'획득 완료':`${item.count}/${item.required}회`}</span>
            </button>)}
            {[1,3,5,8].map(count=><div key={count} className="flex min-h-[108px] flex-col items-center rounded-[10px] border border-[#d8c7b4] bg-[#f6eadd] py-2"><img alt="잠김" src={art.profile.imgImage103} className="size-[43px]"/><span className="rounded-full bg-[#e9d4be] px-1 text-[10px]">칼국수 {count}회</span><span className="mt-1 text-xs">?</span><span className="mt-1 text-[9px] text-muted">장비 준비 중</span></div>)}
          </div><p className="mx-6 mt-2 text-[10px] leading-4 text-muted">가방 조건은 Figma 기준 시연 규칙이에요. 횟수는 주문 메뉴 기록당 1회이며 수량과 구분해요.</p>
        </>}
        {tab==='reviews'&&<div className="space-y-3 p-5">
          {state.reviews.length===0?<p className="py-10 text-center text-sm text-muted">아직 작성한 리뷰가 없어요. 영수증에서 리뷰를 남겨보세요.</p>:state.reviews.map(review=><article key={review.id} className="rounded-xl border border-[#d8bfa2] bg-paper p-4"><h3 className="font-semibold">{getStore(review.storeId).name}</h3><p className="my-2 text-sm text-[#9b5a19]" aria-label={`${review.rating}점`}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{review.text}</p>{review.photos&&<img alt="시연 리뷰 음식 사진" src={mapArt['85:581'].imgImage54} className="mt-2 h-auto w-full"/>}<p className="mt-2 text-xs text-muted">{review.date} · {preferences.nickname}</p></article>)}
        </div>}
        {tab==='collection'&&<div className="space-y-3 p-5"><p className="text-xs text-muted">시연 구매 기록 · 배지 3회 / 5회 / 10회</p>
          {menu.map(item=>{const count=counts[item.id]||0,{earned,next}=badges(count);return <article key={item.id} className="rounded-xl border border-[#d8bfa2] bg-paper p-3"><div className="flex items-center gap-3"><MenuImage item={item} width={72} height={54}/><div><p className="text-xs text-muted">{getStore(item.storeId).name}</p><h3 className="font-semibold">{item.name}</h3><p className="text-sm">누적 구매 {count}회</p></div></div><div className="mt-3 flex gap-2">{['브론즈','실버','골드'].map(name=><span key={name} className={`rounded-full border px-2 py-1 text-xs ${earned.some(b=>b.name===name)?'border-[#b47e36] bg-[#ffe8ac]':'border-[#d8c7b4] text-muted'}`}>{name} {earned.some(b=>b.name===name)?'획득':'잠김'}</span>)}</div><p className="mt-2 text-xs text-muted">{next?`${next.name}까지 ${next.count-count}회 남았어요.`:'모든 배지를 모았어요!'}</p></article>;})}
        </div>}
      </div>
    </section>
  </Dialog>;
}
