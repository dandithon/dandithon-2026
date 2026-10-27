// 개발용 좌표·가게·사용자 데이터. 실제 지리 좌표 및 API 계약이 아니다.
export const WORLD = { width: 400, height: 720 };
export const START_POSITION = { x: 200, y: 446 };
export const mockUser = { id: 'demo-user', nickname: '시장 탐험가', coins: 1000 };
export const mockShops = [
  { id: 'demo-bunsik', name: '서문분식', category: '분식', x: 32, y: 120, width: 118, height: 112, color: '#b84c39', sign: '분식' },
  { id: 'demo-noodles', name: '시장 칼국수', category: '면 요리', x: 250, y: 120, width: 118, height: 112, color: '#467f70', sign: '칼국수' },
  { id: 'demo-hotteok', name: '따끈 호떡', category: '간식', x: 32, y: 330, width: 118, height: 112, color: '#bb863b', sign: '호떡' },
  { id: 'demo-coffee', name: '골목 다방', category: '음료', x: 250, y: 330, width: 118, height: 112, color: '#557c92', sign: '다방' },
];

export const obstacles = mockShops.map(({ x, y, width, height }) => ({ x, y, width, height }));
