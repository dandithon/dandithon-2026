import React,{useRef,useState} from 'react';
import Dialog from './Dialog';
import art from '../assets/figma.json';
import {chargeAmount} from '../game/coins';
import ResetDemoPanel from './ResetDemoPanel';

export default function CoinDialog({balance,busy,live,onClose,onCharge,onCheckBalance,onReset,onReload}){
  const [error,setError]=useState(''),[done,setDone]=useState(false),[uncertain,setUncertain]=useState(false);
  const [amount,setAmount]=useState(String(chargeAmount));
  const numericAmount=Number(amount);
  const valid=/^\d+$/.test(amount)&&Number.isSafeInteger(numericAmount)&&numericAmount>=1&&numericAmount<=10_000_000;
  const pending=useRef(false);
  const charge=async()=>{
    if(pending.current||busy||done||uncertain||!valid)return;
    pending.current=true;setError('');
    try{await onCharge(numericAmount);setDone(true);}
    catch(error){setError(error.message||'충전 결과를 확인하지 못했어요.');setUncertain(true);}
    finally{pending.current=false;}
  };
  const check=async()=>{
    if(pending.current||busy)return;
    pending.current=true;
    try{await onCheckBalance();setError('');}
    catch(error){setError(error.message||'잔액을 불러오지 못했어요.');}
    finally{pending.current=false;}
  };
  return <Dialog label="코인 충전" onClose={busy?()=>{}:onClose}>
    <section className="absolute inset-x-[26px] top-1/2 max-h-[88%] -translate-y-1/2 overflow-y-auto rounded-[24px] border-[3px] border-[#946034] bg-[#fff4df] p-6 text-center shadow-[inset_0_0_0_3px_#e5c18f,0_8px_0_#513724]" aria-busy={busy}>
      <header className="flex items-center justify-between gap-3"><h2 className="font-retro text-[24px] text-[#513724]">코인 충전</h2><button disabled={busy} onClick={onClose} aria-label="코인 충전 닫기" className="size-9 rounded-lg border-2 border-[#946034] bg-[#f2dfbf] font-retro text-xl disabled:opacity-50">×</button></header>
      <span aria-hidden="true" className="relative mx-auto mt-5 block size-[64px] overflow-hidden rounded-full"><img src={art['40:41'].imgImage4} alt="" className="absolute -left-[46px] -top-[42px] h-[156px] w-[440px] max-w-none"/></span>
      <p className="mt-4 text-xs text-[#806453]">현재 보유 코인</p><p className="mt-1 break-all font-retro text-[28px] text-[#513724]">{balance.toLocaleString('ko-KR')} <span className="text-sm">코인</span></p>
      <fieldset disabled={busy||done||uncertain} className="mt-5 text-left">
        <legend className="mb-2 text-xs text-[#806453]">충전할 코인</legend>
        <div className="grid grid-cols-2 gap-2">{[1000,10000,100000,1000000].map(value=><button key={value} type="button" aria-pressed={numericAmount===value} onClick={()=>setAmount(String(value))} className={`rounded-lg border px-2 py-2 font-retro text-sm ${numericAmount===value?'border-[#946034] bg-[#ffdc8a]':'border-[#d8b58a] bg-[#f9e8c8]'}`}>{value.toLocaleString('ko-KR')}</button>)}</div>
        <label htmlFor="coin-amount" className="mt-3 block text-xs text-[#806453]">직접 입력 (1~10,000,000)</label>
        <input id="coin-amount" inputMode="numeric" value={amount} onChange={e=>setAmount(e.target.value)} aria-invalid={!valid} className="mt-1 w-full rounded-lg border-2 border-[#d8b58a] bg-[#fffaf0] px-3 py-2 text-right text-base"/>
        {!valid&&<p className="mt-1 text-xs text-[#9d3826]">1~10,000,000 사이의 정수를 입력해 주세요.</p>}
      </fieldset>
      <div className="my-4 rounded-xl border-2 border-[#d8b58a] bg-[#f9e8c8] px-3 py-4"><p className="font-retro text-[25px] text-[#9b5a19]">+ {valid?numericAmount.toLocaleString('ko-KR'):'—'} 코인</p><p className="mt-2 text-xs leading-5 text-[#806453]">무료 시연용 게임 코인이에요.<br/>실제 결제나 요금 청구는 없어요.</p></div>
      <div aria-live="polite">{done&&<p className="mb-4 text-sm font-semibold text-[#57713f]">충전이 완료됐어요!</p>}{error&&<p role="alert" className="mb-3 break-words text-xs leading-5 text-[#9d3826]">{error}</p>}{uncertain&&<p className="mb-4 text-xs leading-5 text-[#806453]">요청이 처리됐을 수 있어요. 먼저 잔액을 확인해 주세요. 이 창에서는 충전을 다시 보내지 않아요.</p>}</div>
      {uncertain?<button disabled={busy} onClick={check} className="w-full rounded-xl border-2 border-[#946034] bg-[#f2dfbf] py-3 font-retro disabled:opacity-50">{busy?'잔액 확인 중…':'현재 잔액 확인'}</button>:done?<button onClick={onClose} className="w-full rounded-xl border-2 border-[#946034] bg-[#ffc857] py-3 font-retro">시장으로 돌아가기</button>:<button disabled={busy||!valid} onClick={charge} className="w-full rounded-xl border-2 border-[#946034] bg-[#ffc857] py-3 font-retro text-lg shadow-[0_4px_0_#b47b35] disabled:opacity-50">{busy?'충전 중…':'무료 코인 받기'}</button>}
      <ResetDemoPanel busy={busy} live={live} onReset={onReset} onReload={onReload}/>
      <p className="mt-5 text-[10px] leading-4 text-[#806453]">{live?'공용 게스트의 잔액에 반영돼요.':'오프라인 시연 · 이 브라우저에만 저장돼요.'}</p>
    </section>
  </Dialog>;
}
