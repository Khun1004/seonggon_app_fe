// app/admin/components/popularity/popularity.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AdminContext } from "@/components/contexts/AdminContext";
import { getPaidMenuPopularity, MenuPopularityRow } from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";
import { getReservationMenuName } from "@/constants/reservation-menu-data";

// 사장님이 보고 싶어하시는 정확한 메뉴 목록 — 실제로 주문이 없어도 0개로
// 항상 다 보여줘요. 카테고리별로 묶어서 순위를 매겨요.
const CATEGORIES: { title: string; icon: string; names: string[] }[] = [
  {
    title: "백숙",
    icon: "restaurant",
    names: ["능이오리백숙", "능이닭백숙", "닭백숙", "오리백숙"],
  },
  {
    title: "고기",
    icon: "flame",
    names: ["산더미 오리간장불고기", "유황오리생불고기", "유황오리로스구이"],
  },
  {
    title: "기타",
    icon: "leaf",
    names: ["해물파전", "도토리묵"],
  },
];

const MEDAL_COLORS = ["#D4AF37", "#B8B8B8", "#B2703A"]; // 금, 은, 동

export default function AdminMenuPopularity() {
  const { adminPassword } = useContext(AdminContext);
  const [rows, setRows] = useState<MenuPopularityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getPaidMenuPopularity(adminPassword)
      .then(setRows)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // key -> 실제 메뉴 이름으로 바꾸고, 이름별로 합산해요.
  const qtyByName = new Map<string, number>();
  for (const row of rows) {
    const name = getReservationMenuName(row.key) ?? row.key;
    qtyByName.set(name, (qtyByName.get(name) ?? 0) + row.quantity);
  }

  const totalPaid = rows.reduce((sum, r) => sum + r.quantity, 0);

  // 전체(모든 카테고리 합쳐서) 순위 매길 때 쓸 정렬된 목록
  const allNamed = CATEGORIES.flatMap((c) => c.names).map((name) => ({
    name,
    quantity: qtyByName.get(name) ?? 0,
  }));
  const sortedForRank = [...allNamed].sort((a, b) => b.quantity - a.quantity);
  const rankOf = (name: string) =>
    sortedForRank.findIndex((r) => r.name === name);
  const maxQty = Math.max(...allNamed.map((r) => r.quantity), 1);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Palette.amberDeep} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 결제 완료 요약 배너 */}
          <View style={styles.summaryBanner}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="checkmark-circle" size={22} color="#2E7D32" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryEyebrow}>PAID ORDERS ONLY</Text>
              <Text style={styles.summaryTitle}>결제 완료 기준 메뉴 순위</Text>
            </View>
            <View style={styles.summaryTotalBox}>
              <Text style={styles.summaryTotalNum}>{totalPaid}</Text>
              <Text style={styles.summaryTotalUnit}>개</Text>
            </View>
          </View>

          {CATEGORIES.map((category) => (
            <View key={category.title} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Ionicons
                  name={category.icon as any}
                  size={15}
                  color={Palette.amberDeep}
                />
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </View>

              {category.names.map((name) => {
                const quantity = qtyByName.get(name) ?? 0;
                const rank = rankOf(name);
                const widthPct = (quantity / maxQty) * 100;
                const isTop3 = quantity > 0 && rank < 3;

                return (
                  <View key={name} style={styles.row}>
                    <View
                      style={[
                        styles.rankBadge,
                        isTop3 && {
                          backgroundColor: MEDAL_COLORS[rank],
                        },
                      ]}
                    >
                      {isTop3 ? (
                        <Ionicons
                          name="trophy"
                          size={13}
                          color={Palette.white}
                        />
                      ) : (
                        <Text style={styles.rankText}>{rank + 1}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.rowTopLine}>
                        <Text style={styles.menuName} numberOfLines={1}>
                          {name}
                        </Text>
                        <Text
                          style={[
                            styles.qtyText,
                            quantity === 0 && styles.qtyTextZero,
                          ]}
                        >
                          {quantity}개
                        </Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${Math.max(widthPct, 3)}%` },
                            isTop3 && {
                              backgroundColor: MEDAL_COLORS[rank],
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          <View style={styles.hintBox}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={Palette.inkFaint}
            />
            <Text style={styles.hintText}>
              결제까지 완료된 예약·포장 주문에서 실제로 고른 메뉴 수량만
              집계해요. 미결제·취소 건은 포함되지 않아요.
            </Text>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  scrollContent: { padding: Spacing.lg },

  summaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 4,
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(46,125,50,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryEyebrow: {
    color: Palette.gold,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  summaryTitle: { fontSize: 14, fontWeight: "800", color: Palette.cream },
  summaryTotalBox: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  summaryTotalNum: { fontSize: 22, fontWeight: "800", color: Palette.gold },
  summaryTotalUnit: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(251,246,238,0.7)",
  },

  categorySection: { marginBottom: Spacing.lg },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.sm,
  },
  categoryTitle: { fontSize: 13, fontWeight: "800", color: Palette.ink },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 4,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.creamDim,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 13, fontWeight: "800", color: Palette.inkSoft },
  rowTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  menuName: { fontSize: 14, fontWeight: "700", color: Palette.ink, flex: 1 },
  qtyText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.amberDeep,
    marginLeft: Spacing.sm,
  },
  qtyTextZero: { color: Palette.inkFaint },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.creamDim,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: Palette.amber,
  },

  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Palette.creamDim,
    padding: Spacing.sm + 4,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    color: Palette.inkFaint,
    lineHeight: 16,
  },
});
