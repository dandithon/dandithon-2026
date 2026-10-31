import React from 'react';
import {Art} from './Art';
export default function MenuImage({item,width,height}){
 return item.image?<Art screen="75:189" name={item.image} width={width} height={height} alt={item.name}/>:<span role="img" aria-label={item.name} style={{width,height,fontSize:height*.65}} className="flex items-center justify-center leading-none drop-shadow-sm">{item.emoji}</span>;
}
