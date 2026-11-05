import React from 'react';
import {Art} from './Art';
import {menuArtwork} from '../assets/storeArtwork';
export default function MenuImage({item,width,height}){
 const image=menuArtwork[item.id];
 if(image)return <img src={image} alt={item.name} width={width} height={height} draggable="false" className="pixelated shrink-0 object-contain" style={{width,height}}/>;
 return item.image?<Art screen="75:189" name={item.image} width={width} height={height} alt={item.name}/>:<span role="img" aria-label={item.name} style={{width,height,fontSize:height*.65}} className="flex items-center justify-center leading-none drop-shadow-sm">{item.emoji}</span>;
}
