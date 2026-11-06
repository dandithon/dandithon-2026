import React,{useRef,useState} from 'react';

export default function ResetDemoPanel({busy,live,onReset,onReload}){
  const [confirmed,setConfirmed]=useState(false),[attempted,setAttempted]=useState(false),[error,setError]=useState('');
  const pending=useRef(false);
  const reset=async()=>{
    if(busy||pending.current||!confirmed||attempted)return;
    pending.current=true;setAttempted(true);
    try{await onReset();}
    catch(error){setError(error.message||'초기화 결과를 확인하지 못했어요.');}
    finally{pending.current=false;}
  };
  return <details className="mt-5 border-t border-[#d8b58a] pt-4 text-left">
    <summary className="cursor-pointer text-xs text-[#8e4a32]">시연 데이터 초기화</summary>
    <div className="mt-3 rounded-lg border border-[#d7ac95] bg-[#f9e6d9] p-3 text-xs leading-5 text-[#79432f]">
      <p className="font-semibold">{live?'공용 게스트 전체 데이터가 변경돼요.':'이 브라우저의 시연 데이터를 초기화해요.'}</p>
      <ul className="my-2 list-disc pl-4"><li>코인 1,000 · 닉네임 승우 · 레벨 1 / 경험치 0으로 복구</li><li>주문·리뷰·즐겨찾기·구매 횟수·장비 획득/착용·배지 삭제</li><li>일일 미션 진행도와 보상 수령 기록 초기화</li></ul>
      <p>이전 상태로 되돌릴 수 없어요.{live?' 다른 사용자가 진행한 내용도 함께 초기화돼요.':''}</p>
      {!attempted&&<label className="mt-3 flex items-start gap-2"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)} className="mt-1 size-4 shrink-0"/><span>위 기록을 모두 지우는 것에 동의합니다.</span></label>}
      {error&&<p role="alert" className="mt-3">{error} 요청이 처리됐을 수 있으므로 초기화를 다시 보내지 않고 전체 데이터를 확인해 주세요.</p>}
      {attempted?<button disabled={busy} onClick={onReload} className="mt-3 w-full rounded border border-[#a86c50] bg-[#fff4df] py-2 disabled:opacity-50">전체 데이터 다시 불러오기</button>:<button disabled={busy||!confirmed} onClick={reset} className="mt-3 w-full rounded border-2 border-[#9a543b] bg-[#e8c1a7] py-2 font-semibold disabled:opacity-40">{busy?'처리 중…':'시연 데이터 전체 초기화'}</button>}
    </div>
  </details>;
}
