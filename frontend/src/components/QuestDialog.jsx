import React,{useState} from 'react';
import Dialog from './Dialog';
import {Art,ArtButton} from './Art';
export default function QuestDialog({state,onClose,onClaim,notify,busy}){
  const [tab,setTab]=useState('daily');
  const tasks=[{id:'visit',title:'서문시장 가게 3곳 방문하기',progress:Math.min(3,state.visits.length),max:3,reward:300,image:'imgImage73'}, {id:'review',title:'시장 가게 방문 후 리뷰 작성하기',progress:state.reviews.length>2?2:1,max:2,reward:200,image:'imgImage74'}, {id:'photo',title:'사진 1장 찍기',progress:1,max:1,reward:100,image:'imgImage78'}];
  return <Dialog label="퀘스트" onClose={onClose}>
    <div className="pointer-events-none absolute left-0 top-[105px]"><Art screen="125:1213" name="imgImage65" width={401} height={602} crop={{height:'76.87%',width:'93.99%',left:'3.02%',top:'15.78%'}}/></div>
    <div className="absolute left-[298px] top-[229px]"><ArtButton screen="125:1213" name="imgImage51" width={40} height={39} label="퀘스트 닫기" onClick={onClose}/></div>
    <nav aria-label="퀘스트 종류" className="absolute left-[1px] top-[246px] flex flex-col">
      {[['daily',<>일일<br/>미션</>],['quest','퀘스트'],['event','이벤트']].map(([id,label],i)=><div key={id} className="h-[80px]"><ArtButton screen="125:1213" name={tab===id?'imgImage68':'imgImage69'} width={95} height={95} label={id==='daily'?'일일 미션':label} aria-pressed={tab===id} onClick={()=>setTab(id)} crop={tab!==id?{height:'85.01%',width:'91.16%',left:'5.22%',top:'7.74%'}:undefined}><span className="ml-[5px] text-center leading-[22px]">{label}</span></ArtButton></div>)}
    </nav>
    <h2 className="absolute left-[95px] top-[260px] w-[215px] text-center font-retro text-[20px] leading-[22px] text-[#3e281f]">{tab==='daily'?'오늘의 미션':tab==='quest'?'시장 퀘스트':'이벤트'}</h2>
    <p className="absolute left-[95px] top-[285px] w-[215px] text-center text-[10px] leading-[22px] text-[#806453]">{tab==='daily'?'매일 새로운 미션에 도전해보세요!':'새로운 소식을 준비하고 있어요.'}</p>
    {tab==='daily'?<div className="absolute left-[76px] top-[317px] flex w-[252px] flex-col gap-[8px]">
      {tasks.map((task,i)=>{const claimed=state.claimed.includes(task.id),complete=task.progress>=task.max;return <article key={task.id} className="relative h-[82px] rounded-[10px] border border-[#d5b49a] bg-[#fff2dc]">
        <h3 className="ml-[31px] mt-[9px] whitespace-nowrap text-[10px] font-semibold leading-[22px] text-[#4a3024]">{task.title}</h3>
        <div className="ml-[31px] -mt-[3px]"><Art screen="125:1213" name={complete?'imgImage78':task.progress>0?'imgImage74':'imgImage73'} width={complete?109:113} height={complete?25:26} crop={!task.progress?{height:'96.92%',width:'102.66%',left:'-2.34%',top:'18.23%'}:undefined}/><p className="ml-[5px] text-[9px] leading-[22px] text-[#927767]">{task.progress}/{task.max}</p></div>
        <div className={`absolute right-0 ${i===0?'top-[23px]':'top-[7px]'}`}><Art screen="125:1213" name={i===0?'imgImage71':'imgImage75'} width={83} height={34} crop={i===0?{height:'106.64%',width:'94.91%',left:'2.71%',top:'.46%'}:undefined}/><div className="absolute inset-0 flex items-center gap-[1px] pl-[9px]"><Art screen="125:1213" name="imgImage44" width={23} height={22}/><span className="font-retro text-[12px] text-[#593c25]">x {task.reward}</span></div></div>
        {(i>0||complete)&&<div className="absolute right-0 top-[39px]"><ArtButton screen="125:1213" name={complete?'imgImage80':'imgImage72'} width={83} height={34} label={`${task.title} ${claimed?'보상 수령 완료':complete?'보상 받기':'진행 중'}`} disabled={claimed||busy} onClick={()=>complete?onClaim(task.id):notify('조리가 완료된 주문의 리뷰를 작성해 주세요.')}><span className="text-[12px] text-[#593c25]">{claimed?'수령 완료':complete?'완료':'진행 중'}</span></ArtButton></div>}
      </article>;})}
    </div>:<p className="absolute left-[105px] top-[350px] w-[200px] text-center text-sm leading-7 text-muted">아직 등록된 {tab==='quest'?'추가 퀘스트':'이벤트'}가 없어요.</p>}
  </Dialog>;
}
