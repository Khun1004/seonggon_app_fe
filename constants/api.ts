// constants/api.ts

// [개발 중] 로컬 테스트할 때는 사장님 컴퓨터의 실제 IP를 쓰세요.
// [배포용 APK] 앱을 빌드해서 다른 사람에게 나눠줄 때는, 반드시 인터넷 어디서나
// 접속되는 실제 서버 주소(예: "https://seonggong-api.up.railway.app")로 바꿔야 해요.
// 로컬 IP(192.168.x.x)는 같은 와이파이에 있는 사람에게만 보이기 때문에,
// 그 상태로 APK를 만들면 다른 사람 휴대폰에서는 로그인/예약이 전부 실패해요.
export const BASE_URL = "http://192.168.1.101:8080";

// 리뷰 사진 등 서버에 저장된 URL을 화면에 보여줄 때 항상 이 함수를 거쳐주세요.
// 예전 버그로 인해 DB에 휴대폰 로컬 경로(file://, ph://, content:// 등)가 남아있는
// 리뷰가 있을 수 있는데, 그런 값을 그대로 Image에 넘기면 앱이 깨지기 때문에
// http(s) 주소나 서버 상대경로("/uploads/...")가 아니면 null을 돌려줘서 걸러냅니다.
export function resolvePhotoUrl(uri: string | null | undefined): string | null {
  if (!uri) return null;
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
  if (uri.startsWith("/uploads/")) return `${BASE_URL}${uri}`;
  return null; // file://, ph://, content:// 등 이 기기에서만 통하는 경로 — 표시 안 함
}

export async function checkLoginId(loginId: string): Promise<boolean> {
  const res = await fetch(
    `${BASE_URL}/api/auth/check-id?loginId=${encodeURIComponent(loginId)}`,
  );
  const data = await res.json();
  return data.available as boolean;
}

export async function sendPhoneCode(phone: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/phone/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) throw new Error("인증번호 발급에 실패했습니다.");
  const data = await res.json();
  return data.code as string; // 가짜 인증: 서버가 인증번호를 그대로 돌려줌
}

export async function verifyPhoneCode(
  phone: string,
  code: string,
): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/api/auth/phone/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  const data = await res.json();
  return !!data.verified;
}

export type SignupPayload = {
  loginId: string;
  password: string;
  nickname: string;
  phone: string;
  email?: string;
  googleId?: string;
};

export async function signup(
  payload: SignupPayload,
): Promise<{ nickname: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "회원가입에 실패했습니다.");
  return data;
}

export type LoginPayload = {
  loginId: string;
  phone: string;
  password: string;
};

export async function login(payload: LoginPayload): Promise<{
  nickname: string;
  loginId: string;
  phone: string;
  avatarUrl: string;
}> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "로그인에 실패했습니다.");
  return data;
}

// 프로필 사진 업로드 — 서버 파일로 저장되어, 로그인만 하면 어느 기기에서든 보여요.
// imageBase64는 순수 base64 문자열이어도, "data:image/jpeg;base64,..." 형태여도 됩니다.
export async function uploadAvatar(
  loginId: string,
  imageBase64: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/avatar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId, imageBase64 }),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.message || "프로필 사진 업로드에 실패했습니다.");
  return data.avatarUrl as string;
}

// ── 아이디 찾기 ──────────────────────────────────────
export async function findId(phone: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/find-id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "아이디를 찾을 수 없습니다.");
  return data.loginId as string;
}

// ── 비밀번호 재설정 (로그인 전, 아이디+전화번호로 본인확인) ──────────
export async function resetPassword(
  loginId: string,
  phone: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId, phone, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "비밀번호 변경에 실패했습니다.");
}

// ── 닉네임 변경 (로그인 후) ───────────────────────────
export async function updateNickname(
  loginId: string,
  nickname: string,
): Promise<{ nickname: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/nickname`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId, nickname }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "닉네임 변경에 실패했습니다.");
  return data;
}

// ── 비밀번호 변경 (로그인 후, 현재 비밀번호 확인) ──────────
export async function changePassword(
  loginId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId, currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "비밀번호 변경에 실패했습니다.");
}

// ── AI Chat (Gemini API 연동) ────────────────────────
export type ChatApiMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function sendAiChatMessage(
  messages: ChatApiMessage[],
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "AI 응답을 받지 못했습니다.");
  return data.reply as string;
}

// ── AI 리뷰 문장 생성 (Gemini) ─────────────────────────
export type GenerateReviewPayload = {
  rating: number;
  goodPoints?: string[];
  menuName?: string;
  taste?: string;
  mood?: string;
  service?: string;
};

export async function generateAiReview(
  payload: GenerateReviewPayload,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/review-ai/generate-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "AI 리뷰 생성에 실패했습니다.");
  return data.reviewText as string;
}

// ── 블로그 리뷰 (네이버 검색 API 연동) ────────────────
export type BlogReviewItem = {
  title: string;
  snippet: string;
  blogName: string;
  link: string;
  postDate: string;
};

export async function getBlogReviews(
  display: number = 10,
): Promise<BlogReviewItem[]> {
  const res = await fetch(`${BASE_URL}/api/blog-reviews?display=${display}`);
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.message || "블로그 리뷰를 가져오지 못했습니다.");
  return data as BlogReviewItem[];
}

// ── 방문자 리뷰 (서버 DB 저장) ───────────────────────
export type ServerReview = {
  id: number;
  displayName: string;
  avatarUrl?: string;
  rating: number;
  text: string;
  menuName?: string;
  reservationId?: number; // ← 이 줄 추가
  keywords: string[];
  photos: string[];
  likes: number;
  rewardEligible: boolean;
  ownerReply?: string;
  ownerReplyAt?: number;
  createdAt: string;
};

export type CreateReviewPayload = {
  loginId: string;
  displayName: string;
  rating: number;
  text: string;
  menuName?: string;
  reservationId?: number; // ← 이 줄 추가
  keywords?: string[];
  photos?: string[];
  rewardEligible?: boolean;
};

export async function createReview(
  payload: CreateReviewPayload,
): Promise<ServerReview> {
  const res = await fetch(`${BASE_URL}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "리뷰 등록에 실패했습니다.");
  return data as ServerReview;
}

// 리뷰 사진 업로드 — 서버 파일로 저장되어, 누가 보든 항상 같은 사진이 보여요.
export async function uploadReviewPhoto(imageBase64: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/reviews/upload-photo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "사진 업로드에 실패했습니다.");
  return data.url as string;
}

export async function getAllReviews(): Promise<ServerReview[]> {
  const res = await fetch(`${BASE_URL}/api/reviews`);
  const data = await res.json();
  if (!res.ok) throw new Error("리뷰를 불러오지 못했습니다.");
  return data as ServerReview[];
}

export async function getMyReviews(loginId: string): Promise<ServerReview[]> {
  const res = await fetch(
    `${BASE_URL}/api/reviews/me?loginId=${encodeURIComponent(loginId)}`,
  );
  const data = await res.json();
  if (!res.ok) throw new Error("내 리뷰를 불러오지 못했습니다.");
  return data as ServerReview[];
}

export async function deleteReview(id: number, loginId: string): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/reviews/${id}?loginId=${encodeURIComponent(loginId)}`,
    { method: "DELETE" },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "리뷰 삭제에 실패했습니다.");
}

// 예약 시 입력한 전화번호로 가입된 회원이 리뷰를 하나라도 썼는지 확인
// (예약 내역 화면에서 "리뷰 작성하고 1,500원 적립받기" 버튼 노출 여부에 사용)
export async function hasReviewed(phone: string): Promise<boolean> {
  const res = await fetch(
    `${BASE_URL}/api/reviews/has-reviewed?phone=${encodeURIComponent(phone)}`,
  );
  const data = await res.json();
  if (!res.ok) throw new Error("리뷰 작성 여부를 확인하지 못했습니다.");
  return !!data.hasReviewed;
}

// ── 리뷰 적립금 (적립/사용) ────────────────────────────────

export type RewardSummary = {
  earned: number; // 지금까지 적립된 총액
  spent: number; // 지금까지 사용한 총액
  balance: number; // 남은 잔액
};

export async function getRewardSummary(
  loginId: string,
): Promise<RewardSummary> {
  const res = await fetch(
    `${BASE_URL}/api/rewards/summary?loginId=${encodeURIComponent(loginId)}`,
  );
  const data = await res.json();
  if (!res.ok) throw new Error("적립금 정보를 불러오지 못했습니다.");
  return data as RewardSummary;
}

// 실패 시(잔액 부족 등) message에 안내문이 담겨 있어요.
export async function redeemReward(
  loginId: string,
  itemName: string,
  amount: number,
): Promise<RewardSummary> {
  const res = await fetch(`${BASE_URL}/api/rewards/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId, itemName, amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "적립금 사용에 실패했습니다.");
  return data as RewardSummary;
}

// ── 예약 (좌석/룸 + 시간, 서버에 저장되어 이중예약을 막습니다) ──────────

export type TakenSlot = {
  roomId: string;
  time: string;
};

export type ServerReservation = {
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
  menus?: Record<string, number>;
  takeoutMenus?: Record<string, number>;
  status: "CONFIRMED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  paymentMethod?: string;
  paidAmount: number;
  paidAt?: number;
  createdAt: number;
};

export type CreateReservationPayload = {
  roomId: string;
  roomLabel: string;
  type?: "DINE_IN" | "TAKEOUT";
  date: string;
  time: string;
  name: string;
  loginId?: string;
  phone: string;
  peopleCount: number;
  message?: string;
  hasPet?: boolean;
  wantsTakeout?: boolean;
  menus?: Record<string, number>;
  takeoutMenus?: Record<string, number>;
};

// 특정 날짜에 이미 찬 (자리, 시간) 목록 — 예약 화면에서 그 조합은 회색 처리합니다.
export async function getReservationAvailability(
  date: string,
): Promise<TakenSlot[]> {
  const res = await fetch(
    `${BASE_URL}/api/reservations/availability?date=${encodeURIComponent(date)}`,
  );
  const data = await res.json();
  if (!res.ok) throw new Error("예약 가능 시간을 불러오지 못했습니다.");
  return data as TakenSlot[];
}

// 전화번호 기준 내 예약 목록 (마이페이지 / 예약 확인 화면)
export async function getMyReservations(
  phone: string,
): Promise<ServerReservation[]> {
  const res = await fetch(
    `${BASE_URL}/api/reservations/mine?phone=${encodeURIComponent(phone)}`,
  );
  const data = await res.json();
  if (!res.ok) throw new Error("예약 내역을 불러오지 못했습니다.");
  return data as ServerReservation[];
}

// 실패 시(자리가 이미 찬 경우 등) message에 사용자에게 보여줄 안내문이 담겨 있어요.
export async function createReservation(
  payload: CreateReservationPayload,
): Promise<ServerReservation> {
  const res = await fetch(`${BASE_URL}/api/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "예약에 실패했습니다.");
  return data as ServerReservation;
}

export async function updateReservationApi(
  id: number,
  payload: CreateReservationPayload,
): Promise<ServerReservation> {
  const res = await fetch(`${BASE_URL}/api/reservations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "예약 수정에 실패했습니다.");
  return data as ServerReservation;
}

export async function cancelReservationApi(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/reservations/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "예약 취소에 실패했습니다.");
}

// ── 팔공산 근처 명소 (홈 화면) ──────────────────────────

export type NearbySpot = {
  id: number;
  name: string;
  description: string;
  icon: string | null;
  imageUrl: string | null;
};

export async function getNearbySpots(): Promise<NearbySpot[]> {
  const res = await fetch(`${BASE_URL}/api/nearby-spots`);
  const data = await res.json();
  if (!res.ok) throw new Error("주변 명소를 불러오지 못했습니다.");
  return data as NearbySpot[];
}
// 모의 결제 — 실제로 돈이 빠지지 않고, 예약에 "결제 완료" 상태만 기록합니다.
export async function payReservation(
  id: number,
  paymentMethod: string,
  amount: number,
): Promise<ServerReservation> {
  const res = await fetch(`${BASE_URL}/api/reservations/${id}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentMethod, amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "결제에 실패했습니다.");
  return data as ServerReservation;
}

// ── 알림 ──────────────────────────────────────────────
export type ServerNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  route?: string;
  isRead: boolean;
  createdAt: number;
};

export async function getNotifications(
  loginId: string,
): Promise<ServerNotification[]> {
  const res = await fetch(
    `${BASE_URL}/api/notifications?loginId=${encodeURIComponent(loginId)}`,
  );
  if (!res.ok) throw new Error("알림을 불러오지 못했습니다.");
  return (await res.json()) as ServerNotification[];
}

export async function getUnreadNotificationCount(
  loginId: string,
): Promise<number> {
  const res = await fetch(
    `${BASE_URL}/api/notifications/unread-count?loginId=${encodeURIComponent(loginId)}`,
  );
  if (!res.ok) throw new Error("알림 개수를 불러오지 못했습니다.");
  const data = await res.json();
  return data.count as number;
}

export async function markNotificationRead(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("알림 읽음 처리에 실패했습니다.");
}

export async function markAllNotificationsRead(loginId: string): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/notifications/read-all?loginId=${encodeURIComponent(loginId)}`,
    { method: "PATCH" },
  );
  if (!res.ok) throw new Error("알림 읽음 처리에 실패했습니다.");
}

// ── 안내 문구 (정보 화면: 소개/맛/좌석/오시는 길·주차) ──────────
export type StoreInfoSection = {
  id: number;
  group: string;
  title: string;
  content: string;
  icon?: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
};

export async function getStoreInfo(): Promise<StoreInfoSection[]> {
  const res = await fetch(`${BASE_URL}/api/store-info`);
  if (!res.ok) throw new Error("안내 문구를 불러오지 못했습니다.");
  return (await res.json()) as StoreInfoSection[];
}

// ── 메뉴 ────────────────────────────────────────────────────
export type BackendMenuIngredient = {
  name: string;
  imageUrl?: string;
};

export type BackendMenuItem = {
  id: number;
  category: string;
  name: string;
  description: string;
  price: string;
  priceVal: number;
  isHot: boolean;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
  ingredients: BackendMenuIngredient[];
};

export async function getMenuItems(): Promise<BackendMenuItem[]> {
  const res = await fetch(`${BASE_URL}/api/menu`);
  if (!res.ok) throw new Error("메뉴를 불러오지 못했습니다.");
  return (await res.json()) as BackendMenuItem[];
}

// ── 가게 정보 (주소·전화·영업시간·휴무일·리뷰 통계) ────────────
export type StoreProfile = {
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

export type ClosedDate = {
  id: number;
  date: string; // "2026-07-22"
  reason?: string;
};

export type ReviewStats = {
  averageRating: number;
  totalCount: number;
  highlightQuotes: string[];
};

export async function getStoreProfile(): Promise<StoreProfile> {
  const res = await fetch(`${BASE_URL}/api/store-profile`);
  if (!res.ok) throw new Error("가게 정보를 불러오지 못했습니다.");
  return (await res.json()) as StoreProfile;
}

export async function getUpcomingClosedDates(): Promise<ClosedDate[]> {
  const res = await fetch(`${BASE_URL}/api/store-profile/closed-dates`);
  if (!res.ok) throw new Error("휴무일 정보를 불러오지 못했습니다.");
  return (await res.json()) as ClosedDate[];
}

export async function getReviewStats(): Promise<ReviewStats> {
  const res = await fetch(`${BASE_URL}/api/store-profile/review-stats`);
  if (!res.ok) throw new Error("리뷰 통계를 불러오지 못했습니다.");
  return (await res.json()) as ReviewStats;
}

// ── 예약 가능 시간 (손님용, 매장 식사/포장 따로) ────────────
export type ReservationTimeConfig = {
  type: string;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  slots: string[]; // 이 화면에서 실제로 쓸 시간 목록
};

export async function getReservationTimeConfig(
  type: "dine-in" | "takeout",
): Promise<ReservationTimeConfig> {
  const res = await fetch(`${BASE_URL}/api/reservation-times/${type}`);
  if (!res.ok) throw new Error("예약 가능 시간을 불러오지 못했습니다.");
  return (await res.json()) as ReservationTimeConfig;
}

// ── 방문 도장 (5회 방문 혜택, 서버에 저장) ────────────────
export type VisitStampStatus = {
  visitCount: number;
  totalStamps: number;
  canClaim: boolean;
  lastClaimedAt: string | null;
};

export async function getVisitStampStatus(
  phone: string,
  loginId?: string,
): Promise<VisitStampStatus> {
  const query = loginId
    ? `phone=${encodeURIComponent(phone)}&loginId=${encodeURIComponent(loginId)}`
    : `phone=${encodeURIComponent(phone)}`;
  const res = await fetch(`${BASE_URL}/api/rewards/visit-stamp?${query}`);
  if (!res.ok) throw new Error("방문 도장 현황을 불러오지 못했습니다.");
  return (await res.json()) as VisitStampStatus;
}

export async function claimVisitStampReward(
  phone: string,
  loginId: string,
): Promise<VisitStampStatus> {
  const res = await fetch(`${BASE_URL}/api/rewards/visit-stamp/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, loginId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "혜택 사용에 실패했습니다.");
  return data as VisitStampStatus;
}

export type VisitRewardClaimRecord = {
  id: number;
  claimedAt: string;
  visitDates: string[]; // 이 회차에 쓰인 방문 날짜들 (오래된 순)
};

export async function getVisitStampHistory(
  phone: string,
  loginId: string,
): Promise<VisitRewardClaimRecord[]> {
  const res = await fetch(
    `${BASE_URL}/api/rewards/visit-stamp/history?phone=${encodeURIComponent(phone)}&loginId=${encodeURIComponent(loginId)}`,
  );
  if (!res.ok) throw new Error("사용 내역을 불러오지 못했습니다.");
  return (await res.json()) as VisitRewardClaimRecord[];
}

// ── 쿠폰 (사장님이 관리자 화면에서 등록) ────────────────
export type Coupon = {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  count?: string;
  displayOrder: number;
  active: boolean;
};

export async function getCoupons(): Promise<Coupon[]> {
  const res = await fetch(`${BASE_URL}/api/coupons`);
  if (!res.ok) throw new Error("쿠폰 목록을 불러오지 못했습니다.");
  return (await res.json()) as Coupon[];
}

// ── 리뷰 작성법 단계 안내 ────────────────
export type ReviewGuideStep = {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
};

export async function getReviewGuideSteps(): Promise<ReviewGuideStep[]> {
  const res = await fetch(`${BASE_URL}/api/review-guide`);
  if (!res.ok) throw new Error("리뷰 작성법을 불러오지 못했습니다.");
  return (await res.json()) as ReviewGuideStep[];
}

// ── 리뷰 작성 화면의 "이런 점이 좋았어요" 선택지 ────────────
export type ReviewGoodPointOption = {
  id: number;
  emoji: string;
  label: string;
  displayOrder: number;
  active: boolean;
};

export async function getReviewGoodPointOptions(): Promise<
  ReviewGoodPointOption[]
> {
  const res = await fetch(`${BASE_URL}/api/review-good-points`);
  if (!res.ok) throw new Error("선택지를 불러오지 못했습니다.");
  return (await res.json()) as ReviewGoodPointOption[];
}

export type CouponNotice = {
  content: string; // 줄바꿈(\n)으로 구분된 안내 항목들
};

export async function getCouponNotice(): Promise<CouponNotice> {
  const res = await fetch(`${BASE_URL}/api/coupon-notice`);
  if (!res.ok) throw new Error("안내 문구를 불러오지 못했습니다.");
  return (await res.json()) as CouponNotice;
}

export type ReviewMenuOption = {
  id: number;
  name: string;
  displayOrder: number;
  active: boolean;
};

export async function getReviewMenuOptions(): Promise<ReviewMenuOption[]> {
  const res = await fetch(`${BASE_URL}/api/review-menu-options`);
  if (!res.ok) throw new Error("메뉴 목록을 불러오지 못했습니다.");
  return (await res.json()) as ReviewMenuOption[];
}

// ── 방문 도장 설정 (몇 번 방문하면 무엇을 주는지) ────────────
export type VisitStampSettingsInfo = {
  requiredVisits: number;
  rewardName: string;
};

export async function getVisitStampSettingsInfo(): Promise<VisitStampSettingsInfo> {
  const res = await fetch(`${BASE_URL}/api/visit-stamp-settings`);
  if (!res.ok) throw new Error("방문 도장 설정을 불러오지 못했습니다.");
  return (await res.json()) as VisitStampSettingsInfo;
}

// ── 리뷰 적립금 교환 가능 메뉴 ────────────
export type RewardRedeemableItem = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
};

export async function getRewardRedeemableItems(): Promise<
  RewardRedeemableItem[]
> {
  const res = await fetch(`${BASE_URL}/api/reward-redeemable-items`);
  if (!res.ok) throw new Error("교환 가능 메뉴를 불러오지 못했습니다.");
  return (await res.json()) as RewardRedeemableItem[];
}
