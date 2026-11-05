import React from 'react';
import MenuImage from './MenuImage';
import Dialog from './Dialog';
import {Art,ArtButton} from './Art';
import {menu,getStore} from '../api/catalog';
export default function ReceiptDialog({orders,onClose,onReview}){
  return <Dialog label="내 영수증" onClose={onClose} shade={false} >
    <div className="pointer-events-none absolute -left-[2px] top-0"><img src="/assets/125-1186-imgRectangle10.svg" alt=""/></div>
    <section data-receipt-panel className="absolute left-0 w-full" style={{height:'min(602px, calc(100% - 24px))',top:'max(12px, calc((100% - 602px) / 2))'}}>
    <div className="pointer-events-none absolute inset-0 [&>span]:!h-full"><Art screen="125:1186" name="imgImage65" width={401} height={602}/></div>
    <div className="absolute left-[297px] top-[94px]"><ArtButton screen="125:1186" name="imgImage51" width={40} height={39} label="영수증 닫기" onClick={onClose}/></div>
    <h2 className="absolute left-0 top-[132px] w-full text-center font-retro text-[22px] text-black">내 영수증</h2>
    <div className="absolute left-[80px] bottom-[70px] top-[181px] flex min-h-0 w-[246px] flex-col gap-[6px] overflow-y-auto">
      {orders.length===0&&<p className="py-6 text-center text-sm text-muted">아직 주문한 메뉴가 없어요.</p>}
      {orders.map(order=>{const item=menu.find(x=>x.id===order.itemId);const source={tteok:'imgImage32',fried:'imgImage66',fish:'imgImage67'}[item.id];return <article key={order.id} className="flex min-h-[76px] shrink-0 items-center rounded-[10px] border border-[#d8bfa2] bg-[#fff1de] pl-[8px] pr-[9px]">
        <div className="flex h-[56px] w-[72px] shrink-0 items-center rounded-[10px] bg-[#efe2ce]">{item.emoji?<MenuImage item={item} width={66} height={49}/>:<Art screen={source?'125:1186':'75:189'} name={source||item.image} width={66} height={49}/>}</div>
        <div className="ml-[7px] min-w-0 flex-1"><p className="mb-1 text-[9px] text-muted">{getStore(item.storeId).name}</p><h3 className="text-[13px] leading-4 font-semibold">{item.name}</h3><p className="mt-[1px] text-[12px] text-[#806956]">{order.quantity}개</p></div>
        <div className="flex w-[57px] shrink-0 flex-col gap-[6px] text-center text-[12px] font-semibold">
          <span className={`rounded-[10px] py-[6px] ${order.status==='cooking'?'bg-[#f3d9b3] text-[#825b30]':order.status==='ready'?'bg-[#dcebcb] text-[#49673a]':'bg-[#e8e0d4] text-[#776a5e]'}`}>{order.status==='cooking'?'조리 중':order.status==='ready'?'조리 완료':'작성 완료'}</span>
          {(order.canReview??order.status==='ready')&&<button onClick={()=>onReview(order.id)} className="rounded-[10px] bg-[#f5c76a] py-[6px] text-[#4d321f]">리뷰 작성</button>}
        </div>
      </article>;})}
    </div>
    </section>
  </Dialog>;
}
