import { mockShops } from '../../mocks/market.js';

export function Character({ x = 0, y = 0 }) {
  return <g transform={`translate(${x - 12} ${y - 30})`} shapeRendering="crispEdges">
    <ellipse cx="12" cy="32" rx="15" ry="5" fill="#3b413b" opacity=".22" />
    <path d="M4 5h4V1h12v4h4v15H2V9h2Z" fill="#55392d" />
    <path d="M5 10h16v11H5Z" fill="#edb780" />
    <path d="M7 13h3v3H7m8-3h3v3h-3" fill="#302e29" />
    <path d="M6 21h14v9H6" fill="#bb6045" />
    <path d="M10 21h6v8h-6" fill="#ffe5b3" />
    <path d="M6 30h6v5H4v-3h2m8-2h6v2h2v3h-8" fill="#324f60" />
    <path d="M2 22h4v7H2m18-7h4v7h-4" fill="#edb780" />
  </g>;
}

function Tree({ x, y }) {
  return <g transform={`translate(${x} ${y})`}>
    <rect x="-4" y="7" width="8" height="22" fill="#806148" />
    <path d="M-17 7v-15h8v-10H8v7h12V8h-7v9h-25V7Z" fill="#345f45" />
    <path d="M-13-5h7v-9H7v8h8V6H1v5h-14Z" fill="#5b8550" />
    <rect x="-6" y="-8" width="7" height="6" fill="#8fa45b" />
  </g>;
}

// 임시 에셋: Figma의 원본 이미지 수령 후 이 렌더러를 교체한다.
export default function MarketArt() {
  return <g>
    <defs>
      <pattern id="paving" width="32" height="24" patternUnits="userSpaceOnUse">
        <rect width="32" height="24" fill="#c6b58b" />
        <path d="M0 0h32M0 12h32M16 0v12M0 12v12M32 12v12" stroke="#ac9974" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="400" height="720" fill="#507057" />
    <rect x="21" y="80" width="358" height="584" rx="40" fill="url(#paving)" />
    <path d="M177 86h46v567h-46" fill="#ddcca2" opacity=".45" />
    <rect x="61" y="49" width="278" height="16" fill="#674c36" />
    <path d="M44 49 62 33h276l18 16Z" fill="#345b56" />
    <rect x="72" y="61" width="12" height="45" fill="#70523a" />
    <rect x="316" y="61" width="12" height="45" fill="#70523a" />
    <rect x="130" y="45" width="140" height="29" rx="3" fill="#f7e5b6" stroke="#674c36" strokeWidth="3" />
    <text x="200" y="65" textAnchor="middle" fontSize="16" fontWeight="800" fill="#594630">서 문 시 장</text>
    {mockShops.map((shop) => <g key={shop.id} transform={`translate(${shop.x} ${shop.y})`}>
      <rect x="4" y="12" width="118" height="108" rx="3" fill="#66583f" opacity=".3" />
      <rect y="12" width="118" height="100" fill="#866044" stroke="#554330" strokeWidth="3" />
      <rect x="12" y="40" width="94" height="56" fill="#483d31" />
      <rect x="57" y="40" width="4" height="56" fill="#c49962" />
      <path d="M-5 36 5 8h108l10 28Z" fill={shop.color} stroke="#554330" strokeWidth="2" />
      {[14, 46, 78].map((x) => <path key={x} d={`M${x} 8h15l5 28h-20Z`} fill="#f1deb0" />)}
      <rect x="20" y="-5" width="78" height="24" rx="3" fill="#f6e3b4" stroke="#6b5035" strokeWidth="2" />
      <text x="59" y="12" textAnchor="middle" fontSize="12" fontWeight="800" fill="#574630">{shop.sign}</text>
      <rect x="4" y="89" width="110" height="17" fill="#a2794b" stroke="#5a4834" strokeWidth="2" />
      {[22, 49, 79].map((x) => <g key={x}><ellipse cx={x} cy="83" rx="10" ry="5" fill="#dfbd79" /><circle cx={x} cy="78" r="6" fill={shop.color} /></g>)}
    </g>)}
    {[285, 496, 588].flatMap((y) => [48, 352].map((x) => <Tree key={`${x}-${y}`} x={x} y={y} />))}
    {[270, 488].flatMap((y) => [158, 242].map((x) => <g key={`${x}-${y}`}>
      <rect x={x - 2} y={y - 15} width="4" height="30" fill="#65513d" />
      <rect x={x - 7} y={y - 22} width="14" height="16" rx="3" fill="#e7af5d" stroke="#78603e" strokeWidth="2" />
      <rect x={x - 3} y={y - 19} width="6" height="10" fill="#ffe6a0" />
    </g>))}
    <path d="M167 613h66v12h-66m-8 8h82v12h-82" fill="#aa9872" />
    <text x="200" y="685" textAnchor="middle" fill="#e8e0c4" fontSize="11" letterSpacing="4">SEOMUN MARKET</text>
  </g>;
}
