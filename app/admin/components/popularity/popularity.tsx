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
import { getMenuPopularity, MenuPopularityRow } from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";
import { getReservationMenuName } from "@/constants/reservation-menu-data";

export default function AdminMenuPopularity() {
  const { adminPassword } = useContext(AdminContext);
  const [rows, setRows] = useState<MenuPopularityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getMenuPopularity(adminPassword)
      .then(setRows)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const maxQty = Math.max(...rows.map((r) => r.quantity), 1);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Palette.amberDeep} />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="bar-chart-outline" size={44} color={Palette.line} />
          <Text style={styles.emptyText}>
            아직 예약·포장 주문 기록이 없어요.{"\n"}주문이 쌓이면 여기에 순위가
            나와요.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.hint}>
            예약·포장 주문에서 실제로 골라주신 메뉴 수량을 합산한 순위예요.
          </Text>

          {rows.map((row, idx) => {
            const name = getReservationMenuName(row.key) ?? row.key;
            const widthPct = (row.quantity / maxQty) * 100;
            return (
              <View key={row.key} style={styles.row}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTopLine}>
                    <Text style={styles.menuName} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={styles.qtyText}>{row.quantity}개</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.max(widthPct, 4)}%` },
                        idx === 0 && styles.barFillTop,
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}

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
  emptyText: {
    fontSize: 13,
    color: Palette.inkFaint,
    textAlign: "center",
    lineHeight: 19,
  },
  scrollContent: { padding: Spacing.lg },
  hint: {
    fontSize: 12,
    color: Palette.inkFaint,
    lineHeight: 17,
    marginBottom: Spacing.lg,
  },
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
  barFillTop: {
    backgroundColor: Palette.amberDeep,
  },
});
