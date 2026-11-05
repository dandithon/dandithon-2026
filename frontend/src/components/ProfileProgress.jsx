import React from 'react';

export default function ProfileProgress({profile,supported}){
  const value=Number.isFinite(profile.exp)?Math.max(0,profile.exp):0;
  const maximum=Number.isFinite(profile.nextLevelExp)&&profile.nextLevelExp>0?profile.nextLevelExp:100;
  return <section aria-label="레벨과 경험치" className="mx-5 mb-3 rounded-lg border-2 border-[#b68d59] bg-[#f5e6d2] px-3 py-2 shadow-[inset_0_2px_0_#fff7e8,0_2px_0_#dfc7a8]">
    <div className="mb-2 flex items-center justify-between gap-3">
      <span className="rounded border border-[#946034] bg-[#e6c18d] px-2 py-1 font-retro text-xs text-[#513724]">Lv. {profile.level}</span>
      <span className="text-xs text-[#805532]"><span className="mr-2 font-retro">EXP</span>{value.toLocaleString('ko-KR')} / {maximum.toLocaleString('ko-KR')}</span>
    </div>
    <div role="progressbar" aria-label="다음 레벨까지 경험치" aria-valuemin={0} aria-valuemax={maximum} aria-valuenow={Math.min(value,maximum)} className="h-3 overflow-hidden border-2 border-[#805532] bg-[#dec9ac] shadow-[inset_0_2px_0_#b89b77]">
      <div className="h-full bg-[#e6af4b] shadow-[inset_0_2px_0_#ffdf92]" style={{width:`${Math.min(100,value/maximum*100)}%`}}/>
    </div>
    <p className="mt-2 text-[10px] leading-4 text-[#806956]">{supported===false?'현재 서버는 구매 경험치 연동을 준비 중이에요.':'구매 후 서버에 반영된 경험치예요.'}</p>
  </section>;
}
