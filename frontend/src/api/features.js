export function featuresFromSchema(schema){
  if(!schema?.paths||typeof schema.paths!=='object')throw Error('API 기능 정보를 확인할 수 없어요.');
  return {
    photoUpload:Boolean(schema.paths['/api/v1/review-photos']?.post),
    reviewDelete:Boolean(schema.paths['/api/v1/reviews/{reviewId}']?.delete),
    experience:Boolean(schema.paths['/api/v1/users/me/exp']?.post),
    favorites:Boolean(schema.paths['/api/v1/users/me/favorites/{storeId}']?.patch),
  };
}

export function createFeatureDiscovery(baseUrl){
  return async()=>{
    const url=new URL(baseUrl);url.pathname='/v3/api-docs';url.search='';url.hash='';
    const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw Error('API 기능 정보를 확인할 수 없어요.');
    return featuresFromSchema(await response.json());
  };
}
