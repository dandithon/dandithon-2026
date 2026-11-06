import React from 'react';
import {Art} from './Art';
import manifest from '../assets/figma.json';

export default function StoreReviewCard({review}){
  const photos=review.imageUrls?.length?review.imageUrls:review.photos?[manifest['85:581'].imgImage54]:[];
  return <article aria-label={`${review.name}님의 리뷰`} className="flex max-h-[336px] flex-col border-t border-[#d8bfa2] py-4">
    <header className="flex shrink-0 items-center gap-2">
      <Art screen="85:581" name="imgImage52" width={52} height={47} className="-scale-x-100"/>
      <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h2 className="truncate font-retro text-sm">{review.name}</h2><time className="shrink-0 text-[10px] text-muted">{review.date}</time></div><p className="mt-1 text-sm text-[#a66a20]" aria-label={`${review.rating}점`}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</p></div>
    </header>
    <p tabIndex={0} aria-label="리뷰 내용" className="mt-2 min-h-0 max-h-[120px] overflow-y-auto overscroll-contain whitespace-pre-wrap break-words pr-2 font-sans text-xs leading-5 text-[#4a372b]">{review.text}</p>
    {photos.length>0&&<ul aria-label="리뷰 사진" className="mt-3 flex shrink-0 gap-2 overflow-x-auto pb-2">{photos.map((url,index)=><li key={`${url}-${index}`} className="shrink-0"><a href={url} target="_blank" rel="noreferrer" aria-label={`리뷰 사진 ${index+1} 크게 보기`} className="block rounded-lg border border-[#d8bfa2] bg-[#f3e5d2] p-1"><img src={url} alt={`리뷰 사진 ${index+1}`} className="h-[88px] w-[120px] rounded object-contain" loading="lazy"/></a></li>)}</ul>}
  </article>;
}
