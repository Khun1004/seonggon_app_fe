// components/contexts/ReviewContext.tsx
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createReview as apiCreateReview,
  deleteReview as apiDeleteReview,
  getMyReviews as apiGetMyReviews,
  CreateReviewPayload,
  getAllReviews,
  ServerReview,
} from "@/constants/api";
import { useAuth } from "./AuthContext";

export type Review = {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  date: string;
  createdAtRaw: string;
  text: string;
  options: string[];
  likes: number;
  photos?: string[];
  keywords?: string[];
  menuName?: string;
  reservationId?: string;
  rewardEligible?: boolean;
  ownerReply?: string;
  ownerReplyAt?: number;
};

export type GoodPointStat = {
  emoji: string;
  label: string;
  count: number;
};

export type MenuRatingStat = {
  name: string;
  totalRating: number;
  reviewCount: number;
};

// 키워드 라벨 -> 이모지 매핑 (서버는 라벨 문자열만 저장하므로, 화면 표시용 이모지는 클라이언트에서 붙입니다)
const KEYWORD_EMOJI: Record<string, string> = {
  "음식이 맛있어요": "😋",
  친절해요: "💗",
  "고기 질이 좋아요": "🥩",
  "단체모임 하기 좋아요": "👤",
  "양이 많아요": "🍚",
  "매장이 넓어요": "👀",
  "주차하기 편해요": "🅿️",
  "뷰가 좋아요": "🖼️",
  "특별한 메뉴가 있어요": "👨‍🍳",
  "건강한 맛이에요": "🌿",
};

// 네이버 플레이스 키워드 통계 베이스라인 (실제 매장 데이터 반영) — 서버 리뷰가 쌓일수록 이 위에 누적됩니다.
const BASELINE_GOOD_POINTS: GoodPointStat[] = [
  { emoji: "😋", label: "음식이 맛있어요", count: 2323 },
  { emoji: "💗", label: "친절해요", count: 982 },
  { emoji: "🥩", label: "고기 질이 좋아요", count: 853 },
  { emoji: "👤", label: "단체모임 하기 좋아요", count: 673 },
  { emoji: "🍚", label: "양이 많아요", count: 672 },
  { emoji: "👀", label: "매장이 넓어요", count: 605 },
  { emoji: "🅿️", label: "주차하기 편해요", count: 572 },
  { emoji: "🖼️", label: "뷰가 좋아요", count: 545 },
  { emoji: "👨‍🍳", label: "특별한 메뉴가 있어요", count: 526 },
  { emoji: "🌿", label: "건강한 맛이에요", count: 392 },
];

// 대표 메뉴별 평점 베이스라인
const BASELINE_MENU_RATINGS: MenuRatingStat[] = [
  { name: "능이오리백숙", totalRating: 5 * 412, reviewCount: 412 },
  { name: "산더미 오리간장불고기", totalRating: 4.5 * 318, reviewCount: 318 },
  { name: "능이닭백숙", totalRating: 4.5 * 256, reviewCount: 256 },
  { name: "유황오리생불고기", totalRating: 4 * 201, reviewCount: 201 },
  { name: "유황오리로스구이", totalRating: 4 * 178, reviewCount: 178 },
  { name: "해물파전", totalRating: 4.5 * 134, reviewCount: 134 },
];

function serverReviewToReview(r: ServerReview): Review {
  return {
    id: String(r.id),
    name: r.displayName,
    avatarUrl: r.avatarUrl,
    rating: r.rating,
    date: new Date(r.createdAt).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    createdAtRaw: r.createdAt,
    text: r.text,
    options: [
      r.photos.length > 0 ? "포토리뷰" : "일반리뷰",
      ...(r.menuName ? [r.menuName] : []),
    ].filter(Boolean),
    likes: r.likes,
    photos: r.photos,
    keywords: r.keywords,
    menuName: r.menuName,
    reservationId:
      r.reservationId != null ? String(r.reservationId) : undefined,
    rewardEligible: r.rewardEligible,
    ownerReply: r.ownerReply,
    ownerReplyAt: r.ownerReplyAt,
  };
}

type ReviewContextType = {
  myReviews: Review[];
  allReviews: Review[];
  loading: boolean;
  addReview: (review: {
    id: string;
    name: string;
    rating: number;
    date: string;
    text: string;
    options: string[];
    likes: number;
    photos?: string[];
    keywords?: string[];
    menuName?: string;
    reservationId?: string;
    rewardEligible?: boolean;
  }) => Promise<void>;
  removeReview: (id: string) => Promise<void>;
  refreshReviews: () => Promise<void>;

  goodPoints: GoodPointStat[];
  menuRatings: MenuRatingStat[];
};

export const ReviewContext = createContext<ReviewContextType>({
  myReviews: [],
  allReviews: [],
  loading: false,
  addReview: async () => {},
  removeReview: async () => {},
  refreshReviews: async () => {},
  goodPoints: BASELINE_GOOD_POINTS,
  menuRatings: BASELINE_MENU_RATINGS,
});

export const ReviewProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const [goodPoints, setGoodPoints] =
    useState<GoodPointStat[]>(BASELINE_GOOD_POINTS);
  const [menuRatings, setMenuRatings] = useState<MenuRatingStat[]>(
    BASELINE_MENU_RATINGS,
  );

  // 서버에서 가져온 전체 리뷰들을 바탕으로, 베이스라인 위에 키워드/메뉴 통계를 다시 집계합니다.
  const recomputeStats = (serverReviews: ServerReview[]) => {
    const goodPointMap = new Map<string, number>(
      BASELINE_GOOD_POINTS.map((g) => [g.label, g.count]),
    );
    const menuMap = new Map<
      string,
      { totalRating: number; reviewCount: number }
    >(
      BASELINE_MENU_RATINGS.map((m) => [
        m.name,
        { totalRating: m.totalRating, reviewCount: m.reviewCount },
      ]),
    );

    for (const r of serverReviews) {
      for (const kw of r.keywords ?? []) {
        goodPointMap.set(kw, (goodPointMap.get(kw) ?? 0) + 1);
      }
      if (r.menuName) {
        const existing = menuMap.get(r.menuName) ?? {
          totalRating: 0,
          reviewCount: 0,
        };
        menuMap.set(r.menuName, {
          totalRating: existing.totalRating + r.rating,
          reviewCount: existing.reviewCount + 1,
        });
      }
    }

    const newGoodPoints: GoodPointStat[] = Array.from(
      goodPointMap.entries(),
    ).map(([label, count]) => ({
      emoji: KEYWORD_EMOJI[label] ?? "✨",
      label,
      count,
    }));
    const newMenuRatings: MenuRatingStat[] = Array.from(menuMap.entries()).map(
      ([name, stat]) => ({ name, ...stat }),
    );

    setGoodPoints(newGoodPoints);
    setMenuRatings(newMenuRatings);
  };

  const refreshReviews = async () => {
    setLoading(true);
    try {
      const all = await getAllReviews();
      setAllReviews(all.map(serverReviewToReview));
      recomputeStats(all);

      if (user) {
        const mine = await apiGetMyReviews(user.loginId);
        setMyReviews(mine.map(serverReviewToReview));
      } else {
        setMyReviews([]);
      }
    } catch {
      // 서버 통신 실패 시 기존 상태 유지 (베이스라인 통계는 그대로 보여줌)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.loginId]);

  const addReview = async (review: {
    id: string;
    name: string;
    rating: number;
    date: string;
    text: string;
    options: string[];
    likes: number;
    photos?: string[];
    keywords?: string[];
    menuName?: string;
    reservationId?: string;
    rewardEligible?: boolean;
  }) => {
    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const payload: CreateReviewPayload = {
      loginId: user.loginId,
      displayName: review.name,
      rating: review.rating,
      text: review.text,
      menuName: review.menuName,
      reservationId: review.reservationId
        ? Number(review.reservationId)
        : undefined,
      keywords: review.keywords ?? [],
      photos: review.photos ?? [],
      rewardEligible: review.rewardEligible ?? false,
    };

    await apiCreateReview(payload);
    await refreshReviews();
  };

  const removeReview = async (id: string) => {
    if (!user) return;
    await apiDeleteReview(Number(id), user.loginId);
    await refreshReviews();
  };

  return (
    <ReviewContext.Provider
      value={{
        myReviews,
        allReviews,
        loading,
        addReview,
        removeReview,
        refreshReviews,
        goodPoints,
        menuRatings,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
};

export function useReview() {
  return useContext(ReviewContext);
}
