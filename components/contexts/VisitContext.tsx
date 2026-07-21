// components/contexts/VisitContext.tsx
import React, { createContext, ReactNode, useState } from "react";

import { getMyReservations } from "@/constants/api";

export type VisitRecord = {
  id: string;
  date: string; // "2026-06-15"
  roomLabel: string;
  hasReview: boolean;
};

export const TOTAL_STAMPS = 5;

type VisitContextType = {
  visitCount: number; // 0~5, 5에 도달하면 보상 가능
  visitRecords: VisitRecord[];
  rewardClaimed: boolean;
  loading: boolean;
  // 저장된 전화번호로 예약 내역을 불러와 도장 개수를 계산합니다.
  refreshVisits: (phone: string) => Promise<void>;
};

export const VisitContext = createContext<VisitContextType>({
  visitCount: 0,
  visitRecords: [],
  rewardClaimed: false,
  loading: false,
  refreshVisits: async () => {},
});

export const VisitProvider = ({ children }: { children: ReactNode }) => {
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // 방문 도장은 별도 테이블 없이, "확정된(CONFIRMED) '방문' 예약 1건 = 도장 1개"로 계산해요.
  // 포장(TAKEOUT) 주문은 매장에 오시는 게 아니라서 도장 대상에서 제외합니다.
  // 예약을 취소하면 서버에서 상태가 CANCELLED로 바뀌기 때문에, 여기서도 자동으로 도장이 빠집니다.
  const refreshVisits = async (phone: string) => {
    if (!phone) return;
    setLoading(true);
    try {
      const data = await getMyReservations(phone);
      const confirmed = data
        .filter((r) => r.status === "CONFIRMED" && r.type !== "TAKEOUT")
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((r) => ({
          id: String(r.id),
          date: r.date,
          roomLabel: r.roomLabel,
          hasReview: false,
        }));
      setVisitRecords(confirmed);
    } catch {
      // 조용히 무시 — 화면이 죽지 않도록
    } finally {
      setLoading(false);
    }
  };

  const visitCount = Math.min(visitRecords.length, TOTAL_STAMPS);
  // 보상(5회 달성) 소진 처리는 아직 없어서, 5회를 넘긴 이후에도 계속 "달성" 상태로 보여요.
  // 나중에 사장님이 보상을 지급하면 초기화하는 기능은 관리자 화면이 생기면 추가할 수 있어요.
  const rewardClaimed = false;

  return (
    <VisitContext.Provider
      value={{
        visitCount,
        visitRecords,
        rewardClaimed,
        loading,
        refreshVisits,
      }}
    >
      {children}
    </VisitContext.Provider>
  );
};
