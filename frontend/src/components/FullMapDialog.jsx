import React,{useState} from 'react';
import Dialog from './Dialog';
import FullMapArtwork from './FullMapArtwork';
import {ArtButton} from './Art';
import {stores} from '../api/catalog';
import {crowdLevel} from '../game/crowd';
export default function FullMapDialog({onClose,onStore,waits,busy,zones}){
  const [list,setList]=useState(false);
  return <Dialog label="서문시장 전체 지도" onClose={onClose} shade={false}>
    <FullMapArtwork zones={zones}/>
    <div className="absolute right-3 top-3"><ArtButton screen="125:1213" name="imgImage51" width={40} height={39} label="전체 지도 닫기" onClick={onClose}/></div>
    <button onClick={()=>setList(v=>!v)} aria-expanded={list} className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-xl border-2 border-[#9d7049] bg-paper px-5 py-3 font-retro shadow">{list?'가게 목록 접기':'탐험할 가게 보기'}</button>
    {list&&<section className="absolute bottom-[80px] left-4 right-4 rounded-2xl border-2 border-[#9d7049] bg-paper p-4 shadow-xl" aria-label="탐험 가게 목록">
      <h2 className="font-retro text-lg">가게 둘러보기</h2><p className="my-2 text-xs text-muted">시연 대기시간 · 실제 위치 안내가 아닌 시장 일러스트입니다.</p>
      {stores.map(store=><button key={store.id} disabled={busy} onClick={()=>onStore(store.id)} className="flex min-h-[52px] w-full items-center justify-between border-t border-[#d8bfa2] text-left text-sm disabled:opacity-50"><span>{store.name}</span><span className="text-xs text-muted">{Number.isFinite(waits[store.id])?`${waits[store.id]}분 · ${store.crowdLabel||crowdLevel(waits[store.id]).label}`:'대기 정보 없음'} →</span></button>)}
    </section>}
  </Dialog>;
}
