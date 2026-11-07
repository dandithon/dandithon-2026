import React, { useState } from 'react';
import Dialog from './Dialog';
import { getGuestId, setGuestId } from '../api/http';

export default function DemoDialog({
  state,
  preferences,
  busy,
  live,
  onClose,
  onCharge,
  onGainExp,
  onReset,
  onReload,
  onVisitAll,
  notify,
}) {
  const currentGuestId = getGuestId();
  const [customId, setCustomId] = useState('');
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState('');

  const switchGuest = async (newId) => {
    if (busy || acting) return;
    setActing(true);
    try {
      setGuestId(newId);
      setMsg(`게스트 ID [${newId}]로 전환했어요.`);
      await onReload();
    } catch (err) {
      setMsg(err.message || '전환 실패');
    } finally {
      setActing(false);
    }
  };

  const handleCharge = async (amount) => {
    if (busy || acting) return;
    setActing(true);
    try {
      await onCharge(amount);
      setMsg(`+${amount.toLocaleString('ko-KR')} 코인을 충전했어요!`);
      if (notify) notify(`+${amount.toLocaleString('ko-KR')} 코인을 충전했어요!`);
    } catch (err) {
      setMsg(err.message || '충전 실패');
    } finally {
      setActing(false);
    }
  };

  const handleGainExp = async (amount) => {
    if (busy || acting) return;
    setActing(true);
    try {
      await onGainExp(amount);
      setMsg(`+${amount} EXP를 획득했어요!`);
      if (notify) notify(`+${amount} EXP를 획득했어요!`);
    } catch (err) {
      setMsg(err.message || '경험치 지급 실패');
    } finally {
      setActing(false);
    }
  };

  const handleVisitAll = async () => {
    if (busy || acting) return;
    setActing(true);
    try {
      await onVisitAll();
      setMsg('가게 3곳 둘러보기 미션을 달성했어요! 퀘스트 창을 확인해 주세요.');
      if (notify) notify('가게 3곳 둘러보기 미션을 달성했어요!');
    } catch (err) {
      setMsg(err.message || '방문 처리 실패');
    } finally {
      setActing(false);
    }
  };

  const handleReset = async () => {
    if (busy || acting) return;
    if (!window.confirm('현재 게스트의 주문, 리뷰, 퀘스트 기록을 초기화할까요?')) return;
    setActing(true);
    try {
      await onReset();
      setMsg('현재 게스트의 시연 데이터를 초기화했어요.');
      if (notify) notify('시연 데이터를 초기화했어요.');
    } catch (err) {
      setMsg(err.message || '초기화 실패');
    } finally {
      setActing(false);
    }
  };

  return (
    <Dialog label="발표 시연 컨트롤러" onClose={busy || acting ? () => {} : onClose}>
      <section
        className="absolute inset-x-[20px] top-1/2 max-h-[90%] -translate-y-1/2 overflow-y-auto rounded-[24px] border-[3px] border-[#80502c] bg-[#fff4df] p-5 text-center shadow-[inset_0_0_0_3px_#e5c18f,0_8px_0_#513724]"
        aria-busy={busy || acting}
      >
        <header className="flex items-center justify-between border-b border-[#d8b58a] pb-3">
          <div className="text-left">
            <h2 className="font-retro text-[20px] text-[#513724]">🛠️ 발표 시연 컨트롤러</h2>
            <p className="text-[11px] text-[#806453]">해커톤 발표 & 심사위원 시연 전용 도구</p>
          </div>
          <button
            disabled={busy || acting}
            onClick={onClose}
            aria-label="데모 컨트롤러 닫기"
            className="size-8 rounded-lg border-2 border-[#946034] bg-[#f2dfbf] font-retro text-lg disabled:opacity-50"
          >
            ×
          </button>
        </header>

        {/* 현재 세션 상태 */}
        <div className="mt-4 rounded-xl border border-[#d8b58a] bg-[#f9e8c8] p-3 text-left text-xs leading-5 text-[#513724]">
          <div className="flex justify-between font-semibold">
            <span>👤 현재 사용자: {preferences?.nickname || '승우'}</span>
            <span className="rounded bg-[#80502c] px-2 py-0.5 text-[10px] text-white">
              ID: {currentGuestId}
            </span>
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-[#7a583d]">
            <span>💰 잔액: {(state?.balance || 0).toLocaleString('ko-KR')} 코인</span>
            <span>⭐ Lv.{preferences?.level || 1} ({preferences?.exp || 0} / {preferences?.nextLevelExp || 100} EXP)</span>
          </div>
        </div>

        {/* 1. 다중 접속 게스트 전환 */}
        <div className="mt-4 text-left">
          <h3 className="font-retro text-[14px] text-[#513724]">👥 게스트 세션 전환 (격리 테스트)</h3>
          <p className="mt-0.5 text-[11px] text-[#806453]">
            게스트를 바꾸면 이전 사용자의 잔액·주문·퀘스트에 영향을 주지 않고 새로운 환경에서 시작합니다.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={busy || acting || currentGuestId === '1'}
              onClick={() => switchGuest('1')}
              className={`flex-1 rounded-lg border-2 py-2 font-retro text-xs ${
                currentGuestId === '1'
                  ? 'border-[#80502c] bg-[#ffc857] font-bold text-[#4a2e16]'
                  : 'border-[#d8b58a] bg-[#fffaf0] text-[#513724]'
              }`}
            >
              👑 발표자 (ID: 1)
            </button>
            <button
              type="button"
              disabled={busy || acting}
              onClick={() => switchGuest(String(Math.floor(1000 + Math.random() * 9000)))}
              className="flex-1 rounded-lg border-2 border-[#d8b58a] bg-[#fffaf0] py-2 font-retro text-xs text-[#513724] hover:bg-[#ffeecb]"
            >
              🎲 신규 게스트 생성
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              placeholder="게스트 ID 직접 입력"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="flex-1 rounded-lg border border-[#d8b58a] bg-[#fffaf0] px-2 py-1.5 text-xs text-right"
            />
            <button
              type="button"
              disabled={busy || acting || !customId.trim()}
              onClick={() => {
                if (customId.trim()) switchGuest(customId.trim());
              }}
              className="rounded-lg border-2 border-[#946034] bg-[#f2dfbf] px-3 py-1.5 font-retro text-xs text-[#513724] disabled:opacity-50"
            >
              이동
            </button>
          </div>
        </div>

        {/* 2. 시연 치트 프리셋 */}
        <div className="mt-4 border-t border-[#d8b58a] pt-3 text-left">
          <h3 className="font-retro text-[14px] text-[#513724]">⚡ 시연용 원클릭 치트</h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy || acting}
              onClick={() => handleCharge(10000)}
              className="rounded-lg border-2 border-[#946034] bg-[#ffdc8a] p-2 text-left font-retro text-xs text-[#513724] shadow-sm active:translate-y-0.5"
            >
              🪙 +10,000 코인
              <span className="block text-[10px] font-sans text-[#7a583d]">주문 결제 시연용</span>
            </button>
            <button
              type="button"
              disabled={busy || acting}
              onClick={() => handleCharge(50000)}
              className="rounded-lg border-2 border-[#946034] bg-[#ffdc8a] p-2 text-left font-retro text-xs text-[#513724] shadow-sm active:translate-y-0.5"
            >
              💰 +50,000 코인
              <span className="block text-[10px] font-sans text-[#7a583d]">풍족한 쇼핑 시연</span>
            </button>
            <button
              type="button"
              disabled={busy || acting}
              onClick={() => handleGainExp(50)}
              className="rounded-lg border-2 border-[#57713f] bg-[#e3f0d5] p-2 text-left font-retro text-xs text-[#314a1c] shadow-sm active:translate-y-0.5"
            >
              ⭐ +50 EXP
              <span className="block text-[10px] font-sans text-[#4a6b2c]">경험치 바 채우기</span>
            </button>
            <button
              type="button"
              disabled={busy || acting}
              onClick={() => handleGainExp(200)}
              className="rounded-lg border-2 border-[#57713f] bg-[#e3f0d5] p-2 text-left font-retro text-xs text-[#314a1c] shadow-sm active:translate-y-0.5"
            >
              🎉 +200 EXP
              <span className="block text-[10px] font-sans text-[#4a6b2c]">즉시 레벨업 연출</span>
            </button>
          </div>
          <button
            type="button"
            disabled={busy || acting}
            onClick={handleVisitAll}
            className="mt-2 w-full rounded-lg border-2 border-[#80502c] bg-[#ffeecb] p-2 text-left font-retro text-xs text-[#513724] shadow-sm active:translate-y-0.5"
          >
            📜 가게 3곳 둘러보기 퀘스트 달성
            <span className="block text-[10px] font-sans text-[#7a583d]">서문분식·칼국수·호떡 둘러보기 기록 ➔ 300코인 보상 수령 가능</span>
          </button>
        </div>

        {/* 3. 내 데이터 초기화 */}
        <div className="mt-4 border-t border-[#d8b58a] pt-3 text-left">
          <h3 className="font-retro text-[14px] text-[#9d3826]">🔄 내 시연 데이터 초기화</h3>
          <p className="mt-0.5 text-[11px] text-[#806453]">
            현재 게스트({currentGuestId})의 주문, 영수증, 리뷰, 퀘스트, 장비를 초기 상태로 되돌립니다. (다른 사용자는 유지)
          </p>
          <button
            type="button"
            disabled={busy || acting}
            onClick={handleReset}
            className="mt-2 w-full rounded-lg border-2 border-[#9d3826] bg-[#f9e6d9] py-2 font-retro text-xs text-[#79432f] hover:bg-[#fadad1] active:translate-y-0.5"
          >
            현재 게스트 데이터 초기화 (1,000 코인 / Lv.1 리셋)
          </button>
        </div>

        {msg && (
          <p role="status" className="mt-3 rounded bg-[#fff0d0] p-2 text-center text-xs font-semibold text-[#80502c]">
            {msg}
          </p>
        )}

        <button
          onClick={onClose}
          disabled={busy || acting}
          className="mt-4 w-full rounded-xl border-2 border-[#946034] bg-[#ffc857] py-2.5 font-retro text-sm text-[#4a2e16] shadow-[0_3px_0_#b47b35] active:translate-y-0.5"
        >
          확인 완료 (창 닫기)
        </button>
      </section>
    </Dialog>
  );
}
