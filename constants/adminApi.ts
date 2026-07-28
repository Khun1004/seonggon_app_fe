// constants/adminApi.ts
import { BASE_URL } from "@/constants/api";

// 관리자 화면 전용 API — 모든 요청에 관리자 비밀번호를 X-Admin-Password
// 헤더로 함께 보내서 인증합니다 (복잡한 로그인 세션 없이, 사장님 한 분만
// 쓰는 화면이라 단순하게 만들었어요).

export async function adminLogin(password: string): Promise<boolean> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
  } catch (networkError: any) {
    // fetch 자체가 실패한 경우 (서버에 연결도 못 한 경우) — BASE_URL이나
    // 네트워크 연결 문제일 가능성이 높아서, 원인을 그대로 알려줍니다.
    throw new Error(
      `서버에 연결하지 못했습니다 (${BASE_URL}): ${networkError?.message ?? networkError}`,
    );
  }
  if (res.status === 401) return false;
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "(응답 본문 없음)");
    throw new Error(`로그인 요청 실패 (status ${res.status}) ${bodyText}`);
  }
  return true;
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

export async function generateAiReply(
  id: number,
  adminPassword: string,
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/api/admin/reviews/${id}/generate-reply`,
    {
      method: "POST",
      headers: { "X-Admin-Password": adminPassword },
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "AI 답변 생성에 실패했습니다.");
  return data.reply as string;
}

export type MenuPopularityRow = {
  key: string;
  quantity: number;
};

export async function getMenuPopularity(
  adminPassword: string,
): Promise<MenuPopularityRow[]> {
  const res = await fetch(
    `${BASE_URL}/api/admin/reservations/menu-popularity`,
    {
      headers: { "X-Admin-Password": adminPassword },
    },
  );
  if (!res.ok) throw new Error("인기 메뉴 순위를 불러오지 못했습니다.");
  return (await res.json()) as MenuPopularityRow[];
}

// ── 가게 정보 (관리자) ──────────────────────────────────────
export type AdminStoreProfile = {
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  lastOrderTime: string;
  naverRating?: number;
  naverReviewCount?: number;
  blogReviewCount?: number;
};

export type UpsertStoreProfilePayload = {
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  lastOrderTime: string;
  naverRating?: number;
  naverReviewCount?: number;
  blogReviewCount?: number;
};

export type AdminClosedDate = {
  id: number;
  date: string;
  reason?: string;
};

export async function getAdminStoreProfile(
  adminPassword: string,
): Promise<AdminStoreProfile> {
  const res = await fetch(`${BASE_URL}/api/admin/store-profile`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "(응답 본문 없음)");
    throw new Error(
      `가게 정보 불러오기 실패 (status ${res.status}): ${bodyText}`,
    );
  }
  return (await res.json()) as AdminStoreProfile;
}

export async function updateAdminStoreProfile(
  payload: UpsertStoreProfilePayload,
  adminPassword: string,
): Promise<AdminStoreProfile> {
  const res = await fetch(`${BASE_URL}/api/admin/store-profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "(응답 본문 없음)");
    let message = bodyText;
    try {
      message = JSON.parse(bodyText).message || bodyText;
    } catch {}
    throw new Error(`저장 실패 (status ${res.status}): ${message}`);
  }
  return (await res.json()) as AdminStoreProfile;
}

export async function getAdminClosedDates(
  adminPassword: string,
): Promise<AdminClosedDate[]> {
  const res = await fetch(`${BASE_URL}/api/admin/store-profile/closed-dates`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "(응답 본문 없음)");
    throw new Error(
      `휴무일 목록 불러오기 실패 (status ${res.status}): ${bodyText}`,
    );
  }
  return (await res.json()) as AdminClosedDate[];
}

export async function addAdminClosedDate(
  date: string,
  reason: string | undefined,
  adminPassword: string,
): Promise<AdminClosedDate> {
  const res = await fetch(`${BASE_URL}/api/admin/store-profile/closed-dates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify({ date, reason }),
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "(응답 본문 없음)");
    let message = bodyText;
    try {
      message = JSON.parse(bodyText).message || bodyText;
    } catch {
      // JSON이 아니면 원본 텍스트 그대로 사용
    }
    throw new Error(`휴무일 등록 실패 (status ${res.status}): ${message}`);
  }
  return (await res.json()) as AdminClosedDate;
}

export async function deleteAdminClosedDate(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/admin/store-profile/closed-dates/${id}`,
    {
      method: "DELETE",
      headers: { "X-Admin-Password": adminPassword },
    },
  );
  if (!res.ok) throw new Error("휴무일 삭제에 실패했습니다.");
}

// ── 예약 가능 시간 (매장 식사 / 포장 따로 관리) ────────────
export type ReservationTimeConfig = {
  type: string; // "DINE_IN" | "TAKEOUT"
  startTime: string; // "11:00"
  endTime: string; // "20:00"
  intervalMinutes: number;
  slots: string[]; // 계산된 시간 목록 (읽기 전용, 미리보기용)
};

export type UpsertReservationTimeConfigPayload = {
  startTime: string;
  endTime: string;
  intervalMinutes: number;
};

export async function getAdminReservationTimeConfig(
  type: "dine-in" | "takeout",
  adminPassword: string,
): Promise<ReservationTimeConfig> {
  const res = await fetch(`${BASE_URL}/api/admin/reservation-times/${type}`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("예약 시간 설정을 불러오지 못했습니다.");
  return (await res.json()) as ReservationTimeConfig;
}

export async function updateAdminReservationTimeConfig(
  type: "dine-in" | "takeout",
  payload: UpsertReservationTimeConfigPayload,
  adminPassword: string,
): Promise<ReservationTimeConfig> {
  const res = await fetch(`${BASE_URL}/api/admin/reservation-times/${type}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("예약 시간 설정 저장에 실패했습니다.");
  return (await res.json()) as ReservationTimeConfig;
}
