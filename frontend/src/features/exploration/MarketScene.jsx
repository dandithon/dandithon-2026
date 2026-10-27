import { useId } from 'react';
import MarketArt, { Character } from './MarketArt.jsx';
import { WORLD, mockShops } from '../../mocks/market.js';

export default function MarketScene({ position, zoom = 1, onShopSelect, showPlayer = true, decorative = false }) {
  const titleId = useId();
  const width = WORLD.width / zoom;
  const height = WORLD.height / zoom;
  const cameraX = Math.max(0, Math.min(position.x - width / 2, WORLD.width - width));
  const cameraY = Math.max(0, Math.min(position.y - height / 2, WORLD.height - height));
  return <svg className="market-scene" viewBox={`${cameraX} ${cameraY} ${width} ${height}`}
    aria-hidden={decorative || undefined} aria-labelledby={decorative ? undefined : titleId}>
    <title id={titleId}>서문시장 임시 탐험 지도{showPlayer ? ', 현재 가상 캐릭터 위치 표시' : ', GPS 위치 미표시'}</title>
    <MarketArt />
    {!decorative && mockShops.map((shop) => <g key={shop.id}>
      {onShopSelect && <g className="shop-hit" role="button" tabIndex="0" aria-label={`${shop.name} 가게 열기`}
        onClick={() => onShopSelect(shop.id)} onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onShopSelect(shop.id); }
        }}>
        <rect x={shop.x} y={shop.y - 6} width={shop.width} height={shop.height + 6} rx="5" fill="transparent" />
        <title>{shop.name}</title>
      </g>}
    </g>)}
    {showPlayer && <g data-testid="player" data-x={position.x.toFixed(2)} data-y={position.y.toFixed(2)}>
      <path d={`M${position.x - 6} ${position.y - 44}h12l-6 8Z`} fill="#ffd56c" stroke="#795533" strokeWidth="1.5" />
      <Character x={position.x} y={position.y} />
    </g>}
  </svg>;
}
