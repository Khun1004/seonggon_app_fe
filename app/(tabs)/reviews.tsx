// app/(tabs)/reviews.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReviewContext } from "@/components/contexts/ReviewContext";
import {
  BlogReviewItem,
  getBlogReviews,
  resolvePhotoUrl,
} from "@/constants/api";
import { NAVER_REVIEW_URL } from "@/constants/store";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

type VisitorReview = {
  id: string | number;
  name: string;
  avatarUrl?: string;
  rating: number;
  date: string;
  text: string;
  options: string[];
  likes: number;
  photos?: string[];
  ownerReply?: string;
};

const VISITOR_REVIEWS: VisitorReview[] = [
  {
    id: 1,
    name: "김*현",
    rating: 5,
    date: "2026.04.08",
    text: "가족 모임으로 능이백숙 먹었는데 국물이 진짜 진하고 맛있어요! 어르신들이 너무 좋아하셔서 뿌듯했습니다. 다음에도 재방문 의사 있습니다.",
    options: ["능이오리백숙", "룸 이용"],
    likes: 12,
  },
  {
    id: 2,
    name: "이*진",
    rating: 5,
    date: "2026.04.05",
    text: "주차장이 넓어서 모임하기 너무 좋았어요. 1층 룸에서 식사했는데 조용하고 아늑한 분위기 굿! 직원분들도 모두 친절하십니다.",
    options: ["산더미 오리간장불고기 3-4인"],
    likes: 8,
  },
  {
    id: 3,
    name: "박*훈",
    rating: 4.5,
    date: "2026.03.29",
    text: "오리불고기 양도 엄청 많고 아이들도 아주 잘 먹네요. 해물파전도 바삭바삭해서 막걸리랑 찰떡궁합이었습니다~",
    options: ["유황오리생불고기", "해물파전", "찹쌀동동주"],
    likes: 5,
  },
  {
    id: 4,
    name: "최*영",
    rating: 5,
    date: "2026.03.15",
    text: "항상 팔공산 오면 들리는 맛집입니다. 반찬도 정갈하고 정성 가득한 맛이에요. 볶음밥은 꼭 드세요!",
    options: ["유황오리로스구이"],
    likes: 15,
  },
];

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    let iconName: keyof typeof Ionicons.glyphMap = "star";
    if (i > rating && i - rating < 1) iconName = "star-half";
    else if (i > rating) iconName = "star-outline";
    stars.push(
      <Ionicons
        key={i}
        name={iconName}
        size={size}
        color={Palette.gold}
        style={{ marginRight: 2 }}
      />,
    );
  }
  return <View style={{ flexDirection: "row" }}>{stars}</View>;
}

export default function Reviews() {
  const router = useRouter();
  const { allReviews, goodPoints, menuRatings, refreshReviews } =
    useContext(ReviewContext);
  const [activeTab, setActiveTab] = useState<"방문자 리뷰" | "블로그 리뷰">(
    "방문자 리뷰",
  );
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0); // 0: 좋았어요, 1: 메뉴별 평점

  // 화면에 들어올 때마다 최신 리뷰를 다시 불러옵니다.
  useEffect(() => {
    refreshReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 네이버 블로그 리뷰 — 실제 API에서 가져옴
  const [blogReviews, setBlogReviews] = useState<BlogReviewItem[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [blogLoaded, setBlogLoaded] = useState(false);

  const loadBlogReviews = async () => {
    setBlogLoading(true);
    setBlogError(null);
    try {
      const result = await getBlogReviews(10);
      setBlogReviews(result);
      setBlogLoaded(true);
    } catch (e: any) {
      setBlogError(e.message || "블로그 리뷰를 가져오지 못했습니다.");
    } finally {
      setBlogLoading(false);
    }
  };

  // 블로그 리뷰 탭을 처음 누를 때 한 번만 불러옵니다.
  useEffect(() => {
    if (activeTab === "블로그 리뷰" && !blogLoaded && !blogLoading) {
      loadBlogReviews();
    }
  }, [activeTab]);

  // 서버에 등록된 모든 회원의 리뷰 + 초기 데모 리뷰를 합쳐서 표시 (서버 리뷰가 위로)
  const serverReviewsAsVisitor: VisitorReview[] = (allReviews ?? []).map(
    (rev) => ({
      id: `server-${rev.id}`,
      name: rev.name || "고객",
      avatarUrl: rev.avatarUrl,
      rating: rev.rating,
      date: rev.date,
      text: rev.text,
      options: rev.options ?? [],
      likes: rev.likes ?? 0,
      photos: rev.photos,
      ownerReply: rev.ownerReply,
    }),
  );

  const allVisitorReviews: VisitorReview[] = [
    ...serverReviewsAsVisitor,
    ...VISITOR_REVIEWS,
  ];

  const maxKeywordCount =
    goodPoints.length > 0 ? Math.max(...goodPoints.map((g) => g.count)) : 1;

  const visibleKeywords = showAllKeywords ? goodPoints : goodPoints.slice(0, 6);

  const computedMenuRatings = menuRatings.map((m) => ({
    name: m.name,
    rating: m.reviewCount > 0 ? m.totalRating / m.reviewCount : 0,
    reviewCount: m.reviewCount,
  }));

  const goToPrevSlide = () => setSlideIndex((prev) => Math.max(0, prev - 1));
  const goToNextSlide = () => setSlideIndex((prev) => Math.min(1, prev + 1));

  const openBlogPost = (link: string) => {
    Linking.openURL(link).catch(() => {});
  };

  const renderVisitorReview = (item: VisitorReview) => {
    const isServerReview =
      typeof item.id === "string" && item.id.startsWith("server-");
    const numericId = isServerReview
      ? (item.id as string).replace("server-", "")
      : null;

    const CardWrapper = isServerReview ? TouchableOpacity : View;

    return (
      <CardWrapper
        key={item.id}
        style={styles.reviewCard}
        {...(isServerReview
          ? {
              activeOpacity: 0.75,
              onPress: () =>
                router.push(`/review-detail?id=${numericId}` as any),
            }
          : {})}
      >
        <View style={styles.reviewerInfo}>
          {resolvePhotoUrl(item.avatarUrl) ? (
            <Image
              source={{ uri: resolvePhotoUrl(item.avatarUrl)! }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarEmpty}>
              <Ionicons name="person" size={18} color={Palette.inkFaint} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewerName}>{item.name}</Text>
            <View style={styles.timeRow}>
              <StarRow rating={item.rating} size={12} />
              <Text style={styles.reviewDate}>{item.date}</Text>
            </View>
          </View>
          {isServerReview && (
            <Ionicons name="chevron-forward" size={16} color={Palette.gold} />
          )}
        </View>

        {item.options.length > 0 && (
          <View style={styles.optionsBox}>
            <Text style={styles.optionsText}>
              {item.options.join(" • ")} 가(이) 포함된 식사
            </Text>
          </View>
        )}

        <Text style={styles.reviewText} numberOfLines={4}>
          {item.text}
        </Text>

        {item.photos &&
          item.photos.filter((u) => resolvePhotoUrl(u)).length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photoRow}>
                {item.photos
                  .map((u) => resolvePhotoUrl(u))
                  .filter((u): u is string => !!u)
                  .map((uri, idx) => (
                    <Image
                      key={idx}
                      source={{ uri }}
                      style={styles.photoThumb}
                    />
                  ))}
              </View>
            </ScrollView>
          )}

        <View style={styles.actionButtonRow}>
          <TouchableOpacity style={styles.likeBtn}>
            <Ionicons
              name="thumbs-up-outline"
              size={13}
              color={Palette.inkFaint}
            />
            <Text style={styles.likeText}>도움이 돼요 {item.likes}</Text>
          </TouchableOpacity>
          {item.ownerReply && (
            <View style={styles.commentBtn}>
              <Ionicons
                name="chatbubble-outline"
                size={13}
                color={Palette.amberDeep}
              />
              <Text style={styles.commentBtnText}>댓글 1</Text>
            </View>
          )}
        </View>
      </CardWrapper>
    );
  };

  const renderBlogReview = (item: BlogReviewItem, idx: number) => (
    <TouchableOpacity
      key={`${item.link}-${idx}`}
      style={styles.blogCard}
      activeOpacity={0.8}
      onPress={() => openBlogPost(item.link)}
    >
      <Text style={styles.blogTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.blogSnippet} numberOfLines={3}>
        {item.snippet}
      </Text>
      <View style={styles.blogFooter}>
        <Text style={styles.blogName}>{item.blogName}</Text>
        <View style={styles.blogFooterRight}>
          <Text style={styles.blogDate}>{item.postDate}</Text>
          <Ionicons name="open-outline" size={13} color={Palette.inkFaint} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Dark header */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.eyebrow}>GUEST REVIEWS</Text>
              <Text style={styles.headerTitle}>리뷰</Text>
            </View>
            <TouchableOpacity
              style={styles.headerWriteBtn}
              onPress={() => router.push("/review-write" as any)}
            >
              <Ionicons name="pencil" size={13} color={Palette.charcoal} />
              <Text style={styles.headerWriteText}>리뷰 작성</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120, paddingTop: 40 },
        ]}
      >
        {/* Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>성공식당 평점</Text>
          <View style={styles.overviewScoreRow}>
            <Text style={styles.overviewScore}>4.8</Text>
            <Text style={styles.overviewScoreSub}>/ 5</Text>
          </View>
          <StarRow rating={4.5} size={20} />
          <Text style={styles.overviewCount}>
            최근 120개의 방문자 평가 기준
          </Text>
          <TouchableOpacity
            style={styles.naverReviewBtn}
            onPress={() => Linking.openURL(NAVER_REVIEW_URL).catch(() => {})}
          >
            <Text style={styles.naverReviewBtnText}>네이버 리뷰 보기</Text>
            <Ionicons name="open-outline" size={14} color={Palette.ink} />
          </TouchableOpacity>
        </View>

        {/* 슬라이드 영역 */}
        <View style={styles.slideWrap}>
          <View style={styles.slideNavRow}>
            <TouchableOpacity
              onPress={goToPrevSlide}
              disabled={slideIndex === 0}
              style={[
                styles.slideNavBtn,
                slideIndex === 0 && styles.slideNavBtnDisabled,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={slideIndex === 0 ? Palette.line : Palette.ink}
              />
            </TouchableOpacity>

            <View style={styles.slideDotsRow}>
              <View
                style={[
                  styles.slideDot,
                  slideIndex === 0 && styles.slideDotActive,
                ]}
              />
              <View
                style={[
                  styles.slideDot,
                  slideIndex === 1 && styles.slideDotActive,
                ]}
              />
            </View>

            <TouchableOpacity
              onPress={goToNextSlide}
              disabled={slideIndex === 1}
              style={[
                styles.slideNavBtn,
                slideIndex === 1 && styles.slideNavBtnDisabled,
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={slideIndex === 1 ? Palette.line : Palette.ink}
              />
            </TouchableOpacity>
          </View>

          {slideIndex === 0 ? (
            <View style={styles.goodPointCard}>
              <View style={styles.goodPointHeaderRow}>
                <Text style={styles.goodPointTitle}>이런 점이 좋았어요</Text>
                <Ionicons
                  name="help-circle-outline"
                  size={15}
                  color={Palette.inkFaint}
                />
              </View>
              <Text style={styles.goodPointSubText}>
                <Text style={styles.goodPointSubNum}>
                  {(2563).toLocaleString()}회
                </Text>{" "}
                {(2207).toLocaleString()}명 참여
              </Text>

              <View style={{ marginTop: Spacing.md }}>
                {visibleKeywords.map((kw) => {
                  const ratio = kw.count / maxKeywordCount;
                  return (
                    <View key={kw.label} style={styles.keywordRow}>
                      <View style={styles.keywordBarTrack}>
                        <View
                          style={[
                            styles.keywordBarFill,
                            { width: `${Math.max(ratio * 100, 14)}%` },
                          ]}
                        />
                        <View style={styles.keywordContentRow}>
                          <Text style={styles.keywordEmoji}>{kw.emoji}</Text>
                          <Text style={styles.keywordLabel}>"{kw.label}"</Text>
                        </View>
                      </View>
                      <Text style={styles.keywordCount}>
                        {kw.count.toLocaleString()}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.keywordToggleBtn}
                onPress={() => setShowAllKeywords((prev) => !prev)}
              >
                <Text style={styles.keywordToggleText}>
                  {showAllKeywords ? "접기" : "더보기"}
                </Text>
                <Ionicons
                  name={showAllKeywords ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={Palette.inkFaint}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.goodPointCard}>
              <View style={styles.goodPointHeaderRow}>
                <Text style={styles.goodPointTitle}>메뉴별 평점</Text>
                <Ionicons
                  name="restaurant-outline"
                  size={15}
                  color={Palette.inkFaint}
                />
              </View>
              <Text style={styles.goodPointSubText}>
                대표 메뉴에 대한 방문자 평가입니다
              </Text>

              <View style={{ marginTop: Spacing.md }}>
                {computedMenuRatings.map((menu) => (
                  <View key={menu.name} style={styles.menuRatingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuRatingName}>{menu.name}</Text>
                      <Text style={styles.menuRatingCount}>
                        리뷰 {menu.reviewCount}개
                      </Text>
                    </View>
                    <View style={styles.menuRatingScoreBox}>
                      <StarRow rating={menu.rating} size={14} />
                      <Text style={styles.menuRatingScoreText}>
                        {menu.rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {(["방문자 리뷰", "블로그 리뷰"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "방문자 리뷰" &&
          allVisitorReviews.map(renderVisitorReview)}

        {activeTab === "블로그 리뷰" && (
          <>
            {blogLoading && (
              <View style={styles.blogLoadingBox}>
                <ActivityIndicator color={Palette.amberDeep} />
                <Text style={styles.blogLoadingText}>
                  네이버 블로그 리뷰를 불러오고 있어요...
                </Text>
              </View>
            )}

            {!blogLoading && blogError && (
              <View style={styles.blogErrorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={Palette.error}
                />
                <Text style={styles.blogErrorText}>{blogError}</Text>
                <TouchableOpacity
                  style={styles.blogRetryBtn}
                  onPress={loadBlogReviews}
                >
                  <Text style={styles.blogRetryText}>다시 시도</Text>
                </TouchableOpacity>
              </View>
            )}

            {!blogLoading &&
              !blogError &&
              blogReviews.length === 0 &&
              blogLoaded && (
                <View style={styles.blogErrorBox}>
                  <Text style={styles.blogErrorText}>
                    아직 등록된 블로그 리뷰가 없어요.
                  </Text>
                </View>
              )}

            {!blogLoading &&
              !blogError &&
              blogReviews.map((item, idx) => renderBlogReview(item, idx))}
          </>
        )}

        <View style={styles.moreWrap}>
          <TouchableOpacity style={styles.moreBtn}>
            <Text style={styles.moreBtnText}>더보기</Text>
            <Ionicons name="chevron-down" size={14} color={Palette.inkFaint} />
          </TouchableOpacity>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  header: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: Spacing.sm,
  },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Palette.cream,
  },
  headerWriteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Palette.gold,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  headerWriteText: {
    fontSize: 12,
    color: Palette.charcoal,
    fontWeight: "700",
  },
  overviewCard: {
    backgroundColor: Palette.white,
    marginHorizontal: Spacing.lg,
    marginTop: -28,
    borderRadius: Radius.lg,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    ...Shadow.card,
  },
  overviewTitle: {
    fontSize: 13,
    color: Palette.inkSoft,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  overviewScoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.sm,
  },
  overviewScore: {
    fontSize: 36,
    fontWeight: "700",
    color: Palette.ink,
  },
  overviewScoreSub: {
    fontSize: 16,
    color: Palette.inkFaint,
    fontWeight: "600",
    marginLeft: 4,
  },
  overviewCount: {
    fontSize: 12,
    color: Palette.inkFaint,
    marginTop: Spacing.sm,
  },
  naverReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.white,
  },
  naverReviewBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.ink,
  },

  slideWrap: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  slideNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  slideNavBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.card,
  },
  slideNavBtnDisabled: {
    opacity: 0.4,
  },
  slideDotsRow: {
    flexDirection: "row",
    gap: 6,
  },
  slideDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.line,
  },
  slideDotActive: {
    backgroundColor: Palette.amber,
    width: 16,
  },

  goodPointCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  goodPointHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  goodPointTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
  },
  goodPointSubText: {
    fontSize: 12,
    color: Palette.inkFaint,
    marginTop: 4,
  },
  goodPointSubNum: {
    color: "#2DA77B",
    fontWeight: "700",
  },
  keywordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  keywordBarTrack: {
    flex: 1,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Palette.creamDim,
    justifyContent: "center",
    overflow: "hidden",
  },
  keywordBarFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#BFE8DA",
    borderRadius: Radius.sm,
  },
  keywordContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm + 4,
  },
  keywordEmoji: {
    fontSize: 14,
  },
  keywordLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.ink,
  },
  keywordCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2DA77B",
    width: 46,
    textAlign: "right",
  },
  keywordToggleBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  keywordToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: Palette.inkFaint,
  },

  menuRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  menuRatingName: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  menuRatingCount: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginTop: 2,
  },
  menuRatingScoreBox: {
    alignItems: "flex-end",
    gap: 3,
  },
  menuRatingScoreText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.amberDeep,
  },

  tabContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Palette.white,
    borderRadius: Radius.pill,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  tabButtonActive: {
    backgroundColor: Palette.charcoal,
  },
  tabText: {
    fontSize: 13,
    color: Palette.inkSoft,
    fontWeight: "600",
  },
  tabTextActive: {
    color: Palette.cream,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  reviewCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm + 4,
  },
  avatarEmpty: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.creamDim,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm + 4,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.creamDim,
    marginRight: Spacing.sm + 4,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: 3,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewDate: {
    fontSize: 11,
    color: Palette.inkFaint,
  },
  photoRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
    backgroundColor: Palette.creamDim,
  },
  optionsBox: {
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm + 4,
  },
  optionsText: {
    fontSize: 11,
    color: Palette.inkSoft,
  },
  reviewText: {
    fontSize: 14,
    color: Palette.ink,
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  actionButtonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
  },
  likeText: {
    fontSize: 11,
    color: Palette.inkFaint,
  },
  commentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  commentBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  blogCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  blogTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm,
    lineHeight: 21,
  },
  blogSnippet: {
    fontSize: 13,
    color: Palette.inkSoft,
    lineHeight: 19,
    marginBottom: Spacing.md,
  },
  blogFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  blogFooterRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  blogName: {
    fontSize: 12,
    color: Palette.amberDeep,
    fontWeight: "700",
  },
  blogDate: {
    fontSize: 11,
    color: Palette.inkFaint,
  },
  blogLoadingBox: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm + 4,
  },
  blogLoadingText: {
    fontSize: 13,
    color: Palette.inkFaint,
  },
  blogErrorBox: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm + 4,
  },
  blogErrorText: {
    fontSize: 13,
    color: Palette.inkSoft,
    textAlign: "center",
  },
  blogRetryBtn: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.pill,
  },
  blogRetryText: {
    color: Palette.cream,
    fontSize: 13,
    fontWeight: "700",
  },
  moreWrap: {
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  moreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Palette.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    ...Shadow.card,
  },
  moreBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.inkSoft,
  },
});
