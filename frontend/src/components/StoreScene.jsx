import React from 'react';
import {Art,ArtButton} from './Art';
export default function StoreScene({store,onBack,onFavorite,favorite,dim=false,expanded,screen='48:143'}){
  return <>
    <div className={`absolute left-0 ${dim?'top-px':'top-0'}`}><Art screen={screen} name="imgImage21" width={402} height={868}/></div>
    {expanded!==undefined&&<div className="store-scene-greeting pointer-events-none absolute left-0 top-0" style={{opacity:expanded?1:0}}><Art screen="75:189" name="imgImage21" width={402} height={868}/></div>}
    <h1 className="absolute left-[85px] w-[232px] text-center top-[59px] font-pixel text-[25px] tracking-[-.25px] text-[#302019]">{store.name}</h1>
    <div className="absolute left-[16px] top-[50px]"><ArtButton screen={screen} name={screen==='48:143'?'imgImage32':'imgImage30'} width={56} height={53} label="시장으로 돌아가기" onClick={onBack}/></div>
    <div className="absolute left-[326px] top-[50px]"><ArtButton screen={screen} name={screen==='48:143'?'imgImage33':'imgImage31'} width={56} height={53} crop={{height:'136.17%',width:'135.21%',left:'-12.73%',top:'-18.57%'}} label="즐겨찾기" aria-pressed={favorite} onClick={onFavorite}/>{favorite&&<span className="pointer-events-none absolute -right-1 -top-1 rounded-full bg-paper px-1 text-[10px]">✓</span>}</div>
    {dim&&<div className="pointer-events-none absolute inset-0 bg-[rgba(30,37,43,0.5)]"/>}
  </>;
}
