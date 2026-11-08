export const maxPhotoBytes=8*1024*1024;
export function validatePhoto(file){
  if(!file||!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type))throw Error('JPEG·PNG 사진을 선택해 주세요. HEIC 사진은 브라우저에서 변환할 수 있어야 해요.');
  if(file.size>maxPhotoBytes)throw Error('사진은 한 장당 8MB 이하로 선택해 주세요.');
}
// Canvas export strips EXIF/GPS metadata before any network transmission.
export async function prepareReviewPhoto(file){
  validatePhoto(file);
  const url=URL.createObjectURL(file);
  try{
    const image=new Image();image.src=url;
    await image.decode().catch(()=>{throw Error('사진을 읽지 못했어요. HEIC라면 JPEG로 변환해 다시 선택해 주세요.');});
    if(image.naturalWidth*image.naturalHeight>25_000_000)throw Error('사진 해상도가 너무 커요. 작은 크기로 선택해 주세요.');
    const scale=Math.min(1,1280/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));
    if(!blob||blob.size>2*1024*1024)throw Error('사진 크기를 줄여 다시 선택해 주세요.');
    return blob;
  }finally{URL.revokeObjectURL(url);}
}
