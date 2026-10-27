import { createContext, useContext, useState } from 'react';
import { mockUser, START_POSITION } from '../mocks/market.js';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [user, setUser] = useState(mockUser);
  const [position, setPosition] = useState(START_POSITION);
  const [mode, setMode] = useState('joystick');
  const [panel, setPanel] = useState(null);
  // 임시 로컬 상태 계약. 실제 서버 응답 적용은 API 계약 확정 후 연결한다.
  const value = { user, setUser, position, setPosition, mode, setMode, panel,
    openPanel: (type, shopId = null) => setPanel({ type, shopId }),
    closePanel: () => setPanel(null) };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame must be used inside GameProvider');
  return value;
}
