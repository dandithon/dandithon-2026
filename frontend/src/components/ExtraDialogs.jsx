import React,{useState} from 'react';
import Dialog from './Dialog';
import {menu,getStore} from '../mocks/fixtures';
const panel='absolute left-[24px] top-[230px] w-[354px] rounded-[24px] border-2 border-[#9d7049] bg-paper p-[24px] shadow-xl';
const primary='rounded-lg border-2 border-[#946034] bg-[#ffc857] px-4 py-3 text-sm font-semibold disabled:opacity-50';
export function ReviewEditor({orderId,onClose,onSave,busy}){
  const [text,setText]=useState(''),[rating,setRating]=useState(5);
  return <Dialog label="리뷰 작성" onClose={onClose}><form className={panel} onSubmit={e=>{e.preventDefault();onSave(orderId,text,rating);}}>
    <div className="flex items-center justify-between"><h2 className="font-pixel text-lg">리뷰 작성</h2><button type="button" onClick={onClose} aria-label="리뷰 작성 닫기" className="px-2 text-2xl">×</button></div>
    <label className="mt-5 block text-sm">별점<select value={rating} onChange={e=>setRating(Number(e.target.value))} className="ml-4 rounded border border-[#d8bfa2] bg-white p-2">{[5,4,3,2,1].map(x=><option key={x} value={x}>{x}점</option>)}</select></label>
    <label className="mt-5 block text-sm">방문 후기<textarea required maxLength={500} value={text} onChange={e=>setText(e.target.value)} className="mt-2 block h-[140px] w-full resize-none rounded-lg border border-[#d8bfa2] bg-white p-3 text-sm" placeholder="맛있게 드셨나요? 후기를 남겨 주세요."/></label>
    <p className="mt-1 text-right text-xs text-muted">{text.length}/500</p><button disabled={busy||!text.trim()} className={`${primary} mt-4 w-full`}>리뷰 등록</button>
  </form></Dialog>;
}
export function CartDialog({state,onClose,onOrder,onRemove,busy}){
  const total=state.cart.reduce((sum,x)=>sum+menu.find(m=>m.id===x.itemId).price*x.quantity,0);
  return <Dialog label="담은 메뉴" onClose={onClose}><section className={panel}>
    <div className="flex items-center justify-between"><h2 className="font-pixel text-lg">담은 메뉴</h2><button onClick={onClose} aria-label="담은 메뉴 닫기" className="px-2 text-2xl">×</button></div>
    <div className="my-5 flex max-h-[250px] flex-col gap-4 overflow-auto">{state.cart.length?state.cart.map(x=><div key={x.itemId} className="flex items-center gap-3 text-sm"><span className="flex-1"><span className="block text-[11px] text-muted">{getStore(menu.find(m=>m.id===x.itemId).storeId).name}</span>{menu.find(m=>m.id===x.itemId).name} {x.quantity}개</span><button onClick={()=>onRemove(x.itemId)} className="rounded border px-3 py-2">삭제</button></div>):<p className="text-sm text-muted">담은 메뉴가 없어요.</p>}</div>
    <p className="mb-2 text-sm">총 {total} 코인 · 보유 {state.balance} 코인</p><button className={`${primary} w-full`} onClick={()=>onOrder(state.cart)} disabled={busy||!state.cart.length}>전체 주문하기</button>
  </section></Dialog>;
}
