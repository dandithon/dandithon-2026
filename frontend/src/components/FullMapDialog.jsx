import React from 'react';
import Dialog from './Dialog';
import {ArtButton} from './Art';
import FullMapArtwork from './FullMapArtwork';

export default function FullMapDialog({onClose,onReturn,notify,zones}){
  const select=id=>{
    if(id==='zone-2'){onReturn();return;}
    const messages={
      'zone-1':'1지구(섬유·한복)는 현재 준비 중인 구역이에요!',
      'zone-dongsan':'동산상가(패션·의류)는 현재 준비 중인 구역이에요!',
      'zone-night':'야시장은 저녁 7시 이후 오픈 준비 중이에요! 🌙',
    };
    if(messages[id])notify(messages[id]);
  };
  return <Dialog label="서문시장 전체 지도" onClose={onClose} shade={false}>
    <section className="absolute inset-0">
      <FullMapArtwork zones={zones?.length?zones:undefined} onZone={select}/>
      <div className="absolute right-4 top-4"><ArtButton screen="125:1213" name="imgImage51" width={40} height={39} label="전체 지도 닫기" onClick={onClose}/></div>
    </section>
  </Dialog>;
}
