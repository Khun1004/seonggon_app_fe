// app/admin/components/reservation-overview/reservation-overview.tsx
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

import { AdminContext } from "@/components/contexts/AdminContext";
import { AdminReservation, getAdminReservations } from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

const STAMP_RED = "#B23A2E"; // 방문 도장이랑 같은 전통 인주 색

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function formatDateLabel(dateStr: string) {
  if (dateStr === todayStr()) return "오늘";
  const d = new Date(`${dateStr}T00:00:00`);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${dateStr} (${weekdays[d.getDay()]})`;
}

function shortDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${m}.${d}`;
}

export default function AdminReservationOverview() {
  const router = useRouter();
  const { adminPassword } = useContext(AdminContext);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);

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

  const today = todayStr();
  // 취소된 건 아예 빼고, 지나간 날짜도 빼고, 남은 것만 날짜별로 묶어요.
  const activeReservations = reservations.filter(
    (r) => r.status !== "CANCELLED" && r.date >= today,
  );

  const groupsByDate = new Map<string, AdminReservation[]>();
  for (const r of activeReservations) {
    if (!groupsByDate.has(r.date)) groupsByDate.set(r.date, []);
    groupsByDate.get(r.date)!.push(r);
  }
  const sortedDates = Array.from(groupsByDate.keys()).sort();

  const dineInTotal = activeReservations.filter(
    (r) => r.date === today && r.type !== "TAKEOUT",
  ).length;
  const takeoutTotal = activeReservations.filter(
    (r) => r.date === today && r.type === "TAKEOUT",
  ).length;

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
          {/* 장부 표지처럼 — 도장 두 개로 전체 현황을 보여줘요 */}
          <View style={styles.ledgerHeader}>
            <Text style={styles.ledgerEyebrow}>RESERVATION LEDGER</Text>
            <Text style={styles.ledgerTitle}>오늘의 예약 장부</Text>
            <View style={styles.stampRow}>
              <View style={styles.stampItem}>
                <View style={styles.stampCircle}>
                  <Text style={styles.stampNumber}>{dineInTotal}</Text>
                  <Text style={styles.stampUnit}>팀</Text>
                </View>
                <Text style={styles.stampLabel}>방문 예약</Text>
              </View>
              <View style={styles.stampDivider} />
              <View style={styles.stampItem}>
                <View style={styles.stampCircle}>
                  <Text style={styles.stampNumber}>{takeoutTotal}</Text>
                  <Text style={styles.stampUnit}>건</Text>
                </View>
                <Text style={styles.stampLabel}>포장 주문</Text>
              </View>
            </View>
          </View>

          {sortedDates.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons
                name="calendar-outline"
                size={40}
                color={Palette.line}
              />
              <Text style={styles.emptyText}>예정된 예약이 없습니다.</Text>
            </View>
          ) : (
            sortedDates.map((date) => {
              const dayList = groupsByDate.get(date)!;
              const dineIn = dayList.filter((r) => r.type !== "TAKEOUT").length;
              const takeout = dayList.filter(
                (r) => r.type === "TAKEOUT",
              ).length;
              const isToday = date === today;

              return (
                <TouchableOpacity
                  key={date}
                  style={[styles.ticket, isToday && styles.ticketToday]}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(
                      `/admin/reservation-date-detail?date=${date}` as any,
                    )
                  }
                >
                  {/* 티켓 왼쪽 — 날짜 스텁 */}
                  <View style={styles.ticketStub}>
                    {isToday ? (
                      <Text style={styles.ticketStubTodayText}>오늘</Text>
                    ) : (
                      <>
                        <Text style={styles.ticketStubDate}>
                          {shortDate(date)}
                        </Text>
                        <Text style={styles.ticketStubWeekday}>
                          {
                            ["일", "월", "화", "수", "목", "금", "토"][
                              new Date(`${date}T00:00:00`).getDay()
                            ]
                          }
                        </Text>
                      </>
                    )}
                  </View>

                  {/* 톱니 절취선 */}
                  <View style={styles.perforation}>
                    <View style={styles.perfDot} />
                    <View style={styles.perfLine} />
                    <View style={styles.perfDot} />
                  </View>

                  {/* 오른쪽 — 내용 */}
                  <View style={styles.ticketBody}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketTitle}>
                        {formatDateLabel(date)} 예약
                      </Text>
                      <View style={styles.ticketCountRow}>
                        <Ionicons
                          name="restaurant-outline"
                          size={12}
                          color={Palette.amberDeep}
                        />
                        <Text style={styles.ticketCountText}>{dineIn}팀</Text>
                        <Ionicons
                          name="bag-handle-outline"
                          size={12}
                          color={Palette.amberDeep}
                          style={{ marginLeft: 8 }}
                        />
                        <Text style={styles.ticketCountText}>{takeout}건</Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={Palette.inkFaint}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { padding: Spacing.lg },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: Spacing.sm,
  },
  emptyText: { color: Palette.inkFaint, fontSize: 13 },

  // 장부 표지
  ledgerHeader: {
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  ledgerEyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 4,
  },
  ledgerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Palette.cream,
    marginBottom: Spacing.lg,
  },
  stampRow: { flexDirection: "row", alignItems: "center" },
  stampItem: { alignItems: "center", gap: Spacing.sm, width: 100 },
  stampDivider: {
    width: 1,
    height: 70,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  stampCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: STAMP_RED,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-6deg" }],
  },
  stampNumber: { fontSize: 22, fontWeight: "800", color: STAMP_RED },
  stampUnit: {
    fontSize: 10,
    fontWeight: "700",
    color: STAMP_RED,
    marginTop: -2,
  },
  stampLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "rgba(251,246,238,0.75)",
  },

  // 티켓형 날짜 카드
  ticket: {
    flexDirection: "row",
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
    ...Shadow.card,
  },
  ticketToday: {
    borderWidth: 2,
    borderColor: Palette.gold,
  },
  ticketStub: {
    width: 66,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.amberSoft,
    paddingVertical: Spacing.md,
  },
  ticketStubDate: { fontSize: 17, fontWeight: "800", color: Palette.amberDeep },
  ticketStubWeekday: { fontSize: 11, color: Palette.amberDeep, marginTop: 2 },
  ticketStubTodayText: {
    fontSize: 15,
    fontWeight: "800",
    color: Palette.amberDeep,
  },
  perforation: {
    width: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  perfDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.cream,
    marginHorizontal: -4,
  },
  perfLine: {
    flex: 1,
    width: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: Palette.line,
    marginVertical: 2,
  },
  ticketBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  ticketTitle: { fontSize: 14, fontWeight: "800", color: Palette.ink },
  ticketCountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 3,
  },
  ticketCountText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: Palette.inkSoft,
  },
});
