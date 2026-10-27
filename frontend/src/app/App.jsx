import { useState } from 'react';
import { GameProvider, useGame } from './GameContext.jsx';
import Panels from './Panels.jsx';
import MarketScene from '../features/exploration/MarketScene.jsx';
import Joystick from '../features/exploration/Joystick.jsx';
import { useMovement } from '../features/exploration/useMovement.js';
import useLocation from '../features/exploration/useLocation.js';
import { START_POSITION } from '../mocks/market.js';

function Welcome({ onStart }) {
  return <main className="welcome">
    <div className="welcome-scene"><MarketScene position={START_POSITION} decorative /></div>
    <div className="welcome-shade" />
    <div className="welcome-heading"><span className="welcome-tag">대구, 서문시장</span><p>골목마다 새로운 이야기</p><h1>시장에<br /><span>가면</span></h1><div className="title-rule">✦</div><p>작은 발걸음으로 시작하는<br />나만의 시장 모험</p></div>
    <div className="welcome-bottom"><button className="start-button" onClick={onStart}>시장 탐험 시작 <span aria-hidden="true">→</span></button><p>개발용 미리보기 · 임시 맵과 캐릭터</p><small>가상 이동부터 시작해요. 실제 방문으로 기록되지 않아요.</small></div>
  </main>;
}

function Exploration() {
  const { user, position, setPosition, mode, setMode, panel, openPanel } = useGame();
  const [zoom, setZoom] = useState(1);
  const input = useMovement(mode === 'joystick' && !panel, setPosition);
  const location = useLocation(mode === 'gps');
  const locationMessage = location.status === 'error' ? location.message : location.status === 'received'
    ? '위치는 수신했지만 맵 좌표 기준이 미확정이라 캐릭터에 반영하지 않아요.'
    : '위치 확인 중이에요. 현재 임시 맵은 실제 GPS와 연결되어 있지 않아요.';
  return <main className="exploration" aria-label="시장 탐험">
    <div className="game-topbar">
      <button className="player-chip" onClick={() => openPanel('profile')}><span className="avatar" aria-hidden="true">☺</span><span>{user.nickname}<small>프로필 보기</small></span></button>
      <div className="coin-chip" aria-label={`시연용 코인 ${user.coins.toLocaleString()}개`}><span aria-hidden="true">●</span>{user.coins.toLocaleString()}<small>시연</small></div>
    </div>
    <div className="scene-container"><MarketScene position={position} zoom={zoom} showPlayer={mode === 'joystick'} onShopSelect={(id) => openPanel('shop', id)} /></div>
    <div className="market-caption"><span className="live-dot" />서문시장 <span>탐험 미리보기</span></div>
    <nav className="quick-menu" aria-label="시장 메뉴">
      {[['map', '⌘', '지도'], ['quests', '☷', '퀘스트'], ['receipts', '▤', '영수증']].map(([type, icon, label]) => <button key={type} onClick={() => openPanel(type)}><span aria-hidden="true">{icon}</span>{label}</button>)}
    </nav>
    <div className="zoom-controls" aria-label="지도 배율">
      <button aria-label="지도 축소" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - .25))}>−</button>
      <output aria-label="현재 지도 배율">{Math.round(zoom * 100)}%</output>
      <button aria-label="지도 확대" disabled={zoom >= 2} onClick={() => setZoom((value) => Math.min(2, value + .25))}>+</button>
    </div>
    {mode === 'gps' && <div className="location-notice" role="status"><strong>GPS 이동 준비 중</strong><p>{locationMessage}</p></div>}
    <div className="game-controls">
      <Joystick key={`${mode}-${Boolean(panel)}`} input={input} disabled={mode !== 'joystick' || Boolean(panel)} />
      <div className="mode-control"><span>{mode === 'joystick' ? '조이스틱 이동' : 'GPS 모드'}</span><button role="switch" aria-label="조이스틱 이동" aria-checked={mode === 'joystick'} onClick={() => setMode(mode === 'joystick' ? 'gps' : 'joystick')}><span className="switch-light" />{mode === 'joystick' ? 'ON' : 'OFF'}</button></div>
    </div>
    <footer className="preview-note">임시 에셋 · 개발용 데이터 <span>방향키 / WASD 이동</span></footer>
    {panel && <Panels />}
  </main>;
}

export default function App() {
  const [started, setStarted] = useState(false);
  return <div className="app-layout"><aside className="desktop-intro"><a className="wordmark" href="./">시장에 가면<span>SEOMUN MARKET ADVENTURE</span></a><div><span className="eyebrow">골목에서 시작되는 모험</span><h2>익숙한 시장,<br />새로운 발견.</h2><p>가게를 만나고, 이야기를 모으고.<br />서문시장의 골목을 천천히 걸어보세요.</p><div className="intro-divider" /><small>모바일 화면에 맞춘 탐험 미리보기</small></div><span className="desktop-footer">대구 서문시장 · 시장에 가면</span></aside>
    <div className="phone-shell"><GameProvider>{started ? <Exploration /> : <Welcome onStart={() => setStarted(true)} />}</GameProvider></div></div>;
}
