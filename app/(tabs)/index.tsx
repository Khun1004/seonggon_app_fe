// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

import BeforeYouVisit from "@/components/Home/BeforeYouVisit";
import { MenuContext } from "@/components/contexts/MenuContext";
import {
  ClosedDate,
  getMenuPopularity,
  getNearbySpots,
  getReviewStats,
  getStoreProfile,
  getUpcomingClosedDates,
  NearbySpot,
  ReviewStats,
  StoreProfile,
} from "@/constants/api";
import { resolveImageSource } from "@/constants/menu-data";
import { getReservationMenuName } from "@/constants/reservation-menu-data";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function timeStrToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// 관리자가 등록한 실제 영업시간·휴무일을 기준으로 영업 상태를 계산합니다.
// profile/closedDates를 아직 못 불러왔으면 일단 "영업중"으로 보여주고,
// 데이터가 오면 바로 갱신돼요.
function getBusinessStatus(
  profile: StoreProfile | null,
  closedDates: ClosedDate[],
) {
  const now = new Date();
  const todayLabel = WEEKDAY_LABELS[now.getDay()];
  const todayStr = toDateStr(now);

  const isClosedToday = closedDates.some((c) => c.date === todayStr);

  if (isClosedToday) {
    return {
      isOpen: false,
      isHoliday: true,
      todayLabel,
      timeRangeText: "휴무",
    };
  }

  if (!profile) {
    return { isOpen: true, isHoliday: false, todayLabel, timeRangeText: "" };
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = timeStrToMinutes(profile.openTime);
  const closeMinutes = timeStrToMinutes(profile.closeTime);
  const isOpen = nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  const timeRangeText = `${profile.openTime} - ${profile.closeTime}`;

  return { isOpen, isHoliday: false, todayLabel, timeRangeText };
}

const CATEGORIES: {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  bgColor: string;
  iconColor: string;
  textColor: string;
  borderColor: string;
}[] = [
  {
    id: "1",
    name: "메뉴",
    icon: "restaurant-outline",
    route: "/menu",
    bgColor: "#FFF3DC",
    iconColor: "#854F0B",
    textColor: "#854F0B",
    borderColor: "#FAC775",
  },
  {
    id: "2",
    name: "음료/주류",
    icon: "beer-outline",
    route: "/drinks",
    bgColor: "#E6F1FB",
    iconColor: "#185FA5",
    textColor: "#185FA5",
    borderColor: "#85B7EB",
  },
  {
    id: "3",
    name: "쿠폰",
    icon: "pricetag-outline",
    route: "/coupon",
    bgColor: "#FBEAF0",
    iconColor: "#993556",
    textColor: "#993556",
    borderColor: "#ED93B1",
  },
  {
    id: "4",
    name: "예약",
    icon: "calendar-outline",
    route: "/reservation",
    bgColor: "#EAF3DE",
    iconColor: "#3B6D11",
    textColor: "#3B6D11",
    borderColor: "#97C459",
  },
  {
    id: "5",
    name: "포장",
    icon: "bag-handle-outline",
    route: "/takeout",
    bgColor: "#F3E8FB",
    iconColor: "#6B3FA0",
    textColor: "#6B3FA0",
    borderColor: "#C6A6EA",
  },
];

// 메뉴 이름별로 순서대로 돌려가며 쓰는 색상 팔레트 — 실제 데이터는
// 서버에서 받아오고, 색깔만 여기서 순서대로 입혀줍니다.
const SALES_COLORS = [
  "#EF9F27",
  "#378ADD",
  "#D85A30",
  "#7F77DD",
  "#888780",
  "#639922",
  "#1D9E75",
  "#D4537E",
  "#B23A2E",
];

type SalesItem = { name: string; count: number; color: string };

// 아직 한 번도 안 팔린 메뉴도 0개로 항상 같이 보여주기 위한 전체 메뉴
// 이름 목록이에요 (관리자 화면의 "인기 메뉴 순위"랑 같은 목록이에요).
const KNOWN_MENU_NAMES = [
  "능이오리백숙",
  "능이닭백숙",
  "닭백숙",
  "오리백숙",
  "산더미 오리간장불고기",
  "유황오리생불고기",
  "유황오리로스구이",
  "해물파전",
  "도토리묵",
];

// 축 눈금을 데이터에 맞게 "보기 좋은" 단위(5, 10, 25, 50, 100...)로
// 알아서 잡아줘요. 데이터가 아직 적을 때 축이 0~500으로 텅 비어 보이는
// 것을 막기 위함이에요.
function computeNiceMax(maxCount: number): number {
  if (maxCount <= 0) return 5;
  const candidates = [5, 10, 15, 20, 30, 50, 75, 100, 150, 200, 300, 500, 1000];
  const found = candidates.find((c) => c >= maxCount);
  return found ?? Math.ceil(maxCount / 100) * 100;
}

function HorizontalBarChart({ data }: { data: SalesItem[] }) {
  const chartWidth = SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md * 2;
  const labelWidth = 96;
  const barAreaWidth = chartWidth - labelWidth - 50;
  const barHeight = 22;
  const barGap = 18;
  const maxValue = computeNiceMax(Math.max(...data.map((d) => d.count), 0));
  const axisSteps = [0, 0.25, 0.5, 0.75, 1].map((f) =>
    Math.round(maxValue * f),
  );

  const chartHeight = data.length * (barHeight + barGap);

  return (
    <View>
      <Svg width={chartWidth} height={chartHeight + 30}>
        {/* 세로 격자선 + 축 숫자 */}
        {axisSteps.map((step) => {
          const x = labelWidth + (step / maxValue) * barAreaWidth;
          return (
            <React.Fragment key={step}>
              <Line
                x1={x}
                y1={0}
                x2={x}
                y2={chartHeight}
                stroke={Palette.line}
                strokeWidth={1}
              />
              <SvgText
                x={x}
                y={chartHeight + 18}
                fontSize={10}
                fill={Palette.inkFaint}
                textAnchor="middle"
              >
                {step}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* 막대들 */}
        {data.map((item, idx) => {
          const y = idx * (barHeight + barGap);
          const barWidth = (item.count / maxValue) * barAreaWidth;

          return (
            <React.Fragment key={item.name}>
              <SvgText
                x={labelWidth - 8}
                y={y + barHeight / 2 + 4}
                fontSize={11}
                fill={Palette.ink}
                textAnchor="end"
                fontWeight="600"
              >
                {item.name}
              </SvgText>
              <Rect
                x={labelWidth}
                y={y}
                width={Math.max(barWidth, 2)}
                height={barHeight}
                rx={4}
                fill={item.color}
              />
              <SvgText
                x={labelWidth + barWidth + 8}
                y={y + barHeight / 2 + 4}
                fontSize={11}
                fontWeight="700"
                fill={Palette.ink}
              >
                {item.count}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [nearbySpots, setNearbySpots] = useState<NearbySpot[]>([]);
  const [spotsLoading, setSpotsLoading] = useState(true);
  const [profile, setProfile] = useState<StoreProfile | null>(null);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [salesData, setSalesData] = useState<SalesItem[]>([]);
  const {
    menuData,
    loading: menuLoading,
    refreshMenu,
  } = useContext(MenuContext);

  // 관리자가 메뉴 관리에서 "인기 메뉴 뱃지"를 켠 메뉴들을 그대로 "추천 메뉴"로
  // 보여줘요 — 카테고리 상관없이 전부 모아서, 최대 6개까지만 보여줍니다.
  const recommendedItems = Object.values(menuData)
    .flat()
    .filter((item) => item.isHot)
    .slice(0, 6);

  const load = useCallback(() => {
    getNearbySpots()
      .then(setNearbySpots)
      .catch(() => {})
      .finally(() => setSpotsLoading(false));

    getStoreProfile()
      .then(setProfile)
      .catch(() => {});

    getUpcomingClosedDates()
      .then(setClosedDates)
      .catch(() => {});

    getReviewStats()
      .then(setReviewStats)
      .catch(() => {});

    // 결제까지 완료된 예약·포장 주문에서 실제로 고른 메뉴 수량을 집계해서
    // 인기 메뉴 순위 차트로 보여줘요. 아직 한 번도 안 팔린 메뉴도 0개로
    // 항상 다 같이 보여주고, 많이 팔린 순으로 정렬한 다음 색깔을 입혀요.
    getMenuPopularity()
      .then((rows) => {
        const qtyByName = new Map<string, number>();
        rows.forEach((r) => {
          const name = getReservationMenuName(r.key) ?? r.key;
          qtyByName.set(name, (qtyByName.get(name) ?? 0) + r.quantity);
        });

        const named = KNOWN_MENU_NAMES.map((name) => ({
          name,
          count: qtyByName.get(name) ?? 0,
        }))
          .sort((a, b) => b.count - a.count)
          .map((item, idx) => ({
            ...item,
            color: SALES_COLORS[idx % SALES_COLORS.length],
          }));
        setSalesData(named);
      })
      .catch(() => setSalesData([]));

    refreshMenu();
  }, [refreshMenu]);

  // 이 화면에 들어올 때마다 새로 불러와요 — 관리자가 방금 영업시간, 휴무일,
  // 리뷰 통계 등을 바꿨어도 앱을 껐다 켜지 않고 바로 반영돼요.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const businessStatus = getBusinessStatus(profile, closedDates);

  const copyToClipboard = async () => {
    if (!profile) return;
    await Clipboard.setStringAsync(profile.address);
    Alert.alert("알림", "주소가 클립보드에 복사되었습니다.");
  };

  const makeCall = () => {
    if (!profile) return;
    Linking.openURL(`tel:${profile.phone}`).catch(() => {
      Alert.alert("에러", "전화 걸기 기능을 실행할 수 없습니다.");
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero / Dark header */}
        <View style={styles.hero}>
          <SafeAreaView edges={["top"]}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroEyebrow}>PALGONGSAN · SINCE 1996</Text>
              <View
                style={[
                  styles.statusBadge,
                  !businessStatus.isOpen && styles.statusBadgeClosed,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    !businessStatus.isOpen && styles.statusDotClosed,
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    !businessStatus.isOpen && styles.statusBadgeTextClosed,
                  ]}
                >
                  {businessStatus.isHoliday
                    ? "휴무"
                    : businessStatus.isOpen
                      ? "영업중"
                      : "영업종료"}
                </Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>팔공산{"\n"}성공식당</Text>
            <View style={styles.heroDivider} />
            <Text style={styles.heroSubtitle}>
              백숙 · 삼계탕 · 30년 전통의 깊이
            </Text>
            <Text style={styles.heroHoursText}>
              {businessStatus.isHoliday
                ? "오늘은 휴무일이에요"
                : `${businessStatus.todayLabel}요일 ${businessStatus.timeRangeText}`}
            </Text>

            <TouchableOpacity
              style={styles.searchBar}
              activeOpacity={0.8}
              onPress={() => router.push("/search" as any)}
            >
              <Ionicons name="search" size={16} color={Palette.inkFaint} />
              <Text style={styles.searchBarPlaceholder}>
                메뉴, 음료 검색...
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Summary card */}
        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => router.push("/home-info" as any)}
          activeOpacity={0.85}
        >
          <View style={styles.summaryStatRow}>
            <View style={styles.sourceTag}>
              <Text style={styles.sourceTagText}>앱</Text>
            </View>
            <Ionicons name="star" size={14} color={Palette.gold} />
            <Text style={styles.summaryStatText}>
              {reviewStats ? reviewStats.averageRating.toFixed(2) : "-"}
            </Text>
            <Text style={styles.summaryStatDivider}>|</Text>
            <Text style={styles.summaryStatText}>
              방문자 리뷰{" "}
              {reviewStats ? reviewStats.totalCount.toLocaleString() : "-"}
            </Text>
          </View>

          {(profile?.naverRating != null ||
            profile?.blogReviewCount != null) && (
            <View style={[styles.summaryStatRow, { marginTop: 6 }]}>
              <View style={[styles.sourceTag, styles.sourceTagNaver]}>
                <Text style={styles.sourceTagText}>N</Text>
              </View>
              {profile?.naverRating != null && (
                <>
                  <Ionicons name="star" size={14} color={Palette.gold} />
                  <Text style={styles.summaryStatText}>
                    {profile.naverRating.toFixed(2)}
                  </Text>
                  {profile.naverReviewCount != null && (
                    <>
                      <Text style={styles.summaryStatDivider}>|</Text>
                      <Text style={styles.summaryStatText}>
                        방문자 리뷰 {profile.naverReviewCount.toLocaleString()}
                      </Text>
                    </>
                  )}
                </>
              )}
              {profile?.blogReviewCount != null && (
                <>
                  {profile?.naverRating != null && (
                    <Text style={styles.summaryStatDivider}>|</Text>
                  )}
                  <Text style={styles.summaryStatText}>
                    블로그 {profile.blogReviewCount.toLocaleString()}
                  </Text>
                </>
              )}
            </View>
          )}

          <View style={[styles.summaryStatRow, { marginTop: 6 }]}>
            <Ionicons
              name="accessibility-outline"
              size={12}
              color={Palette.inkFaint}
            />
            <Text style={styles.summaryStatTextThin}>휠체어 출입 가능</Text>
            <Text style={styles.summaryStatDivider}>|</Text>
            <Text style={styles.summaryStatTextThin}>
              농림축산식품부 안심식당
            </Text>
          </View>

          <View style={styles.summaryContactRow}>
            <TouchableOpacity
              style={styles.summaryContactItem}
              onPress={copyToClipboard}
            >
              <Ionicons
                name="location-outline"
                size={14}
                color={Palette.amberDeep}
              />
              <Text style={styles.summaryContactText}>
                {profile?.address ?? "주소 불러오는 중..."}
              </Text>
              <Ionicons
                name="copy-outline"
                size={11}
                color={Palette.inkFaint}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.summaryContactItem}
              onPress={makeCall}
            >
              <Ionicons
                name="call-outline"
                size={14}
                color={Palette.amberDeep}
              />
              <Text style={styles.summaryContactText}>
                {profile?.phone ?? "-"}
              </Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.summaryArrowButton}
              onPress={() => router.push("/home-info" as any)}
            >
              <Ionicons
                name="chevron-forward"
                size={15}
                color={Palette.amberDeep}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Notice */}
        <View style={styles.noticeBox}>
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={Palette.amberDeep}
          />
          <Text style={styles.noticeText}>
            단체나 주말, 공휴일이라면 전화로 미리 예약해야 합니다.
          </Text>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>QUICK MENU</Text>
          <Text style={styles.sectionTitle}>카테고리</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: item.bgColor,
                    borderColor: item.borderColor,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => {
                  setSelectedCategory(item.id);
                  router.push(item.route as any);
                }}
              >
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
                <Text style={[styles.categoryText, { color: item.textColor }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recommended */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionEyebrow}>SIGNATURE</Text>
              <Text style={styles.sectionTitle}>추천 메뉴</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/menu" as any)}>
              <Text style={styles.seeAll}>자세히 보기 →</Text>
            </TouchableOpacity>
          </View>

          {menuLoading ? (
            <ActivityIndicator
              color={Palette.amberDeep}
              style={{ marginVertical: Spacing.lg }}
            />
          ) : recommendedItems.length === 0 ? (
            <Text style={styles.emptyRecommendText}>
              아직 등록된 추천 메뉴가 없어요. 관리자 메뉴 관리에서 "인기 메뉴
              뱃지"를 켜면 여기에 나와요.
            </Text>
          ) : (
            recommendedItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.foodCard}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: "/menu-detail",
                    params: { id: item.id },
                  } as any)
                }
              >
                {item.image ? (
                  <Image
                    source={resolveImageSource(item.image)}
                    style={styles.foodImage}
                  />
                ) : (
                  <View style={[styles.foodImage, styles.foodImagePlaceholder]}>
                    <Ionicons
                      name="restaurant-outline"
                      size={24}
                      color={Palette.inkFaint}
                    />
                  </View>
                )}
                <View style={styles.foodInfo}>
                  <View style={styles.foodHeader}>
                    <Text style={styles.foodName}>{item.name}</Text>
                    <View style={styles.ratingPill}>
                      <Ionicons name="flame" size={11} color={Palette.gold} />
                      <Text style={styles.foodRating}>인기</Text>
                    </View>
                  </View>
                  <View style={styles.foodPriceRow}>
                    <Text style={styles.foodPrice}>{item.price}</Text>
                    <View style={styles.repBadge}>
                      <Text style={styles.repBadgeText}>대표</Text>
                    </View>
                  </View>
                  <View style={styles.foodFooter}>
                    <View style={{ flex: 1 }} />
                    <View style={styles.chevronButton}>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={Palette.white}
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Sales Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>BEST SELLER</Text>
          <Text style={styles.sectionTitle}>인기 메뉴 순위</Text>

          {salesData.length === 0 ? (
            <View style={styles.chartWrapper}>
              <Text style={styles.emptyRecommendText}>
                아직 결제 완료된 주문이 없어요.{"\n"}주문이 쌓이면 실제 인기
                메뉴 순위가 여기에 나와요.
              </Text>
            </View>
          ) : (
            <>
              {/* Legend */}
              <View style={styles.legendGrid}>
                {salesData.map((item) => (
                  <View key={item.name} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={styles.legendText}>{item.name}</Text>
                  </View>
                ))}
              </View>

              {/* Chart */}
              <View style={styles.chartWrapper}>
                <HorizontalBarChart data={salesData} />
              </View>
            </>
          )}
        </View>

        {/* Nearby attractions */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>AROUND PALGONGSAN</Text>
          <Text style={styles.sectionTitle}>팔공산 근처 가볼만한 곳</Text>
          <Text style={styles.spotIntro}>
            식사 전후로 들러보기 좋은 팔공산 명소들이에요. 눌러서 자세히 보세요.
          </Text>

          {spotsLoading ? (
            <ActivityIndicator color={Palette.amberDeep} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.spotScrollContent}
            >
              {nearbySpots.map((spot) => (
                <TouchableOpacity
                  key={spot.id}
                  style={styles.spotCard}
                  activeOpacity={0.88}
                  onPress={() =>
                    router.push(`/spot-detail?id=${spot.id}` as any)
                  }
                >
                  {spot.imageUrl ? (
                    <>
                      <Image
                        source={{ uri: spot.imageUrl }}
                        style={styles.spotImage}
                      />
                      <View style={styles.spotOverlay}>
                        <Text style={styles.spotOverlayName} numberOfLines={1}>
                          {spot.name}
                        </Text>
                        <Text style={styles.spotOverlayDesc} numberOfLines={2}>
                          {spot.description}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.spotFallback}>
                      <View style={styles.spotIconCircle}>
                        <Ionicons
                          name={(spot.icon as any) || "location-outline"}
                          size={22}
                          color={Palette.amberDeep}
                        />
                      </View>
                      <Text style={styles.spotName} numberOfLines={1}>
                        {spot.name}
                      </Text>
                      <Text style={styles.spotDesc} numberOfLines={2}>
                        {spot.description}
                      </Text>
                    </View>
                  )}
                  <View style={styles.spotArrowBadge}>
                    <Ionicons
                      name="arrow-forward"
                      size={13}
                      color={Palette.white}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <BeforeYouVisit />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },

  /* Hero */
  hero: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  heroEyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(91,123,90,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  statusBadgeClosed: {
    backgroundColor: "rgba(162,62,62,0.16)",
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Palette.success,
  },
  statusDotClosed: {
    backgroundColor: Palette.error,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#A9C5A8",
  },
  statusBadgeTextClosed: {
    color: "#E3A6A6",
  },
  heroTitle: {
    color: Palette.cream,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 38,
    marginTop: Spacing.md,
  },
  heroDivider: {
    width: 36,
    height: 2,
    backgroundColor: Palette.gold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    color: "#C9BFAE",
    fontSize: 13,
  },
  heroHoursText: {
    color: "#9C9388",
    fontSize: 11,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    marginTop: Spacing.lg,
  },
  searchBarPlaceholder: {
    fontSize: 13,
    color: "#9C9388",
  },

  /* Summary card */
  summaryCard: {
    backgroundColor: Palette.white,
    marginHorizontal: Spacing.lg,
    marginTop: -24,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  summaryStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sourceTag: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: Palette.amberDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceTagNaver: { backgroundColor: "#03C75A" },
  sourceTagText: { fontSize: 9, fontWeight: "800", color: Palette.white },
  summaryStatText: {
    fontSize: 12,
    fontWeight: "600",
    color: Palette.ink,
  },
  summaryStatTextThin: {
    fontSize: 11,
    color: Palette.inkFaint,
  },
  summaryStatDivider: {
    color: Palette.line,
    fontSize: 12,
  },
  summaryArrowButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.amberSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  summaryContactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryContactText: {
    fontSize: 11,
    color: Palette.inkSoft,
    fontWeight: "600",
  },

  /* Notice */
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Palette.amberSoft,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: Palette.amberDeep,
    fontWeight: "600",
  },

  /* Section */
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: Spacing.md,
  },
  sectionEyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.md,
  },
  spotIntro: {
    fontSize: 12,
    color: Palette.inkFaint,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  spotScrollContent: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  spotCard: {
    width: 210,
    height: 150,
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: Palette.white,
    ...Shadow.tabBar,
  },
  spotImage: {
    width: "100%",
    height: "100%",
  },
  spotOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: "rgba(26,22,20,0.55)",
  },
  spotOverlayName: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.white,
    marginBottom: 2,
  },
  spotOverlayDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 15,
  },
  spotArrowBadge: {
    position: "absolute",
    top: Spacing.sm + 2,
    right: Spacing.sm + 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(26,22,20,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  spotFallback: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
  },
  spotIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.amberSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  spotName: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: 4,
  },
  spotDesc: {
    fontSize: 11,
    color: Palette.inkFaint,
    lineHeight: 16,
  },
  seeAll: {
    fontSize: 12,
    color: Palette.inkSoft,
    fontWeight: "600",
  },

  /* Categories */
  categoryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  categoryCard: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    ...Shadow.card,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700",
  },

  /* Food cards */
  foodCard: {
    flexDirection: "row",
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 4,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  foodImage: {
    width: 92,
    height: 92,
    borderRadius: Radius.md,
  },
  foodImagePlaceholder: {
    backgroundColor: Palette.creamDim,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyRecommendText: {
    fontSize: 12.5,
    color: Palette.inkFaint,
    lineHeight: 18,
    paddingVertical: Spacing.md,
  },
  foodInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "space-between",
  },
  foodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodName: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
    flexShrink: 1,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  foodRating: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.ink,
  },
  foodPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  foodPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  repBadge: {
    borderWidth: 1,
    borderColor: Palette.amber,
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  repBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  foodFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  chevronButton: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: Palette.amber,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Sales chart */
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: Palette.inkSoft,
    fontWeight: "500",
  },
  chartWrapper: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    ...Shadow.card,
    overflow: "hidden",
  },
});
