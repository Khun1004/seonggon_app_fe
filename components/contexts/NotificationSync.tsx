// components/contexts/NotificationSync.tsx
import { useContext, useEffect } from "react";

import { useAuth } from "@/components/contexts/AuthContext";
import { NotificationContext } from "@/components/contexts/NotificationContext";

// 로그인 상태가 바뀔 때마다(로그인/앱 재시작 등) 알림 목록을 새로 불러오고,
// 로그인되어 있는 동안은 20초마다 한 번씩 새 알림이 있는지 확인합니다.
// (예약/취소/결제처럼 다른 화면에서 벌어진 일도 잠깐 뒤에 토스트로 뜨게 하려고요.)
// 화면 어딘가에 하나만 렌더링해두면 되는 "보이지 않는" 동기화 컴포넌트예요.
export default function NotificationSync() {
  const { user } = useAuth();
  const { refreshNotifications } = useContext(NotificationContext);

  useEffect(() => {
    if (!user?.loginId) return;

    refreshNotifications(user.loginId);
    const timer = setInterval(() => {
      refreshNotifications(user.loginId);
    }, 20000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.loginId]);

  return null;
}
