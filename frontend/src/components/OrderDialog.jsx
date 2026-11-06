import React,{useState} from 'react';
import MenuImage from './MenuImage';
import Dialog from './Dialog';
import {Art,ArtButton} from './Art';
export default function OrderDialog({item,onClose,onOrder,onAdd,busy}){
  const [quantity,setQuantity]=useState(1);
  return <Dialog label={`${item.name} 주문`} onClose={onClose}>
    <section className="absolute left-[18px] top-1/2 -translate-y-1/2 h-[431px] w-[366px] rounded-[30px] bg-[#be9e7c]">
      {item.featured&&<span className="absolute left-[29px] top-[19px] rounded-[5px] bg-[#c85a43] px-[13px] py-[4px] text-[12px] text-white">대표</span>}
      <div className="absolute right-[19px] top-[10px]"><ArtButton screen="85:390" name="imgImage51" width={40} height={39} label="주문 창 닫기" onClick={onClose}/></div>
      <div className="absolute inset-x-0 bottom-0 h-[286px] rounded-[30px] bg-[#eae1d0] shadow-[0_4px_4px_#0004,inset_0_4px_4px_#0004]"/>
      <div className="absolute left-[88px] top-[68px] drop-shadow-md"><MenuImage item={item} width={189} height={139}/></div>
      <div className="absolute inset-x-[29px] top-[200px]">
        <div className="flex items-center justify-between"><h2 className="text-[25px] font-semibold leading-[30px]">{item.name}</h2><span className="flex items-center font-retro text-[20px]"><Art screen="85:390" name="imgImage36" width={30} height={29}/>{item.price*quantity}</span></div>
        <p className="mt-[14px] text-[15px] leading-[15px] text-muted">{item.description}</p>
      </div>
      <div className="absolute left-[23px] right-[7px] top-[276px] flex items-center">
        <ArtButton screen="85:390" name="imgImage46" width={45} height={46} label="수량 줄이기" onClick={()=>setQuantity(q=>Math.max(1,q-1))} disabled={quantity===1}>−</ArtButton>
        <div className="relative ml-[3px]"><Art screen="85:390" name="imgImage47" width={64} height={48}/><output aria-label="주문 수량" className="absolute inset-0 flex items-center justify-center font-retro text-[20px]">{quantity}</output></div>
        <ArtButton screen="85:390" name="imgImage48" width={40} height={41} label="수량 늘리기" onClick={()=>setQuantity(q=>Math.min(99,q+1))} disabled={quantity===99} className="ml-[5px]">+</ArtButton>
        <ArtButton screen="85:390" name="imgImage37" width={133} height={67} label="주문하기" onClick={()=>onOrder([{itemId:item.id,quantity}])} disabled={busy} className="ml-auto">주문하기</ArtButton>
      </div>
      <div className="absolute left-[47.6875px] top-[333px]"><ArtButton screen="85:390" name="imgImage49" width={270.625} height={90} label="메뉴 담기" onClick={()=>onAdd(item.id,quantity)} disabled={busy}><span className="flex -translate-y-[1px] items-center gap-[7px]"><Art screen="85:390" name="imgImage50" width={40} height={38}/><span>메뉴 담기</span></span></ArtButton></div>
    </section>
  </Dialog>;
}
