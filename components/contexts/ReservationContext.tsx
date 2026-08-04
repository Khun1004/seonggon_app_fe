// components/contexts/ReservationContext.tsx
import React, { createContext, ReactNode, useState } from "react";

import {
  createReservation as apiCreateReservation,
  getMyReservations as apiGetMyReservations,
  payReservation as apiPayReservation,
  cancelReservationApi,
  CreateReservationPayload,
  ServerReservation,
  updateReservationApi,
} from "@/constants/api";
import {
  cancelReservationEndWarning,
  syncReservationEndWarnings,
} from "@/utils/reservationTimerNotifications";

export type Reservation = {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  peopleCount: number;
  roomId: string;
  roomLabel: string;
  type: "dine_in" | "takeout";
  message?: string;
  hasPet: boolean;
  wantsTakeout: boolean;
  menus: Record<string, number>;
  takeoutMenus: Record<string, number>;
  createdAt: number;
  status: "confirmed" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentMethod?: string;
  paidAmount: number;
  paidAt?: number;
};

export type ReservationInput = {
  name: string;
  loginId?: string;
  phone: string;
  date: string;
  time: string;
  peopleCount: number;
  roomId: string;
  roomLabel: string;
  type?: "dine_in" | "takeout";
  message?: string;
  hasPet?: boolean;
  wantsTakeout?: boolean;
  menus?: Record<string, number>;
  takeoutMenus?: Record<string, number>;
};

function serverToLocal(r: ServerReservation): Reservation {
  return {
    id: String(r.id),
    name: r.name,
    phone: r.phone,
    date: r.date,
    time: r.time,
    peopleCount: r.peopleCount,
    roomId: r.roomId,
    roomLabel: r.roomLabel,
    type: r.type === "TAKEOUT" ? "takeout" : "dine_in",
    message: r.message,
    hasPet: r.hasPet,
    wantsTakeout: r.wantsTakeout,
    menus: r.menus ?? {},
    takeoutMenus: r.takeoutMenus ?? {},
    createdAt: r.createdAt,
    status: r.status === "CANCELLED" ? "cancelled" : "confirmed",
    paymentStatus:
      r.paymentStatus === "PAID"
        ? "paid"
        : r.paymentStatus === "REFUNDED"
          ? "refunded"
          : "unpaid",
    paymentMethod: r.paymentMethod,
    paidAmount: r.paidAmount,
    paidAt: r.paidAt,
  };
}

function toPayload(input: ReservationInput): CreateReservationPayload {
  return {
    roomId: input.roomId,
    roomLabel: input.roomLabel,
    type: input.type === "takeout" ? "TAKEOUT" : "DINE_IN",
    date: input.date,
    time: input.time,
    name: input.name,
    loginId: input.loginId,
    phone: input.phone,
    peopleCount: input.peopleCount,
    message: input.message,
    hasPet: input.hasPet,
    wantsTakeout: input.wantsTakeout,
    menus: input.menus,
    takeoutMenus: input.takeoutMenus,
  };
}

type ReservationContextType = {
  reservations: Reservation[];
  loading: boolean;
  // 예약은 로그인 없이 전화번호로 관리돼요. 마이페이지/예약 확인 화면에서
  // 저장된 전화번호로 이 함수를 호출해 내 예약 목록을 서버에서 불러옵니다.
  refreshReservations: (phone: string) => Promise<void>;
  addReservation: (input: ReservationInput) => Promise<Reservation>;
  updateReservation: (
    id: string,
    input: ReservationInput,
  ) => Promise<Reservation>;
  cancelReservation: (id: string) => Promise<void>;
  payReservation: (
    id: string,
    paymentMethod: string,
    amount: number,
  ) => Promise<Reservation>;
  findReservationById: (id: string) => Reservation | undefined;
  // 로그아웃 시 화면에 다른 사람의(또는 이전 계정의) 예약/결제내역이 계속
  // 남아 보이지 않도록, 메모리에 들고 있는 목록을 비워줍니다.
  clearReservations: () => void;
};

export const ReservationContext = createContext<ReservationContextType>({
  reservations: [],
  loading: false,
  refreshReservations: async () => {},
  addReservation: async () => {
    throw new Error("ReservationProvider가 필요합니다.");
  },
  updateReservation: async () => {
    throw new Error("ReservationProvider가 필요합니다.");
  },
  cancelReservation: async () => {},
  payReservation: async () => {
    throw new Error("ReservationProvider가 필요합니다.");
  },
  findReservationById: () => undefined,
  clearReservations: () => {},
});

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshReservations = async (phone: string) => {
    if (!phone) return;
    setLoading(true);
    try {
      const data = await apiGetMyReservations(phone);
      const local = data.map(serverToLocal);
      setReservations(local);
      // 목록을 새로 받아올 때마다 "종료 5분 전" 알림을 최신 시간 기준으로
      // 다시 맞춰줍니다 (취소/시간 변경도 여기서 함께 반영돼요).
      syncReservationEndWarnings(local).catch(() => {});
    } catch {
      // 목록을 못 불러와도 화면이 죽지 않도록 조용히 무시 — 필요하면 각 화면에서 별도 안내
    } finally {
      setLoading(false);
    }
  };

  const addReservation = async (input: ReservationInput) => {
    const created = await apiCreateReservation(toPayload(input));
    const local = serverToLocal(created);
    setReservations((prev) => [local, ...prev]);
    syncReservationEndWarnings([local]).catch(() => {});
    return local;
  };

  const updateReservation = async (id: string, input: ReservationInput) => {
    const updated = await updateReservationApi(Number(id), toPayload(input));
    const local = serverToLocal(updated);
    setReservations((prev) => prev.map((r) => (r.id === id ? local : r)));
    // 시간이 바뀌었을 수 있으니 알림도 새 시간 기준으로 다시 맞춰요.
    syncReservationEndWarnings([local]).catch(() => {});
    return local;
  };

  const cancelReservation = async (id: string) => {
    await cancelReservationApi(Number(id));
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)),
    );
    cancelReservationEndWarning(id).catch(() => {});
  };

  const payReservation = async (
    id: string,
    paymentMethod: string,
    amount: number,
  ) => {
    const updated = await apiPayReservation(Number(id), paymentMethod, amount);
    const local = serverToLocal(updated);
    setReservations((prev) => prev.map((r) => (r.id === id ? local : r)));
    return local;
  };

  const findReservationById = (id: string) =>
    reservations.find((r) => r.id === id);

  const clearReservations = () => {
    setReservations([]);
  };

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        loading,
        refreshReservations,
        addReservation,
        updateReservation,
        cancelReservation,
        payReservation,
        findReservationById,
        clearReservations,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};
