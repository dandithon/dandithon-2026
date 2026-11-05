import React from 'react';
import {storeLocations} from '../game/storeLocation';

export default function StoreSpotlight({store}){
  const area=storeLocations[store?.id];
  if(!area)return null;
  return <div aria-hidden="true" className="store-spotlight pointer-events-none absolute rounded-xl border-[3px] border-[#ffd266] bg-[#ffd2661a] shadow-[0_0_0_3px_#50331b,0_0_0_6px_#ffe9a5]" style={{left:area.x,top:area.y,width:area.width,height:area.height}}>
    <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border-2 border-[#946034] bg-[#fff0c2] px-3 py-1 font-retro text-xs text-[#513724]">{store.name}</span>
  </div>;
}
