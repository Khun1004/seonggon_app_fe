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
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
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
  allowWeekendReservations?: boolean;
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
  allowWeekendReservations?: boolean;
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

export async function markReservationPaidAsAdmin(
  id: number,
  paymentMethod: string,
  amount: number,
  adminPassword: string,
): Promise<AdminReservation> {
  const res = await fetch(
    `${BASE_URL}/api/admin/reservations/${id}/mark-paid`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": adminPassword,
      },
      body: JSON.stringify({ paymentMethod, amount }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "결제 처리에 실패했습니다.");
  return data as AdminReservation;
}

export type CreateReservationAsAdminPayload = {
  roomId: string;
  roomLabel: string;
  type: "DINE_IN" | "TAKEOUT";
  date: string;
  time: string;
  name: string;
  phone: string;
  peopleCount: number;
  message?: string;
  menus?: Record<string, number>;
};

export async function createReservationAsAdmin(
  payload: CreateReservationAsAdminPayload,
  adminPassword: string,
): Promise<AdminReservation> {
  const res = await fetch(`${BASE_URL}/api/admin/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "예약 등록에 실패했습니다.");
  return data as AdminReservation;
}

export async function updateReservationAsAdmin(
  id: number,
  payload: CreateReservationAsAdminPayload,
  adminPassword: string,
): Promise<AdminReservation> {
  const res = await fetch(`${BASE_URL}/api/admin/reservations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "예약 수정에 실패했습니다.");
  return data as AdminReservation;
}

// ── 쿠폰 관리 ────────────────
export type AdminCoupon = {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  count?: string;
  displayOrder: number;
  active: boolean;
};

export type UpsertCouponPayload = {
  title: string;
  subtitle: string;
  icon: string;
  count?: string;
  displayOrder: number;
  active: boolean;
};

export async function getAdminCoupons(
  adminPassword: string,
): Promise<AdminCoupon[]> {
  const res = await fetch(`${BASE_URL}/api/admin/coupons`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("쿠폰 목록을 불러오지 못했습니다.");
  return (await res.json()) as AdminCoupon[];
}

export async function createAdminCoupon(
  payload: UpsertCouponPayload,
  adminPassword: string,
): Promise<AdminCoupon> {
  const res = await fetch(`${BASE_URL}/api/admin/coupons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("쿠폰 등록에 실패했습니다.");
  return (await res.json()) as AdminCoupon;
}

export async function updateAdminCoupon(
  id: number,
  payload: UpsertCouponPayload,
  adminPassword: string,
): Promise<AdminCoupon> {
  const res = await fetch(`${BASE_URL}/api/admin/coupons/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("쿠폰 수정에 실패했습니다.");
  return (await res.json()) as AdminCoupon;
}

export async function deleteAdminCoupon(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/coupons/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("쿠폰 삭제에 실패했습니다.");
}

// ── 리뷰 작성법 관리 ────────────────
export type AdminReviewGuideStep = {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
};

export type UpsertReviewGuideStepPayload = {
  title: string;
  description: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
};

export async function getAdminReviewGuideSteps(
  adminPassword: string,
): Promise<AdminReviewGuideStep[]> {
  const res = await fetch(`${BASE_URL}/api/admin/review-guide`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("리뷰 작성법을 불러오지 못했습니다.");
  return (await res.json()) as AdminReviewGuideStep[];
}

export async function createAdminReviewGuideStep(
  payload: UpsertReviewGuideStepPayload,
  adminPassword: string,
): Promise<AdminReviewGuideStep> {
  const res = await fetch(`${BASE_URL}/api/admin/review-guide`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("등록에 실패했습니다.");
  return (await res.json()) as AdminReviewGuideStep;
}

export async function updateAdminReviewGuideStep(
  id: number,
  payload: UpsertReviewGuideStepPayload,
  adminPassword: string,
): Promise<AdminReviewGuideStep> {
  const res = await fetch(`${BASE_URL}/api/admin/review-guide/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("수정에 실패했습니다.");
  return (await res.json()) as AdminReviewGuideStep;
}

export async function deleteAdminReviewGuideStep(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/review-guide/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("삭제에 실패했습니다.");
}

// ── 리뷰 "이런 점이 좋았어요" 선택지 관리 ────────────────
export type AdminReviewGoodPointOption = {
  id: number;
  emoji: string;
  label: string;
  displayOrder: number;
  active: boolean;
};

export type UpsertReviewGoodPointOptionPayload = {
  emoji: string;
  label: string;
  displayOrder: number;
  active: boolean;
};

export async function getAdminReviewGoodPointOptions(
  adminPassword: string,
): Promise<AdminReviewGoodPointOption[]> {
  const res = await fetch(`${BASE_URL}/api/admin/review-good-points`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("선택지를 불러오지 못했습니다.");
  return (await res.json()) as AdminReviewGoodPointOption[];
}

export async function createAdminReviewGoodPointOption(
  payload: UpsertReviewGoodPointOptionPayload,
  adminPassword: string,
): Promise<AdminReviewGoodPointOption> {
  const res = await fetch(`${BASE_URL}/api/admin/review-good-points`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("등록에 실패했습니다.");
  return (await res.json()) as AdminReviewGoodPointOption;
}

export async function updateAdminReviewGoodPointOption(
  id: number,
  payload: UpsertReviewGoodPointOptionPayload,
  adminPassword: string,
): Promise<AdminReviewGoodPointOption> {
  const res = await fetch(`${BASE_URL}/api/admin/review-good-points/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("수정에 실패했습니다.");
  return (await res.json()) as AdminReviewGoodPointOption;
}

export async function deleteAdminReviewGoodPointOption(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/review-good-points/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("삭제에 실패했습니다.");
}

export type AdminCouponNotice = {
  content: string;
};

export async function getAdminCouponNotice(
  adminPassword: string,
): Promise<AdminCouponNotice> {
  const res = await fetch(`${BASE_URL}/api/admin/coupon-notice`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("안내 문구를 불러오지 못했습니다.");
  return (await res.json()) as AdminCouponNotice;
}

export async function updateAdminCouponNotice(
  content: string,
  adminPassword: string,
): Promise<AdminCouponNotice> {
  const res = await fetch(`${BASE_URL}/api/admin/coupon-notice`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("안내 문구 저장에 실패했습니다.");
  return (await res.json()) as AdminCouponNotice;
}

// ── 리뷰 메뉴 목록 관리 ────────────
export type AdminReviewMenuOption = {
  id: number;
  name: string;
  displayOrder: number;
  active: boolean;
};

export type UpsertReviewMenuOptionPayload = {
  name: string;
  displayOrder: number;
  active: boolean;
};

export async function getAdminReviewMenuOptions(
  adminPassword: string,
): Promise<AdminReviewMenuOption[]> {
  const res = await fetch(`${BASE_URL}/api/admin/review-menu-options`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("메뉴 목록을 불러오지 못했습니다.");
  return (await res.json()) as AdminReviewMenuOption[];
}

export async function createAdminReviewMenuOption(
  payload: UpsertReviewMenuOptionPayload,
  adminPassword: string,
): Promise<AdminReviewMenuOption> {
  const res = await fetch(`${BASE_URL}/api/admin/review-menu-options`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("등록에 실패했습니다.");
  return (await res.json()) as AdminReviewMenuOption;
}

export async function updateAdminReviewMenuOption(
  id: number,
  payload: UpsertReviewMenuOptionPayload,
  adminPassword: string,
): Promise<AdminReviewMenuOption> {
  const res = await fetch(`${BASE_URL}/api/admin/review-menu-options/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("수정에 실패했습니다.");
  return (await res.json()) as AdminReviewMenuOption;
}

export async function deleteAdminReviewMenuOption(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/review-menu-options/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("삭제에 실패했습니다.");
}

// ── 방문 도장 설정 관리 ────────────
export type AdminVisitStampSettings = {
  requiredVisits: number;
  rewardName: string;
};

export type UpsertVisitStampSettingsPayload = {
  requiredVisits: number;
  rewardName: string;
};

export async function getAdminVisitStampSettings(
  adminPassword: string,
): Promise<AdminVisitStampSettings> {
  const res = await fetch(`${BASE_URL}/api/admin/visit-stamp-settings`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("설정을 불러오지 못했습니다.");
  return (await res.json()) as AdminVisitStampSettings;
}

export async function updateAdminVisitStampSettings(
  payload: UpsertVisitStampSettingsPayload,
  adminPassword: string,
): Promise<AdminVisitStampSettings> {
  const res = await fetch(`${BASE_URL}/api/admin/visit-stamp-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("저장에 실패했습니다.");
  return (await res.json()) as AdminVisitStampSettings;
}

// ── 리뷰 적립금 교환 메뉴 관리 ────────────
export type AdminRewardRedeemableItem = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
};

export type UpsertRewardRedeemableItemPayload = {
  name: string;
  price: number;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
};

export async function getAdminRewardRedeemableItems(
  adminPassword: string,
): Promise<AdminRewardRedeemableItem[]> {
  const res = await fetch(`${BASE_URL}/api/admin/reward-redeemable-items`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("메뉴 목록을 불러오지 못했습니다.");
  return (await res.json()) as AdminRewardRedeemableItem[];
}

export async function createAdminRewardRedeemableItem(
  payload: UpsertRewardRedeemableItemPayload,
  adminPassword: string,
): Promise<AdminRewardRedeemableItem> {
  const res = await fetch(`${BASE_URL}/api/admin/reward-redeemable-items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("등록에 실패했습니다.");
  return (await res.json()) as AdminRewardRedeemableItem;
}

export async function updateAdminRewardRedeemableItem(
  id: number,
  payload: UpsertRewardRedeemableItemPayload,
  adminPassword: string,
): Promise<AdminRewardRedeemableItem> {
  const res = await fetch(
    `${BASE_URL}/api/admin/reward-redeemable-items/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": adminPassword,
      },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) throw new Error("수정에 실패했습니다.");
  return (await res.json()) as AdminRewardRedeemableItem;
}

export async function deleteAdminRewardRedeemableItem(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/admin/reward-redeemable-items/${id}`,
    {
      method: "DELETE",
      headers: { "X-Admin-Password": adminPassword },
    },
  );
  if (!res.ok) throw new Error("삭제에 실패했습니다.");
}

export async function uploadRewardItemPhoto(
  imageBase64: string,
  adminPassword: string,
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/api/admin/reward-redeemable-items/upload-photo`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": adminPassword,
      },
      body: JSON.stringify({ imageBase64 }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "사진 업로드에 실패했습니다.");
  return data.url as string;
}
