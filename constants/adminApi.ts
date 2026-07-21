// constants/adminApi.ts
import { BASE_URL } from "@/constants/api";

// 관리자 화면 전용 API — 모든 요청에 관리자 비밀번호를 X-Admin-Password
// 헤더로 함께 보내서 인증합니다 (복잡한 로그인 세션 없이, 사장님 한 분만
// 쓰는 화면이라 단순하게 만들었어요).

export async function adminLogin(password: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return res.ok;
}

export type AdminReservation = {
  id: number;
  roomId: string;
  roomLabel: string;
  type: "DINE_IN" | "TAKEOUT";
  date: string;
  time: string;
  name: string;
  phone: string;
  peopleCount: number;
  message?: string;
  hasPet: boolean;
  wantsTakeout: boolean;
  menus: Record<string, number>;
  takeoutMenus?: Record<string, number>;
  status: "CONFIRMED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PAID";
  paymentMethod?: string;
  paidAmount?: number;
  paidAt?: number;
  createdAt: number;
};

export async function getAdminReservations(
  adminPassword: string,
): Promise<AdminReservation[]> {
  const res = await fetch(`${BASE_URL}/api/admin/reservations`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (res.status === 401) throw new Error("관리자 인증이 만료되었습니다.");
  if (!res.ok) throw new Error("예약 목록을 불러오지 못했습니다.");
  return (await res.json()) as AdminReservation[];
}

export async function cancelReservationAsAdmin(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/reservations/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "예약 취소에 실패했습니다.");
  }
}

export type AdminReview = {
  id: number;
  displayName: string;
  avatarUrl?: string;
  rating: number;
  text: string;
  menuName?: string;
  keywords: string[];
  photos: string[];
  likes: number;
  rewardEligible: boolean;
  ownerReply?: string;
  ownerReplyAt?: number;
  createdAt: string;
};

export async function getAdminReviews(
  adminPassword: string,
): Promise<AdminReview[]> {
  const res = await fetch(`${BASE_URL}/api/admin/reviews`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (res.status === 401) throw new Error("관리자 인증이 만료되었습니다.");
  if (!res.ok) throw new Error("리뷰 목록을 불러오지 못했습니다.");
  return (await res.json()) as AdminReview[];
}

export async function setReviewOwnerReply(
  id: number,
  reply: string,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/reviews/${id}/reply`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify({ reply }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "답변 저장에 실패했습니다.");
  }
}
