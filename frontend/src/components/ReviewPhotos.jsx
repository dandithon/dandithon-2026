import React,{useRef,useState} from 'react';
import {prepareReviewPhoto} from '../game/reviewPhoto';

export default function ReviewPhotos({photos,setPhotos,onUpload,disabled,supported,onBusy}){
  const [error,setError]=useState(''),[uploading,setUploading]=useState(false);
  const inFlight=useRef(false);
  const select=async event=>{
    const files=[...event.target.files];event.target.value='';
    if(inFlight.current||!files.length)return;
    if(files.length+photos.length>5){setError('사진은 최대 5장까지 첨부할 수 있어요.');return;}
    inFlight.current=true;setUploading(true);onBusy(true);setError('');
    try{
      for(const file of files){
        const compressed=await prepareReviewPhoto(file);
        const photo=await onUpload(compressed);
        setPhotos(current=>[...current,photo]);
      }
    }catch(problem){setError(problem.message||'사진을 업로드하지 못했어요. 다시 선택해 주세요.');}
    finally{inFlight.current=false;setUploading(false);onBusy(false);}
  };
  return <section aria-label="리뷰 사진" className="mt-4">
    <div className="flex items-center justify-between gap-2"><p className="text-sm">사진 <span className="text-xs text-muted">선택 사항 · 최대 5장</span></p><label className={`flex min-h-11 items-center rounded border-2 border-[#b68d59] bg-[#fff0cf] px-3 font-retro text-xs text-[#805532] focus-within:outline-2 focus-within:outline-offset-2 ${disabled||uploading||photos.length>=5||supported===false?'opacity-50':'cursor-pointer'}`}>
      {uploading?'사진 처리 중…':supported===false?'사진 첨부 준비 중':`+ 사진 추가 (${photos.length}/5)`}
      <input aria-label="리뷰 사진 선택" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={select} disabled={disabled||uploading||photos.length>=5||supported===false} className="sr-only"/>
    </label></div>
    {photos.length>0&&<ul className="mt-2 flex gap-2 overflow-x-auto pb-1">{photos.map((photo,index)=><li key={`${photo.url}-${index}`} className="relative shrink-0 rounded-lg border border-[#c9a989] bg-[#efe2ce] p-1"><img src={photo.preview} alt={`첨부 사진 ${index+1}`} className="size-[64px] rounded object-cover"/><button type="button" disabled={disabled||uploading} aria-label={`첨부 사진 ${index+1} 제거`} onClick={()=>setPhotos(current=>current.filter((_,i)=>i!==index))} className="absolute -right-1 -top-1 flex size-11 items-start justify-end p-1 text-lg"><span className="flex size-6 items-center justify-center rounded border border-[#946034] bg-paper">×</span></button></li>)}</ul>}
    <p className="mt-1 text-[10px] leading-4 text-muted">{supported===false?'서버 업데이트 후 사진을 첨부할 수 있어요.':'한 장당 8MB 이하 · 업로드 전 사진 크기를 줄이고 위치정보를 제거해요.'}</p>
    {error&&<p role="alert" className="mt-2 text-xs leading-5 text-[#a0432f]">{error}</p>}
  </section>;
}
