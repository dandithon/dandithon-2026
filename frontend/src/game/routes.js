export function readRoute(hash){
  const parts=hash.replace(/^#/, '').split('/');
  const page=parts[0];
  if(page==='store'||page==='menu')return {page,storeId:parts[1]||'seomun',tab:['menu','reviews','summary','info'].includes(parts[2])?parts[2]:'menu'};
  return {page:page==='market'?'market':'start',storeId:'seomun',tab:'menu'};
}
export function routeHash({page,storeId,tab}){
  if(page==='store')return '#store/'+storeId;
  if(page==='menu')return '#menu/'+storeId+'/'+tab;
  return page==='market'?'#market':'';
}
