// app/admin/reservations.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
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
import {
  AdminReservation,
  cancelReservationAsAdmin,
  getAdminReservations,
} from "@/constants/adminApi";
import { getReservationMenuName } from "@/constants/reservation-menu-data";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function AdminReservations() {
  const { adminPassword } = useContext(AdminContext);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"today" | "all" | "cancelled">("today");

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

  const handleCancel = (res: AdminReservation) => {
    Alert.alert(
      "예약 취소",
      `${res.date} ${res.time} · ${res.name}님 예약을 취소할까요?`,
      [
        { text: "닫기", style: "cancel" },
        {
          text: "취소하기",
          style: "destructive",
          onPress: async () => {
            if (!adminPassword) return;
            try {
              await cancelReservationAsAdmin(res.id, adminPassword);
              load();
            } catch (e: any) {
              Alert.alert("알림", e.message || "취소에 실패했습니다.");
            }
          },
        },
      ],
    );
  };

  const filtered = reservations.filter((r) => {
    if (filter === "today")
      return r.date === todayStr() && r.status !== "CANCELLED";
    if (filter === "cancelled") return r.status === "CANCELLED";
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>ALL RESERVATIONS</Text>
              <Text style={styles.headerTitle}>예약 관리</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.filterRow}>
        {(
          [
            { key: "today", label: "오늘" },
            { key: "all", label: "전체" },
            { key: "cancelled", label: "취소됨" },
          ] as const
        ).map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterTab,
              filter === f.key && styles.filterTabActive,
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === f.key && styles.filterTabTextActive,
              ]}
            >
              {f.label}
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
          {filtered.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons
                name="calendar-outline"
                size={44}
                color={Palette.line}
              />
              <Text style={styles.emptyText}>해당하는 예약이 없습니다.</Text>
            </View>
          ) : (
            filtered.map((res) => {
              const menuNames = Object.entries(res.menus ?? {})
                .map(([id, qty]) => `${getReservationMenuName(id)} ${qty}개`)
                .join(", ");
              return (
                <View key={res.id} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.typeBadge,
                        res.type === "TAKEOUT" && styles.typeBadgeTakeout,
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>
                        {res.type === "TAKEOUT" ? "🥡 포장" : "🍽 방문"}
                      </Text>
                    </View>
                    {res.paymentStatus === "PAID" && (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidBadgeText}>결제완료</Text>
                      </View>
                    )}
                    {res.status === "CANCELLED" && (
                      <View style={styles.cancelledBadge}>
                        <Text style={styles.cancelledBadgeText}>취소됨</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDate}>
                    {res.date} {res.time}
                  </Text>
                  <Text style={styles.cardRoom}>{res.roomLabel}</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>예약자</Text>
                    <Text style={styles.detailValue}>
                      {res.name} · {res.phone}
                    </Text>
                  </View>
                  {res.type !== "TAKEOUT" && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>인원</Text>
                      <Text style={styles.detailValue}>
                        {res.peopleCount}명
                      </Text>
                    </View>
                  )}
                  {menuNames.length > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>메뉴</Text>
                      <Text style={styles.detailValue}>{menuNames}</Text>
                    </View>
                  )}
                  {res.message && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>메시지</Text>
                      <Text style={styles.detailValue}>{res.message}</Text>
                    </View>
                  )}
                  {res.status !== "CANCELLED" && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancel(res)}
                    >
                      <Text style={styles.cancelBtnText}>예약 취소</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 2,
    textAlign: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Palette.cream },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  filterTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
    backgroundColor: Palette.creamDim,
  },
  filterTabActive: { backgroundColor: Palette.charcoal },
  filterTabText: { fontSize: 12.5, fontWeight: "700", color: Palette.inkSoft },
  filterTabTextActive: { color: Palette.cream },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: Spacing.sm,
  },
  emptyText: { color: Palette.inkFaint, fontSize: 13 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
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
  cancelledBadge: {
    backgroundColor: "rgba(178,58,46,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  cancelledBadgeText: { fontSize: 10, fontWeight: "700", color: Palette.error },
  cardDate: { fontSize: 16, fontWeight: "800", color: Palette.ink },
  cardRoom: { fontSize: 13, color: Palette.inkSoft, marginBottom: Spacing.sm },
  detailRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  detailLabel: { fontSize: 12, color: Palette.inkFaint, width: 44 },
  detailValue: { fontSize: 12, color: Palette.ink, flex: 1 },
  cancelBtn: {
    marginTop: Spacing.sm + 4,
    backgroundColor: "hsla(0, 45%, 44%, 0.08)",
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  cancelBtnText: { color: Palette.error, fontWeight: "700", fontSize: 12.5 },
});
