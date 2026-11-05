import React,{useState} from 'react';
import Dialog from './Dialog';
import {menu,getStore} from '../api/catalog';
const panel='absolute left-[24px] top-[230px] w-[354px] rounded-[24px] border-2 border-[#9d7049] bg-paper p-[24px] shadow-xl';
const primary='rounded-lg border-2 border-[#946034] bg-[#ffc857] px-4 py-3 text-sm font-semibold disabled:opacity-50';
export function ReviewEditor({orderId,onClose,onSave,busy}){
  const [text,setText]=useState(''),[rating,setRating]=useState(5);
  return <Dialog label="리뷰 작성" onClose={onClose}><form className={panel} onSubmit={e=>{e.preventDefault();onSave(orderId,text,rating);}}>
    <div className="flex items-center justify-between"><h2 className="font-pixel text-lg">리뷰 작성</h2><button type="button" onClick={onClose} aria-label="리뷰 작성 닫기" className="px-2 text-2xl">×</button></div>
    <fieldset disabled={busy} className="mt-5">
      <legend className="text-sm">별점</legend>
      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border-2 border-[#d8bfa2] bg-[#fff4df] px-2 py-2">
        <div className="flex">{[1,2,3,4,5].map(value=><label key={value} className="relative flex size-11 cursor-pointer items-center justify-center rounded disabled:opacity-50">
          <input type="radio" name="rating" value={value} checked={rating===value} onChange={()=>setRating(value)} aria-label={`${value}점`} className="peer sr-only"/>
          <svg aria-hidden="true" viewBox="0 0 32 32" className="size-9 overflow-visible rounded peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#2672c9]" shapeRendering="crispEdges">
            <path d="M14 2H18V8H21V11H29V16H26V19H23V23H25V29H20V26H17V24H15V26H12V29H7V23H9V19H6V16H3V11H11V8H14Z" fill={value<=rating?'#ffc857':'#f5e7d2'} stroke="#805532" strokeWidth="2" strokeLinejoin="miter"/>
            {value<=rating&&<path d="M15 5H17V12H12V14H7V13H13V10H15Z" fill="#fff3bb"/>}
          </svg>
        </label>)}</div>
        <span aria-hidden="true" className="shrink-0 font-retro text-sm text-[#805532]">{rating}점</span>
      </div>
    </fieldset>
    <label className="mt-5 block text-sm">방문 후기<textarea required maxLength={500} value={text} onChange={e=>setText(e.target.value)} className="mt-2 block h-[140px] w-full resize-none rounded-lg border border-[#d8bfa2] bg-white p-3 text-sm" placeholder="맛있게 드셨나요? 후기를 남겨 주세요."/></label>
    <p className="mt-1 text-right text-xs text-muted">{text.length}/500</p><button disabled={busy||!text.trim()} className={`${primary} mt-4 w-full`}>리뷰 등록</button>
  </form></Dialog>;
}
export function CartDialog({state,onClose,onOrder,onRemove,busy}){
  const groups=new Map();
  for(const row of state.cart){
    const storeId=menu.find(item=>item.id===row.itemId).storeId;
    if(!groups.has(storeId))groups.set(storeId,[]);
    groups.get(storeId).push(row);
  }
  const total=state.cart.reduce((sum,x)=>sum+menu.find(m=>m.id===x.itemId).price*x.quantity,0);
  return <Dialog label="담은 메뉴" onClose={onClose}><section className={panel}>
    <div className="flex items-center justify-between"><h2 className="font-pixel text-lg">담은 메뉴</h2><button onClick={onClose} aria-label="담은 메뉴 닫기" className="px-2 text-2xl">×</button></div>
    <div className="my-5 flex max-h-[250px] flex-col gap-4 overflow-auto">{state.cart.length?state.cart.map(x=><div key={x.itemId} className="flex items-center gap-3 text-sm"><span className="flex-1"><span className="block text-[11px] text-muted">{getStore(menu.find(m=>m.id===x.itemId).storeId).name}</span>{menu.find(m=>m.id===x.itemId).name} {x.quantity}개</span><button onClick={()=>onRemove(x.itemId)} className="rounded border px-3 py-2">삭제</button></div>):<p className="text-sm text-muted">담은 메뉴가 없어요.</p>}</div>
    <p className="mb-2 text-sm">총 {total} 코인 · 보유 {state.balance} 코인</p>{state.quests && groups.size>1 ? [...groups].map(([id,lines])=><button key={id} className={`${primary} mt-2 w-full`} onClick={()=>onOrder(lines)} disabled={busy}>{getStore(id).name} 주문하기</button>) : <button className={`${primary} w-full`} onClick={()=>onOrder(state.cart)} disabled={busy||!state.cart.length}>전체 주문하기</button>}
  </section></Dialog>;
}
