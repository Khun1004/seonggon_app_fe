// components/contexts/VisitContext.tsx
import React, { createContext, ReactNode, useState } from "react";

import {
  claimVisitStampReward,
  getMyReservations,
  getMyReviews,
  getVisitStampStatus,
} from "@/constants/api";

export type VisitRecord = {
  id: string;
  date: string; // "2026-06-15"
  roomLabel: string;
  hasReview: boolean;
};

export const TOTAL_STAMPS = 5;

type VisitContextType = {
  visitCount: number; // 0~5, 서버에서 계산해서 내려줍니다
  visitRecords: VisitRecord[];
  canClaim: boolean; // 서버 기준 — 지금 5개를 다 채워서 받을 수 있는 상태인지
  loading: boolean;
  // 저장된 전화번호로 예약 내역을, loginId로 내 리뷰 목록과 도장 현황을
  // 불러와서 도장 개수와 "이 방문에 리뷰를 썼는지"를 계산합니다.
  refreshVisits: (phone: string, loginId?: string) => Promise<void>;
  claimReward: (phone: string, loginId: string) => Promise<void>;
  // 로그아웃 시 화면에 다른 사람의(또는 이전 계정의) 방문 도장이 계속 남아
  // 보이지 않도록, 메모리에 들고 있는 값을 초기 상태로 비워줍니다.
  clearVisits: () => void;
};

export const VisitContext = createContext<VisitContextType>({
  visitCount: 0,
  visitRecords: [],
  canClaim: false,
  loading: false,
  refreshVisits: async () => {},
  claimReward: async () => {},
  clearVisits: () => {},
});

export const VisitProvider = ({ children }: { children: ReactNode }) => {
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [visitCount, setVisitCount] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [loading, setLoading] = useState(false);

  // 방문 도장은 별도 테이블 없이, "확정된(CONFIRMED) '방문' 예약 1건 = 도장 1개"로 계산해요.
  // 포장(TAKEOUT) 주문은 매장에 오시는 게 아니라서 도장 대상에서 제외합니다.
  // 예약을 취소하면 서버에서 상태가 CANCELLED로 바뀌기 때문에, 여기서도 자동으로 도장이 빠집니다.
  // 실제 도장 개수(몇 번째 회차인지 포함)는 서버(getVisitStampStatus)가 계산해서 내려줘요.
  const refreshVisits = async (phone: string, loginId?: string) => {
    if (!phone) return;
    setLoading(true);
    try {
      const [reservationData, reviewData, stampStatus] = await Promise.all([
        getMyReservations(phone),
        loginId ? getMyReviews(loginId).catch(() => []) : Promise.resolve([]),
        getVisitStampStatus(phone, loginId).catch(() => null),
      ]);

      // 방문(예약)들을 날짜 오래된 순으로 정렬해둡니다 — 리뷰를 "그 리뷰보다
      // 먼저 있었던 방문 중 가장 최근 방문"에 매칭시키기 위해서예요.
      const visitsOldestFirst = reservationData
        .filter((r) => r.status === "CONFIRMED" && r.type !== "TAKEOUT")
        .sort((a, b) => a.date.localeCompare(b.date));

      const reviewDates = reviewData
        .map((r) => (r.createdAt ? r.createdAt.slice(0, 10) : null))
        .filter((d): d is string => !!d)
        .sort();

      const hasReviewByVisitId: Record<string, boolean> = {};
      for (const reviewDate of reviewDates) {
        for (let i = visitsOldestFirst.length - 1; i >= 0; i--) {
          const visit = visitsOldestFirst[i];
          if (visit.date <= reviewDate && !hasReviewByVisitId[visit.id]) {
            hasReviewByVisitId[visit.id] = true;
            break;
          }
        }
      }

      const confirmed = reservationData
        .filter((r) => r.status === "CONFIRMED" && r.type !== "TAKEOUT")
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((r) => ({
          id: String(r.id),
          date: r.date,
          roomLabel: r.roomLabel,
          hasReview: !!hasReviewByVisitId[String(r.id)],
        }));
      setVisitRecords(confirmed);

      if (stampStatus) {
        setVisitCount(stampStatus.visitCount);
        setCanClaim(stampStatus.canClaim);
      } else {
        setVisitCount(Math.min(confirmed.length, TOTAL_STAMPS));
      }
    } catch {
      // 조용히 무시 — 화면이 죽지 않도록
    } finally {
      setLoading(false);
    }
  };

  // 서버에 실제로 "이번 회차를 받았다"고 기록합니다. 성공하면 도장판이
  // 서버 기준으로 다시 계산돼서(보통 0으로) 화면에 반영돼요.
  const claimReward = async (phone: string, loginId: string) => {
    const updated = await claimVisitStampReward(phone, loginId);
    setVisitCount(updated.visitCount);
    setCanClaim(updated.canClaim);
  };

  const clearVisits = () => {
    setVisitRecords([]);
    setVisitCount(0);
    setCanClaim(false);
  };

  return (
    <VisitContext.Provider
      value={{
        visitCount,
        visitRecords,
        canClaim,
        loading,
        refreshVisits,
        claimReward,
        clearVisits,
      }}
    >
      {children}
    </VisitContext.Provider>
  );
};
