import {marketApi} from './market.js';
import {progression} from '../game/progression.js';
const KEY='dandithon-exploration-v1';
const initial=()=>({nickname:'승우',equipped:{}});
function read(){
  const raw=localStorage.getItem(KEY);
  if(!raw)return initial();
  let data;
  try{data=JSON.parse(raw);}catch{throw Error('프로필 저장 정보를 읽지 못했어요. 다시 시도하거나 프로필 설정을 초기화해 주세요.');}
  if(data?.version!==1||typeof data.nickname!=='string'||!data.equipped||Array.isArray(data.equipped)||typeof data.equipped!=='object')throw Error('프로필 저장 형식을 확인할 수 없어요. 프로필 설정을 초기화해 주세요.');
  return {nickname:data.nickname,equipped:data.equipped};
}
function write(value){
  try{localStorage.setItem(KEY,JSON.stringify({version:1,...value}));}catch{throw Error('기기에 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.');}
  return value;
}
// Local adapter only. No invented HTTP endpoints or changes to the shared market API.
export const explorationApi={
  async load(){return read();},
  async resetPreferences(){return write(initial());},
  async rename(nickname){const value=nickname.trim();if(!value||[...value].length>8)throw Error('닉네임은 1~8자로 입력해 주세요.');return write({...read(),nickname:value});},
  async equip(id){
    const preferences=read(),state=await marketApi.load();
    const item=progression(state,preferences).items.find(i=>i.id===id);
    if(!item?.unlocked)throw Error('아직 획득하지 않은 장비예요.');
    const equipped={...preferences.equipped};
    if(equipped[item.slot]===id)delete equipped[item.slot];else equipped[item.slot]=id;
    const saved=write({...preferences,equipped});
    if(id==='tteok-hat'&&equipped.head===id)await marketApi.recordHatTry();
    return saved;
  },
};
