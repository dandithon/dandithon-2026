import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '../src/api/http.js';
import {createLiveApi} from '../src/api/live.js';
import {validatePhoto,maxPhotoBytes} from '../src/game/reviewPhoto.js';
import {projectLocation} from '../src/game/geolocation.js';

test('multipart uploads keep the browser boundary and do not JSON encode files',async()=>{
  const previous=globalThis.fetch;const calls=[];
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({success:true,data:{url:'/api/v1/review-photos/test'}})};};
  try{
    const body=new FormData();body.append('file',new Blob(['photo'],{type:'image/jpeg'}),'photo.jpg');
    await createClient('https://api.example.com/api/v1')('/review-photos',{method:'POST',body});
    assert.equal(calls.length,1);assert.equal(calls[0].options.body,body);assert.equal(calls[0].options.headers['Content-Type'],undefined);
  }finally{globalThis.fetch=previous;}
});
test('uploaded URLs attach to the correct server order and render from backend origin',async()=>{
  const calls=[];
  const reads={
    '/stores':{stores:[{id:'seomun'}]},'/stores/seomun':{id:'seomun',menus:[{id:'tteok'}]},
    '/stores/seomun/reviews':{reviews:[]},'/users/me':{balance:1000},'/orders/receipts':{receipts:[{orderId:'ord-photo',menuId:'tteok',storeId:'seomun',status:'ready'}]},'/quests':{daily:[]},'/map/zones':{zones:[]},
  };
  const request=async(path,options)=>{
    if(!options)return reads[path];calls.push([path,options]);
    if(path==='/review-photos'){assert.equal(options.body.get('orderId'),'ord-photo');return {url:'/api/v1/review-photos/photo-1'};}
    assert.deepEqual(options.body.imageUrls,['/api/v1/review-photos/photo-1']);return {reviewId:'review-photo',rating:4};
  };
  const {market}=createLiveApi(request,{getItem:()=>null,setItem:()=>{}},undefined,'https://backend.example.com/api/v1');await market.load();
  const photo=await market.uploadReviewPhoto('ord-photo:tteok',new Blob(['jpg'],{type:'image/jpeg'}));
  assert.equal(photo.preview,'https://backend.example.com/api/v1/review-photos/photo-1');
  const state=await market.review('ord-photo:tteok','사진 리뷰',4,'승우',[photo.url]);
  assert.equal(state.reviews[0].imageUrls[0],photo.preview);assert.equal(state.reviews[0].photos,true);assert.equal(calls.length,2);
});
test('reject unsupported or oversized images before uploading',()=>{
  for(const type of ['image/jpeg','image/png','image/heic','image/webp'])assert.doesNotThrow(()=>validatePhoto({type,size:100}));
  assert.throws(()=>validatePhoto({type:'image/svg+xml',size:100}));
  assert.throws(()=>validatePhoto({type:'image/jpeg',size:maxPhotoBytes+1}),/8MB/);
});
test('weak GPS without calibration recommends fallback without inventing a map position',()=>{
  assert.deepEqual(projectLocation({latitude:35,longitude:128,accuracy:100},null),{status:'inaccurate',point:null});
  assert.deepEqual(projectLocation({latitude:35,longitude:128,accuracy:5},null),{status:'unmapped',point:null});
});
