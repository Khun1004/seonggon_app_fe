// app/admin/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useContext } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdminContext } from "@/components/contexts/AdminContext";
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
      onPress: () => router.push("/admin/menu" as any),
    },
    {
      id: "3",
      name: "쿠폰",
      icon: "pricetag-outline" as const,
      bgColor: "#FBEAF0",
      iconColor: "#993556",
      textColor: "#993556",
      borderColor: "#ED93B1",
      onPress: () =>
        Alert.alert("알림", "쿠폰 관리 기능은 준비 중이에요. 곧 만나요!"),
    },
    {
      id: "4",
      name: "예약",
      icon: "calendar-outline" as const,
      bgColor: "#EAF3DE",
      iconColor: "#3B6D11",
      textColor: "#3B6D11",
      borderColor: "#97C459",
      onPress: () => router.push("/admin/reservations" as any),
    },
    {
      id: "5",
      name: "포장",
      icon: "bag-handle-outline" as const,
      bgColor: "#F3E8FB",
      iconColor: "#6B3FA0",
      textColor: "#6B3FA0",
      borderColor: "#C6A6EA",
      onPress: () => router.push("/admin/reservations" as any),
    },
  ];

  // 손님 홈 화면의 섹션들을 관리자가 각각 눌러서 바로 수정하러 갈 수 있는
  // 바로가기 목록이에요.
  const HOME_LINKS: HomeLinkItem[] = [
    {
      icon: "trophy-outline",
      label: "인기 메뉴 순위",
      sub: "예약·포장 주문 데이터로 실제 순위를 보여줘요",
      onPress: () => router.push("/admin/menu-popularity" as any),
    },
    {
      icon: "information-circle-outline",
      label: "방문 전 알아두세요",
      sub: "손님 홈 화면에 보이는 안내 문구를 수정해요",
      onPress: () => router.push("/admin/info" as any),
    },
    {
      icon: "book-outline",
      label: "성공식당의 상세",
      sub: "소개, 성공식당의 맛 문구를 수정해요",
      onPress: () => router.push("/admin/info" as any),
    },
    {
      icon: "location-outline",
      label: "주변 명소 관리",
      sub: "팔공산 근처 가볼만한 곳을 추가·수정해요",
      onPress: () => router.push("/admin/nearby-spots" as any),
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
