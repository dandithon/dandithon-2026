import React from 'react';
import Dialog from './Dialog';
import {menu,getStore} from '../api/catalog';
export default function PurchaseComplete({orders,onClose,onReceipts}){
  const total=orders.reduce((sum,o)=>sum+menu.find(m=>m.id===o.itemId).price*o.quantity,0);
  const ready=orders.length>0&&orders.every(order=>order.canReview===true||order.status==='ready');
  const wait=Math.max(0,...orders.map(order=>order.readyAfterSeconds||0));
  return <Dialog label="구매 완료" onClose={onClose}><section className="absolute inset-x-[26px] top-[240px] rounded-[28px] border-2 border-[#b78a55] bg-paper p-7 text-center shadow-xl">
    <p className="font-retro text-[32px] text-[#668348]">✓</p><h2 className="mt-3 font-retro text-[24px]">구매가 완료됐어요!</h2>
    <p className="mt-3 text-xs text-muted">게임 코인으로 구매한 데모 주문이에요.</p>
    <ul className="my-5 max-h-[160px] overflow-auto text-left text-sm">{orders.map(o=>{const item=menu.find(m=>m.id===o.itemId);return <li key={o.id} className="border-b border-[#d8bfa2] py-2"><span className="block text-xs text-muted">{getStore(item.storeId).name}</span>{item.name} · {o.quantity}개</li>;})}</ul>
    <p className="font-semibold">사용 코인 {total.toLocaleString()}개</p><p className="mt-2 text-xs leading-5 text-muted">{ready?'시연 주문이 준비됐어요. 영수증에서 바로 리뷰를 쓸 수 있어요.':wait?`약 ${wait}초 후 영수증에서 준비 상태를 확인해 주세요.`:'영수증에서 준비 상태와 리뷰 작성 가능 여부를 확인해 주세요.'}</p>
    <button onClick={onReceipts} className="mt-6 w-full rounded-lg border-2 border-[#946034] bg-[#ffc857] py-3 font-semibold">영수증 확인</button><button onClick={onClose} className="mt-3 w-full py-2 text-sm underline">시장으로 돌아가기</button>
  </section></Dialog>;
}
