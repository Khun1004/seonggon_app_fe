// app/admin/(tabs)/revenue.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useContext, useMemo, useState } from "react";
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
import { AdminReservation, getAdminReservations } from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

type PeriodType = "day" | "week" | "month" | "year";

const PERIOD_OPTIONS: { key: PeriodType; label: string; count: number }[] = [
  { key: "day", label: "일별", count: 7 },
  { key: "week", label: "주별", count: 8 },
  { key: "month", label: "월별", count: 12 },
  { key: "year", label: "연도별", count: 5 },
];

function formatWon(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

// 그 날짜가 속한 "구간"을 나타내는 키를 만들어줍니다 (같은 주/달/해면 같은 키).
function periodKey(date: Date, type: PeriodType): string {
  if (type === "day") {
    return date.toISOString().slice(0, 10);
  }
  if (type === "week") {
    const d = new Date(date);
    const day = d.getDay() || 7; // 월요일=1 ~ 일요일=7
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - day + 1); // 그 주의 월요일로
    return d.toISOString().slice(0, 10);
  }
  if (type === "month") {
    return date.toISOString().slice(0, 7);
  }
  return String(date.getFullYear());
}

// 구간 키를 화면에 보여줄 짧은 라벨로 바꿔줍니다.
function periodLabel(key: string, type: PeriodType): string {
  if (type === "day") {
    const d = new Date(key);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  if (type === "week") {
    const d = new Date(key);
    return `${d.getMonth() + 1}/${d.getDate()}주`;
  }
  if (type === "month") {
    const [, m] = key.split("-");
    return `${Number(m)}월`;
  }
  return `${key}년`;
}

// 오늘을 기준으로, 요청한 구간 타입에서 최근 N개의 구간 키를 과거→현재 순으로 만듭니다.
function recentPeriodKeys(type: PeriodType, count: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (type === "day") d.setDate(d.getDate() - i);
    else if (type === "week") d.setDate(d.getDate() - i * 7);
    else if (type === "month") d.setMonth(d.getMonth() - i);
    else d.setFullYear(d.getFullYear() - i);
    keys.push(periodKey(d, type));
  }
  // 중복 제거하면서 순서 유지 (월/년은 여러 날짜가 같은 키로 겹칠 수 있어서)
  return Array.from(new Set(keys));
}

export default function AdminRevenue() {
  const { adminPassword } = useContext(AdminContext);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<PeriodType>("day");

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminReservations(adminPassword)
      .then(setReservations)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const paidReservations = useMemo(
    () => reservations.filter((r) => r.paymentStatus === "PAID" && r.paidAt),
    [reservations],
  );

  const { buckets, currentTotal, previousTotal, changePct } = useMemo(() => {
    const option = PERIOD_OPTIONS.find((o) => o.key === periodType)!;
    const keys = recentPeriodKeys(periodType, option.count);

    const sums: Record<string, number> = {};
    for (const key of keys) sums[key] = 0;

    for (const r of paidReservations) {
      const key = periodKey(new Date(r.paidAt!), periodType);
      if (key in sums) {
        sums[key] += r.paidAmount ?? 0;
      }
    }

    const bucketList = keys.map((key) => ({
      key,
      label: periodLabel(key, periodType),
      amount: sums[key],
    }));

    const current = bucketList[bucketList.length - 1]?.amount ?? 0;
    const previous = bucketList[bucketList.length - 2]?.amount ?? 0;
    const pct =
      previous === 0
        ? current > 0
          ? 100
          : 0
        : Math.round(((current - previous) / previous) * 100);

    return {
      buckets: bucketList,
      currentTotal: current,
      previousTotal: previous,
      changePct: pct,
    };
  }, [paidReservations, periodType]);

  const maxAmount = Math.max(...buckets.map((b) => b.amount), 1);

  const periodNoun =
    periodType === "day"
      ? "오늘"
      : periodType === "week"
        ? "이번 주"
        : periodType === "month"
          ? "이번 달"
          : "올해";
  const prevNoun =
    periodType === "day"
      ? "어제"
      : periodType === "week"
        ? "지난주"
        : periodType === "month"
          ? "지난달"
          : "작년";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View>
            <Text style={styles.eyebrow}>REVENUE</Text>
            <Text style={styles.headerTitle}>매출 분석</Text>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.periodRow}>
        {PERIOD_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.periodTab,
              periodType === opt.key && styles.periodTabActive,
            ]}
            onPress={() => setPeriodType(opt.key)}
          >
            <Text
              style={[
                styles.periodTabText,
                periodType === opt.key && styles.periodTabTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Palette.amberDeep} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{periodNoun} 매출</Text>
            <Text style={styles.summaryAmount}>{formatWon(currentTotal)}</Text>
            <View style={styles.compareRow}>
              <Ionicons
                name={
                  changePct > 0
                    ? "trending-up"
                    : changePct < 0
                      ? "trending-down"
                      : "remove"
                }
                size={15}
                color={
                  changePct > 0
                    ? Palette.success
                    : changePct < 0
                      ? Palette.error
                      : Palette.inkFaint
                }
              />
              <Text
                style={[
                  styles.compareText,
                  {
                    color:
                      changePct > 0
                        ? Palette.success
                        : changePct < 0
                          ? Palette.error
                          : Palette.inkFaint,
                  },
                ]}
              >
                {prevNoun} 대비 {changePct > 0 ? "+" : ""}
                {changePct}%
              </Text>
              <Text style={styles.comparePrev}>
                ({prevNoun} {formatWon(previousTotal)})
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>최근 추이</Text>
          <View style={styles.chartCard}>
            <View style={styles.barRow}>
              {buckets.map((b) => (
                <View key={b.key} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max((b.amount / maxAmount) * 100, b.amount > 0 ? 4 : 0)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel} numberOfLines={1}>
                    {b.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>구간별 상세</Text>
          {[...buckets].reverse().map((b) => (
            <View key={b.key} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{b.label}</Text>
              <Text style={styles.detailAmount}>{formatWon(b.amount)}</Text>
            </View>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
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
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Palette.cream },
  periodRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  periodTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
    backgroundColor: Palette.creamDim,
  },
  periodTabActive: { backgroundColor: Palette.charcoal },
  periodTabText: { fontSize: 12.5, fontWeight: "700", color: Palette.inkSoft },
  periodTabTextActive: { color: Palette.cream },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: Spacing.lg },
  summaryCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  summaryLabel: { fontSize: 13, color: Palette.inkFaint, marginBottom: 4 },
  summaryAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: Palette.ink,
    marginBottom: Spacing.sm,
  },
  compareRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  compareText: { fontSize: 13, fontWeight: "700" },
  comparePrev: { fontSize: 12, color: Palette.inkFaint, marginLeft: 2 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Palette.ink,
    marginBottom: Spacing.sm,
  },
  chartCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 140,
    gap: 6,
  },
  barColumn: { flex: 1, alignItems: "center", height: "100%" },
  barTrack: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.sm,
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    backgroundColor: Palette.amberDeep,
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
  },
  barLabel: {
    fontSize: 9.5,
    color: Palette.inkFaint,
    marginTop: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    marginBottom: 6,
    ...Shadow.card,
  },
  detailLabel: { fontSize: 13, fontWeight: "700", color: Palette.ink },
  detailAmount: { fontSize: 13, fontWeight: "700", color: Palette.amberDeep },
});
