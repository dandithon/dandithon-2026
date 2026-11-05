import {useEffect,useRef,useState} from 'react';
import {readRoute,routeHash} from './routes';
export default function useRoute(){
  const [route,setRoute]=useState(()=>readRoute(window.location.hash));
  const current=useRef(route);
  useEffect(()=>{
    const restore=()=>{current.current=readRoute(window.location.hash);setRoute(current.current);};
    window.addEventListener('popstate',restore);window.addEventListener('hashchange',restore);
    return()=>{window.removeEventListener('popstate',restore);window.removeEventListener('hashchange',restore);};
  },[]);
  const update=patch=>{
    const next={...current.current,...patch};current.current=next;
    const hash=routeHash(next);
    if(hash!==window.location.hash)window.history.pushState(null,'',window.location.pathname+window.location.search+hash);
    setRoute(next);
  };
  return [route,update];
}
