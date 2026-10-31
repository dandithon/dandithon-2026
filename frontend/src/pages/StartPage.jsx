import React from 'react';
import { Art, ArtButton } from '../components/Art';
export default function StartPage({onStart}){
  return <section className="relative size-full overflow-hidden bg-white" aria-label="서문시장 시작 화면">
    <div className="absolute -left-[8px] -top-[5px]"><Art screen="40:99" name="imgImage18" width={410} height={893} crop={{height:'100%',width:'100.07%',left:'-0.16%',top:'-0.03%'}} /></div>
    <h1 className="absolute left-[148px] top-[416px] font-mona text-[25px] font-bold tracking-[2.5px] text-[#3b2618]">서문시장</h1>
    <p className="absolute left-[143px] top-[467px] font-pixel text-[16px] tracking-[2.24px] text-[#e8d1a9] [text-shadow:1px_1px_#5b3425]">걸어서 맛보는<br/>대구의 이야기</p>
    <div className="absolute left-[61px] top-[685px]"><ArtButton screen="40:99" name="imgImage1" width={281} height={189} label="시작하기" onClick={onStart}><span className="-translate-y-[6px] font-mona text-[20px] tracking-[3px]">시작하기</span></ArtButton></div>
  </section>;
}
