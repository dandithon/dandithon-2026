import React,{useEffect,useRef,useState} from 'react';
import Dialog from './Dialog';
import {demoRequest,presenterGuestId} from '../api/service';

const buttonClass='rounded-lg border-2 border-[#946034] bg-[#ffdc8a] p-2 font-retro text-xs text-[#513724] disabled:opacity-50';

export default function DemoDialog({onClose}){
  const [user,setUser]=useState(null);
  const [busy,setBusy]=useState(true);
  const [message,setMessage]=useState('');
  const pending=useRef(true);
  useEffect(()=>{
    let active=true;
    demoRequest('/users/me').then(profile=>{
      if(active)setUser(profile);
    }).catch(error=>{
      if(active)setMessage(error.message);
    }).finally(()=>{
      if(active){pending.current=false;setBusy(false);}
    });
    return()=>{active=false;};
  },[]);

  const run=async(action,success)=>{
    if(pending.current)return;
    pending.current=true;setBusy(true);setMessage('');
    try{
      const profile=await action();
      if(profile?.userId!==undefined)setUser(profile);
      setMessage(success);
    }catch(error){setMessage(error.message);}
    finally{pending.current=false;setBusy(false);}
  };
  const charge=amount=>run(
    ()=>demoRequest('/users/me/charge',{method:'POST',body:{amount}}),
    `데모 계정에 ${amount.toLocaleString('ko-KR')} 코인을 지급했어요.`
  );
  const gainExp=exp=>run(
    ()=>demoRequest('/users/me/exp',{method:'POST',body:{exp}}),
    `데모 계정에 ${exp} EXP를 지급했어요.`
  );
  const visitAll=()=>run(async()=>{
    for(const id of ['seomun','noodle','hotteok'])await demoRequest('/stores/'+id+'/browse',{method:'POST'});
  },'데모 계정의 가게 3곳 방문을 기록했어요.');
  const reset=()=>{
    if(!window.confirm('발표자 데모 계정의 서버 기록을 초기화할까요?'))return;
    return run(()=>demoRequest('/demo/reset',{method:'POST'}),'데모 계정의 서버 기록을 초기화했어요.');
  };

  return <Dialog label="발표 시연 제어 패널" onClose={busy?()=>{}:onClose}>
    <section className="absolute inset-x-[20px] top-1/2 max-h-[90%] -translate-y-1/2 overflow-y-auto rounded-[24px] border-[3px] border-[#80502c] bg-[#fff4df] p-5 text-[#513724] shadow-[inset_0_0_0_3px_#e5c18f,0_8px_0_#513724]" aria-busy={busy}>
      <header className="flex items-center justify-between border-b border-[#d8b58a] pb-3">
        <h2 className="font-retro text-[20px]">발표 시연 제어 패널</h2>
        <button type="button" disabled={busy} onClick={onClose} aria-label="제어 패널 닫기" className="size-8 rounded-lg border-2 border-[#946034] bg-[#f2dfbf] font-retro text-lg">×</button>
      </header>
      <div className="mt-4 rounded-xl border border-[#d8b58a] bg-[#f9e8c8] p-3 text-xs leading-5">
        <p className="font-semibold">제어 대상 · 발표자 데모 계정 (ID {presenterGuestId})</p>
        {user&&<p>{user.nickname} · {user.balance.toLocaleString('ko-KR')} 코인 · Lv.{user.level} ({user.exp} EXP)</p>}
        <a href={'?demo='+presenterGuestId+'#market'} target="_blank" rel="noopener noreferrer" tabIndex={0} className="mt-1 inline-block font-semibold underline">발표자 화면 새 탭에서 열기</a>
      </div>
      <fieldset disabled={busy} className="mt-4">
        <legend className="font-retro text-sm">서문분식 시연 대기열</legend>
        <p className="mt-1 text-[11px] text-[#806453]">모든 접속자에게 보이는 가상 일반 주문 대기열이에요.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" className={buttonClass} onClick={()=>run(()=>demoRequest('/demo/seomun/queue/seed',{method:'POST'}),'대기열을 만들었어요.')}>대기열 생성</button>
          <button type="button" className={buttonClass} onClick={()=>run(()=>demoRequest('/demo/seomun/queue',{method:'DELETE'}),'대기열을 비웠어요.')}>대기열 비우기</button>
        </div>
      </fieldset>
      <fieldset disabled={busy} className="mt-4 border-t border-[#d8b58a] pt-3">
        <legend className="font-retro text-sm">데모 계정 조작</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" className={buttonClass} onClick={()=>charge(10000)}>+10,000 코인</button>
          <button type="button" className={buttonClass} onClick={()=>charge(50000)}>+50,000 코인</button>
          <button type="button" className={buttonClass} onClick={()=>gainExp(50)}>+50 EXP</button>
          <button type="button" className={buttonClass} onClick={()=>gainExp(200)}>+200 EXP</button>
        </div>
        <button type="button" className={buttonClass+' mt-2 w-full'} onClick={visitAll}>가게 3곳 방문 기록</button>
        <button type="button" className={buttonClass+' mt-2 w-full bg-[#f9e6d9]'} onClick={reset}>데모 계정 초기화</button>
      </fieldset>
      {message&&<p role="status" className="mt-3 rounded bg-[#fff0d0] p-2 text-center text-xs font-semibold">{message}</p>}
    </section>
  </Dialog>;
}
