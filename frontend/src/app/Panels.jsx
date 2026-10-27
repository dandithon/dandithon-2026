import { useEffect, useId, useRef, useState } from 'react';
import { useGame } from './GameContext.jsx';
import { mockShops } from '../mocks/market.js';
import MarketScene from '../features/exploration/MarketScene.jsx';
import { Character } from '../features/exploration/MarketArt.jsx';

function ProfilePanel() {
  const { user } = useGame();
  const [tab, setTab] = useState('가방');
  return <>
    <div className="profile-summary"><svg viewBox="0 0 60 65" aria-label="임시 캐릭터" role="img"><Character x={30} y={48} /></svg>
      <div><strong>{user.nickname}</strong><p>나만의 시장 이야기를 모아보세요.</p></div></div>
    <div className="profile-tabs" aria-label="프로필 메뉴">
      {['가방', '내 리뷰', '수집 음식'].map((name) => <button key={name} aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</button>)}
    </div>
    <div className="empty-state"><span aria-hidden="true">◇</span>
      <h3>{tab === '가방' ? '장비를 기다리고 있어요' : tab === '내 리뷰' ? '내 리뷰 연결 예정' : '음식 배지 연결 예정'}</h3>
      <p>{tab === '가방' ? '획득·착용 데이터와 캐릭터 에셋이 연결되면 이곳에서 장비를 관리할 수 있어요.' : tab === '내 리뷰' ? '리뷰 담당 화면을 연결할 자리입니다.' : '음식별 구매 기록과 배지를 보여줄 자리입니다.'}</p>
      <small>아직 구현되지 않은 영역이에요.</small>
    </div>
  </>;
}

// B 담당 화면을 연결할 경계. 가게 상세·주문·리뷰·보상 로직을 여기서 대신 구현하지 않는다.
function PendingPanel({ type, shopId }) {
  const shop = mockShops.find((item) => item.id === shopId);
  return <div className="empty-state">
    <span aria-hidden="true">{type === 'shop' ? '▧' : '▤'}</span>
    <h3>{shop ? shop.name : '화면 연결을 준비하고 있어요'}</h3>
    <p>{shop ? `${shop.category} · 개발용 가게 데이터입니다. 선택한 가게에 맞는 상세 화면을 연결할 예정이에요.` : '이 영역에는 팀원이 구현하는 화면이 연결됩니다.'}</p>
    {shop && <p className="status-note">예상 대기시간: 데이터 없음</p>}
    <small>메뉴·구매·리뷰·퀘스트 기능은 아직 동작하지 않아요.</small>
  </div>;
}

export default function Panels() {
  const { panel, closePanel, position, mode, openPanel } = useGame();
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); if (previous?.isConnected && typeof previous.focus === 'function') previous.focus(); };
  }, []);
  useEffect(() => { ref.current.querySelector('button')?.focus(); }, [panel.type]);
  const titles = { profile: '내 프로필', map: '서문시장 지도', shop: '가게 둘러보기', receipts: '내 영수증', quests: '오늘의 퀘스트' };
  return <dialog ref={ref} className="game-panel" aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); closePanel(); }}
    onClick={(event) => { if (event.target === event.currentTarget) {
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closePanel();
    } }}>
    <header className="panel-header"><div><span className="eyebrow">SEOMUN MARKET</span><h2 id={titleId}>{titles[panel.type]}</h2></div>
      <button className="close-button" onClick={closePanel} aria-label="패널 닫기" autoFocus>×</button></header>
    {panel.type === 'profile' ? <ProfilePanel /> : panel.type === 'map' ? <>
      <p className="panel-description">임시 지도 · 가게를 선택해 둘러보세요.</p>
      <div className="overview-map"><MarketScene position={position} showPlayer={mode === 'joystick'} onShopSelect={(id) => openPanel('shop', id)} /></div>
      <p className="status-note">실제 시장의 지리 좌표와 연결되지 않은 개발용 지도입니다.</p>
    </> : <PendingPanel type={panel.type} shopId={panel.shopId} />}
  </dialog>;
}
