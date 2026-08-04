// components/contexts/NotificationContext.tsx
import React, { createContext, ReactNode, useState } from "react";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  ServerNotification,
} from "@/constants/api";

export type AppNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  route?: string;
  isRead: boolean;
  createdAt: number;
};

function toLocal(n: ServerNotification): AppNotification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    route: n.route,
    isRead: n.isRead,
    createdAt: n.createdAt,
  };
}

type NotificationContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  // 알림은 로그인 회원 전용이라(로그인 아이디 기준으로 만들어져요), 로그인
  // 아이디로 이 함수를 호출해서 내 알림 목록을 서버에서 불러옵니다.
  refreshNotifications: (loginId: string) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: (loginId: string) => Promise<void>;
  // 로그아웃 시 이전 계정의 알림이 화면에 남아있지 않도록 비워줍니다.
  clearNotifications: () => void;
};

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  refreshNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  clearNotifications: () => {},
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshNotifications = async (loginId: string) => {
    if (!loginId) return;
    setLoading(true);
    try {
      const [list, count] = await Promise.all([
        getNotifications(loginId),
        getUnreadNotificationCount(loginId),
      ]);
      setNotifications(list.map(toLocal));
      setUnreadCount(count);
    } catch {
      // 조용히 무시 — 알림 로딩 실패로 화면이 죽지 않도록
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // 무시
    }
  };

  const markAllAsRead = async (loginId: string) => {
    if (!loginId) return;
    try {
      await markAllNotificationsRead(loginId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // 무시
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
