import React from 'react';
import Dialog from './Dialog';
import {ArtButton} from './Art';

export default function FullMapDialog({onClose}){
  return <Dialog label="전체 지도 준비 안내" onClose={onClose} shade={false}>
    <section className="absolute inset-0 flex flex-col items-center justify-center bg-[#fff9f0] px-7 text-center">
      <div className="absolute right-4 top-4"><ArtButton screen="125:1213" name="imgImage51" width={40} height={39} label="전체 지도 닫기" onClick={onClose}/></div>
      <p className="font-retro text-sm text-[#946034]">서문시장 전체 지도</p>
      <h2 className="mt-5 font-retro text-[30px] text-[#513724]">준비 중입니다!</h2>
      <p className="mt-5 text-sm leading-7 text-[#806453]">전체 지도를 준비하고 있어요.<br/>시장 탐험은 계속 이용할 수 있어요.</p>
      <button onClick={onClose} className="mt-8 rounded-xl border-2 border-[#946034] bg-[#ffc857] px-7 py-3 font-retro shadow-[0_4px_0_#b47b35]">시장으로 돌아가기</button>
    </section>
  </Dialog>;
}
