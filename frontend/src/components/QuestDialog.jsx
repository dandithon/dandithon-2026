import React,{useState} from 'react';
import Dialog from './Dialog';
import {Art,ArtButton} from './Art';
export default function QuestDialog({state,onClose,onClaim,notify,busy,onRefresh}){
  const [tab,setTab]=useState('daily');
  const group=tab==='quest'?'achievement':tab;
  const tasks=(state.quests?.[group]||[]).map(q=>({...q,progress:q.current,max:q.target,reward:q.rewardCoin}));
  return <Dialog label="퀘스트" onClose={onClose} panelBounds={{left:20,top:210,width:360,height:432}}>
    <div className="pointer-events-none absolute left-0 top-[105px]"><Art screen="125:1213" name="imgImage65" width={401} height={602} crop={{height:'76.87%',width:'93.99%',left:'3.02%',top:'15.78%'}}/></div>
    <div className="absolute left-[298px] top-[229px]"><ArtButton screen="125:1213" name="imgImage51" width={40} height={39} label="퀘스트 닫기" onClick={onClose}/></div>
    <nav aria-label="퀘스트 종류" className="absolute left-[1px] top-[246px] z-10 flex flex-col gap-[4px]">
      {[['daily',<>일일<br/>미션</>],['quest','퀘스트'],['event','이벤트']].map(([id,label],i)=><div key={id} className="h-[74px]"><ArtButton screen="125:1213" name={tab===id?'imgImage68':'imgImage69'} width={78} height={78} label={id==='daily'?'일일 미션':label} aria-pressed={tab===id} onClick={()=>setTab(id)} crop={tab!==id?{height:'85.01%',width:'91.16%',left:'5.22%',top:'7.74%'}:undefined}><span className="text-center text-[12px] leading-[18px]">{label}</span></ArtButton></div>)}
    </nav>
    <button disabled={busy} onClick={onRefresh} className="absolute left-[105px] top-[612px] w-[200px] text-center text-[11px] text-[#806453] underline disabled:opacity-50">미션 진행도 새로고침</button>
    <h2 className="absolute left-[95px] top-[260px] w-[215px] text-center font-retro text-[20px] leading-[22px] text-[#3e281f]">{tab==='daily'?'오늘의 미션':tab==='quest'?'시장 퀘스트':'이벤트'}</h2>
    <p className="absolute left-[95px] top-[285px] w-[215px] text-center text-[10px] leading-[22px] text-[#806453]">{tab==='daily'?'한국시간 자정 초기화 · 미션별 하루 1회 보상':'새로운 소식을 준비하고 있어요.'}</p>
    {(tab==='daily'||(state.quests && tasks.length>0))?<div className="absolute left-[88px] top-[317px] flex w-[240px] flex-col gap-[8px]">
      {tasks.map(task=>{const claimed=task.status==='CLAIMED'||state.claimed.includes(task.id),complete=task.status?task.status==='COMPLETED':task.progress>=task.max;return <article key={task.id} className="rounded-[10px] border border-[#d5b49a] bg-[#fff2dc] p-[10px]">
        <h3 className="text-[11px] font-semibold leading-[16px] text-[#4a3024]">{task.title}</h3>
        <div className="mt-[7px] flex items-center gap-[8px]">
          <div className="min-w-0 flex-1"><div role="progressbar" aria-label={task.title} aria-valuenow={task.progress} aria-valuemin={0} aria-valuemax={task.max} className="h-[8px] overflow-hidden rounded-full bg-[#e7d5b8]"><div className="h-full rounded-full bg-[#a47a3e]" style={{width:`${task.progress/task.max*100}%`}}/></div><p className="mt-[4px] text-[10px] text-[#806453]">{task.progress}/{task.max} · 보상 {task.reward} 코인</p></div>
          <button disabled={!complete||claimed||busy} onClick={()=>onClaim(task.id)} aria-label={`${task.title} ${claimed?'보상 수령 완료':complete?'보상 받기':'진행 중'}`} className="h-[30px] w-[68px] shrink-0 rounded-md border border-[#b88c4d] bg-[#ffcd6a] text-[10px] font-semibold disabled:bg-[#e7ddcb] disabled:text-[#87745f]">{claimed?'수령 완료':complete?'보상 받기':'진행 중'}</button>
        </div>
      </article>;})}
    </div>:<p className="absolute left-[105px] top-[350px] w-[200px] text-center text-sm leading-7 text-muted">아직 등록된 {tab==='quest'?'추가 퀘스트':'이벤트'}가 없어요.</p>}
  </Dialog>;
}
