import { useEffect, useState } from 'react';

export default function useLocation(enabled) {
  const [location, setLocation] = useState({ status: 'idle' });
  useEffect(() => {
    if (!enabled) return;
    if (!navigator.geolocation) {
      setLocation({ status: 'error', message: '이 브라우저는 위치 기능을 지원하지 않아요.' });
      return;
    }
    setLocation({ status: 'loading' });
    let active = true;
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (active) setLocation({ status: 'received', accuracy: coords.accuracy });
        // 좌표 보정 기준이 확정되기 전에는 수신한 GPS를 임시 맵 좌표로 변환하지 않는다.
      },
      (error) => {
        if (!active) return;
        const messages = {
          1: '위치 권한이 꺼져 있어요. 브라우저 설정에서 허용하거나 가상 이동을 켜주세요.',
          2: '현재 위치를 찾지 못했어요. 가상 이동으로 탐험할 수 있어요.',
          3: '위치 확인 시간이 초과됐어요. 가상 이동으로 전환한 뒤 다시 시도해주세요.',
        };
        setLocation({ status: 'error', message: messages[error.code] ?? '위치를 확인하지 못했어요.' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
    return () => { active = false; navigator.geolocation.clearWatch(id); };
  }, [enabled]);
  return location;
}
