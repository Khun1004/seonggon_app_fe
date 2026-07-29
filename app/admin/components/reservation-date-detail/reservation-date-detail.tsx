// app/admin/components/reservation-date-detail/reservation-date-detail.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { getReservationMenuName } from "@/constants/reservation-menu-data";

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

export default function AdminReservationDateDetail() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { adminPassword } = useContext(AdminContext);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminReservation | null>(null);

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

  const dayList = reservations
    .filter((r) => r.status !== "CANCELLED" && r.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));

  const dineInCount = dayList.filter((r) => r.type !== "TAKEOUT").length;
  const takeoutCount = dayList.filter((r) => r.type === "TAKEOUT").length;

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
          <View
            style={[
              styles.titleBanner,
              date === todayStr() && styles.titleBannerToday,
            ]}
          >
            {date === todayStr() && (
              <View style={styles.todayRibbon}>
                <Ionicons name="today" size={12} color={Palette.white} />
                <Text style={styles.todayRibbonText}>TODAY</Text>
              </View>
            )}
            <Ionicons
              name="calendar"
              size={22}
              color={date === todayStr() ? Palette.white : Palette.amberDeep}
            />
            <Text
              style={[
                styles.dateTitle,
                date === todayStr() && styles.dateTitleToday,
              ]}
            >
              {formatDateLabel(date)} 예약
            </Text>
            <Text
              style={[
                styles.dateSubTitle,
                date === todayStr() && styles.dateSubTitleToday,
              ]}
            >
              예약 {dineInCount}팀 · 포장 {takeoutCount}건
            </Text>
          </View>

          {dayList.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons
                name="calendar-outline"
                size={40}
                color={Palette.line}
              />
              <Text style={styles.emptyText}>이 날짜에는 예약이 없습니다.</Text>
            </View>
          ) : (
            dayList.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.card}
                onPress={() => setSelected(r)}
              >
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.typeBadge,
                      r.type === "TAKEOUT" && styles.typeBadgeTakeout,
                    ]}
                  >
                    <Text style={styles.typeBadgeText}>
                      {r.type === "TAKEOUT" ? "🥡 포장" : "🍽 방문"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.paidBadge,
                      r.paymentStatus !== "PAID" && styles.unpaidBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.paidBadgeText,
                        r.paymentStatus !== "PAID" && styles.unpaidBadgeText,
                      ]}
                    >
                      {r.paymentStatus === "PAID" ? "결제완료" : "미결제"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardTime}>{r.time}</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>예약자</Text>
                  <Text style={styles.detailValue}>
                    {r.name} · {r.phone}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>좌석/픽업</Text>
                  <Text style={styles.detailValue}>{r.roomLabel}</Text>
                </View>
                <View style={styles.detailLinkRow}>
                  <Text style={styles.detailLinkText}>자세히 보기</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={13}
                    color={Palette.amberDeep}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>예약 상세</Text>
                <TouchableOpacity
                  onPress={() => setSelected(null)}
                  hitSlop={10}
                >
                  <Ionicons name="close" size={22} color={Palette.inkFaint} />
                </TouchableOpacity>
              </View>

              {selected && (
                <>
                  <View style={styles.modalTopRow}>
                    <View
                      style={[
                        styles.typeBadge,
                        selected.type === "TAKEOUT" && styles.typeBadgeTakeout,
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>
                        {selected.type === "TAKEOUT" ? "🥡 포장" : "🍽 방문"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.paidBadge,
                        selected.paymentStatus !== "PAID" && styles.unpaidBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.paidBadgeText,
                          selected.paymentStatus !== "PAID" &&
                            styles.unpaidBadgeText,
                        ]}
                      >
                        {selected.paymentStatus === "PAID"
                          ? "결제완료"
                          : "미결제"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.modalDateTime}>
                    {selected.date} {selected.time}
                  </Text>

                  <View style={styles.modalDivider} />

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>예약자</Text>
                    <Text style={styles.modalValue}>{selected.name}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>연락처</Text>
                    <Text style={styles.modalValue}>{selected.phone}</Text>
                  </View>
                  {selected.type !== "TAKEOUT" && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>인원</Text>
                      <Text style={styles.modalValue}>
                        {selected.peopleCount}명
                      </Text>
                    </View>
                  )}
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>좌석/픽업</Text>
                    <Text style={styles.modalValue}>{selected.roomLabel}</Text>
                  </View>
                  {selected.hasPet && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>반려동물</Text>
                      <Text style={styles.modalValue}>동반 🐾</Text>
                    </View>
                  )}
                  {Object.keys(selected.menus ?? {}).length > 0 && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>메뉴</Text>
                      <Text style={styles.modalValue}>
                        {Object.entries(selected.menus ?? {})
                          .map(
                            ([id, qty]) =>
                              `${getReservationMenuName(id)} ${qty}개`,
                          )
                          .join(", ")}
                      </Text>
                    </View>
                  )}
                  {selected.wantsTakeout &&
                    Object.keys(selected.takeoutMenus ?? {}).length > 0 && (
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>포장</Text>
                        <Text style={styles.modalValue}>
                          {Object.entries(selected.takeoutMenus ?? {})
                            .map(
                              ([id, qty]) =>
                                `${getReservationMenuName(id)} ${qty}개`,
                            )
                            .join(", ")}
                        </Text>
                      </View>
                    )}
                  {selected.message && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>메시지</Text>
                      <Text style={styles.modalValue}>{selected.message}</Text>
                    </View>
                  )}

                  {(selected.paidAmount ?? 0) > 0 && (
                    <>
                      <View style={styles.modalDivider} />
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>결제 금액</Text>
                        <Text style={styles.modalValuePrice}>
                          {(selected.paidAmount ?? 0).toLocaleString()}원
                        </Text>
                      </View>
                      {selected.paymentMethod && (
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>결제 수단</Text>
                          <Text style={styles.modalValue}>
                            {selected.paymentMethod}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </>
              )}

              <View style={{ height: Spacing.md }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  titleBanner: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: 6,
    ...Shadow.card,
  },
  titleBannerToday: {
    backgroundColor: Palette.amberDeep,
    borderWidth: 2,
    borderColor: Palette.gold,
    shadowColor: Palette.amberDeep,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: "hidden",
  },
  todayRibbon: {
    position: "absolute",
    top: 12,
    right: -30,
    backgroundColor: Palette.gold,
    paddingHorizontal: 30,
    paddingVertical: 3,
    transform: [{ rotate: "40deg" }],
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    zIndex: 10,
  },
  todayRibbonText: {
    fontSize: 9,
    fontWeight: "800",
    color: Palette.charcoal,
    letterSpacing: 0.5,
  },
  dateTitle: { fontSize: 18, fontWeight: "800", color: Palette.ink },
  dateTitleToday: { color: Palette.white, fontSize: 20 },
  dateSubTitle: {
    fontSize: 12.5,
    color: Palette.inkFaint,
  },
  dateSubTitleToday: { color: "rgba(255,255,255,0.85)", fontWeight: "700" },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  cardTopRow: { flexDirection: "row", gap: 6, marginBottom: 6 },
  typeBadge: {
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  typeBadgeTakeout: { backgroundColor: "rgba(107,63,160,0.14)" },
  typeBadgeText: { fontSize: 10, fontWeight: "700", color: Palette.amberDeep },
  paidBadge: {
    backgroundColor: "rgba(91,123,90,0.14)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  paidBadgeText: { fontSize: 10, fontWeight: "700", color: Palette.success },
  cardTime: { fontSize: 16, fontWeight: "800", color: Palette.ink },
  detailRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  detailLabel: { fontSize: 12, color: Palette.inkFaint, width: 50 },
  detailValue: { fontSize: 12, color: Palette.ink, flex: 1 },
  detailLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: Spacing.sm + 4,
  },
  detailLinkText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  unpaidBadge: {
    backgroundColor: "rgba(178,58,46,0.12)",
  },
  unpaidBadgeText: { color: Palette.error },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: "85%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: Palette.ink },
  modalTopRow: { flexDirection: "row", gap: 6, marginBottom: Spacing.sm },
  modalDateTime: {
    fontSize: 20,
    fontWeight: "800",
    color: Palette.ink,
    marginBottom: Spacing.sm,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Palette.line,
    marginVertical: Spacing.md,
  },
  modalRow: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
  },
  modalLabel: {
    fontSize: 12.5,
    color: Palette.inkFaint,
    width: 72,
  },
  modalValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Palette.ink,
  },
  modalValuePrice: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: Palette.amberDeep,
  },
});
