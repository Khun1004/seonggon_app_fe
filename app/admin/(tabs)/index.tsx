// app/admin/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdminContext } from "@/components/contexts/AdminContext";
import { getAdminReservations } from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

type HomeLinkItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  onPress: () => void;
};

export default function AdminHome() {
  const router = useRouter();
  const { isAdmin, loading, adminPassword, logout } = useContext(AdminContext);

  // "예약 확인" 요약 카드에 쓰이는 숫자 — 취소된 건 빼고 셉니다.
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [dineInCount, setDineInCount] = useState(0);
  const [takeoutCount, setTakeoutCount] = useState(0);

  // 오늘 날짜 배지에 쓰는 값들
  const now = new Date();
  const stampMonth = now.getMonth() + 1;
  const stampDay = now.getDate();
  const stampYear = now.getFullYear();

  useFocusEffect(
    useCallback(() => {
      if (!adminPassword) return;
      setSummaryLoading(true);
      getAdminReservations(adminPassword)
        .then((all) => {
          const d = new Date();
          const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const active = all.filter(
            (r) => r.status !== "CANCELLED" && r.date === today,
          );
          setDineInCount(active.filter((r) => r.type !== "TAKEOUT").length);
          setTakeoutCount(active.filter((r) => r.type === "TAKEOUT").length);
        })
        .catch(() => {})
        .finally(() => setSummaryLoading(false));
    }, [adminPassword]),
  );

  // 손님 홈 화면과 똑같은 5개 카테고리 — 손님용 카테고리 색을 그대로 써서
  // "같은 카테고리인데 관리자용"이라는 게 한눈에 느껴지도록 했어요.
  const ADMIN_CATEGORIES = [
    {
      id: "1",
      name: "메뉴",
      icon: "restaurant-outline" as const,
      bgColor: "#FFF3DC",
      iconColor: "#854F0B",
      textColor: "#854F0B",
      borderColor: "#FAC775",
      onPress: () => router.push("/admin/menu" as any),
    },
    {
      id: "2",
      name: "음료/주류",
      icon: "beer-outline" as const,
      bgColor: "#E6F1FB",
      iconColor: "#185FA5",
      textColor: "#185FA5",
      borderColor: "#85B7EB",
      onPress: () => router.push("/admin/menu?group=drinks" as any),
    },
    {
      id: "3",
      name: "쿠폰",
      icon: "pricetag-outline" as const,
      bgColor: "#FBEAF0",
      iconColor: "#993556",
      textColor: "#993556",
      borderColor: "#ED93B1",
      onPress: () => router.push("/admin/coupons" as any),
    },
    {
      id: "4",
      name: "예약",
      icon: "calendar-outline" as const,
      bgColor: "#EAF3DE",
      iconColor: "#3B6D11",
      textColor: "#3B6D11",
      borderColor: "#97C459",
      onPress: () =>
        router.push("/admin/reservation-create?type=dine_in" as any),
    },
    {
      id: "5",
      name: "포장",
      icon: "bag-handle-outline" as const,
      bgColor: "#F3E8FB",
      iconColor: "#6B3FA0",
      textColor: "#6B3FA0",
      borderColor: "#C6A6EA",
      onPress: () =>
        router.push("/admin/reservation-create?type=takeout" as any),
    },
  ];

  // 손님 홈 화면의 섹션들을 관리자가 각각 눌러서 바로 수정하러 갈 수 있는
  // 바로가기 목록이에요.
  const HOME_LINKS: HomeLinkItem[] = [
    {
      icon: "time-outline",
      label: "예약 시간 설정",
      sub: "매장 예약·포장 각각 가능 시간과 간격을 정해요",
      onPress: () => router.push("/admin/reservation-times" as any),
    },
    {
      icon: "trophy-outline",
      label: "인기 메뉴 순위",
      sub: "예약·포장 주문 데이터로 실제 순위를 보여줘요",
      onPress: () => router.push("/admin/menu-popularity" as any),
    },
    {
      icon: "book-outline",
      label: "성공식당의 상세",
      sub: "영업시간·주소·전화번호 수정, 휴무일 등록",
      onPress: () => router.push("/admin/store-profile" as any),
    },
    {
      icon: "location-outline",
      label: "주변 명소 관리",
      sub: "팔공산 근처 가볼만한 곳을 추가·수정해요",
      onPress: () => router.push("/admin/nearby-spots" as any),
    },
    {
      icon: "reader-outline",
      label: "리뷰 작성법 관리",
      sub: "리뷰 작성법 화면의 단계별 안내를 수정해요",
      onPress: () => router.push("/admin/review-guide" as any),
    },
    {
      icon: "happy-outline",
      label: "리뷰 선택지 관리",
      sub: '"어떤 점이 좋았나요?" 선택지를 추가·수정해요',
      onPress: () => router.push("/admin/review-good-points" as any),
    },
    {
      icon: "fast-food-outline",
      label: "리뷰 메뉴 목록 관리",
      sub: '"어떤 메뉴를 드셨나요?" 목록을 추가·수정해요',
      onPress: () => router.push("/admin/review-menu-options" as any),
    },
    {
      icon: "trophy-outline",
      label: "방문 도장 설정",
      sub: "몇 번 방문하면 무엇을 드릴지 정해요",
      onPress: () => router.push("/admin/visit-stamp-settings" as any),
    },
    {
      icon: "cash-outline",
      label: "리뷰 적립 교환 메뉴",
      sub: "적립금(1,500원)으로 바꿀 수 있는 메뉴를 관리해요",
      onPress: () => router.push("/admin/reward-redeemable-items" as any),
    },
    {
      icon: "leaf-outline",
      label: "재료 세트 관리",
      sub: "여러 메뉴가 함께 쓰는 재료 목록을 관리해요",
      onPress: () => router.push("/admin/ingredient-sets" as any),
    },
  ];

  useFocusEffect(
    useCallback(() => {
      if (!loading && !isAdmin) {
        router.replace("/admin/login" as any);
      }
    }, [loading, isAdmin]),
  );

  const handleLogout = () => {
    Alert.alert("로그아웃", "관리자 화면에서 로그아웃 하시겠어요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/admin/login" as any);
        },
      },
    ]);
  };

  if (!isAdmin) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>OWNER DASHBOARD</Text>
              <Text style={styles.headerTitle}>사장님 관리자</Text>
            </View>
            <View style={styles.headerBtnRow}>
              <TouchableOpacity onPress={handleLogout} hitSlop={8}>
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color="rgba(251,246,238,0.7)"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)" as any)}
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color={Palette.cream} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionEyebrow}>QUICK MENU</Text>
        <Text style={styles.sectionTitle}>바로가기</Text>
        <View style={styles.categoryGrid}>
          {ADMIN_CATEGORIES.map((item) => (
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
              onPress={item.onPress}
            >
              <Ionicons name={item.icon} size={20} color={item.iconColor} />
              <Text style={[styles.categoryText, { color: item.textColor }]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.overviewCard}
          activeOpacity={0.88}
          onPress={() => router.push("/admin/reservation-overview" as any)}
        >
          <View style={styles.overviewStampWrap}>
            <View style={styles.overviewStampCircle}>
              <Text style={styles.overviewStampToday}>오늘</Text>
              <Text style={styles.overviewStampDate}>
                {stampMonth}월 {stampDay}일
              </Text>
              <Text style={styles.overviewStampYear}>{stampYear}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.overviewEyebrow}>RESERVATION LEDGER</Text>
            <Text style={styles.overviewTitle}>예약 확인</Text>
            {summaryLoading ? (
              <ActivityIndicator
                size="small"
                color={Palette.gold}
                style={{ alignSelf: "flex-start", marginTop: 6 }}
              />
            ) : (
              <>
                <Text style={styles.overviewLabel}>오늘의 예약</Text>
                <View style={styles.overviewCountRow}>
                  <View style={styles.overviewCountItem}>
                    <Ionicons
                      name="restaurant"
                      size={12}
                      color={Palette.gold}
                    />
                    <Text style={styles.overviewSub}>{dineInCount}팀</Text>
                  </View>
                  <View style={styles.overviewCountItem}>
                    <Ionicons
                      name="bag-handle"
                      size={12}
                      color={Palette.gold}
                    />
                    <Text style={styles.overviewSub}>{takeoutCount}건</Text>
                  </View>
                </View>
              </>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={Palette.gold} />
        </TouchableOpacity>

        <Text style={[styles.sectionEyebrow, { marginTop: Spacing.xl }]}>
          HOME SCREEN
        </Text>
        <Text style={styles.sectionTitle}>손님 홈 화면 관리</Text>

        <View style={styles.linkList}>
          {HOME_LINKS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.linkRow}
              activeOpacity={0.8}
              onPress={item.onPress}
            >
              <View style={styles.linkIconWrap}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={Palette.amberDeep}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkLabel}>{item.label}</Text>
                <Text style={styles.linkSub}>{item.sub}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={Palette.inkFaint}
              />
            </TouchableOpacity>
          ))}
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
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: Spacing.sm,
  },
  headerBtnRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: Palette.cream },
  scrollContent: { padding: Spacing.lg },
  categoryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: Spacing.sm,
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
  categoryText: { fontSize: 10, fontWeight: "700" },
  overviewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    ...Shadow.card,
  },
  overviewStampWrap: { alignItems: "center", justifyContent: "center" },
  overviewStampCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFF3DC",
    borderWidth: 1.5,
    borderColor: "#FAC775",
    alignItems: "center",
    justifyContent: "center",
  },
  overviewStampToday: {
    fontSize: 9,
    fontWeight: "800",
    color: "#854F0B",
    letterSpacing: 0.2,
  },
  overviewStampDate: {
    fontSize: 10,
    fontWeight: "700",
    color: "#854F0B",
    marginTop: 1,
  },
  overviewStampYear: {
    fontSize: 7.5,
    fontWeight: "600",
    color: "#A9762E",
    marginTop: 1,
  },
  overviewEyebrow: {
    color: Palette.gold,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  overviewTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Palette.cream,
    marginTop: 2,
  },
  overviewLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "rgba(251,246,238,0.65)",
    marginTop: 4,
  },
  overviewCountRow: { flexDirection: "row", gap: Spacing.md, marginTop: 4 },
  overviewCountItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  overviewSub: {
    fontSize: 12,
    color: "rgba(251,246,238,0.85)",
    fontWeight: "700",
  },
  sectionEyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Palette.ink,
    marginBottom: Spacing.sm,
  },
  linkList: { gap: Spacing.sm },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 4,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  linkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Palette.amberSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  linkLabel: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  linkSub: { fontSize: 11.5, color: Palette.inkFaint, marginTop: 2 },
});
