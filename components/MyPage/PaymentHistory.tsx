// components/MyPage/PaymentHistory.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useProfile } from "@/components/contexts/ProfileContext";
import { ReservationContext } from "@/components/contexts/ReservationContext";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

export default function PaymentHistory() {
  const router = useRouter();
  const { profile } = useProfile();
  const { reservations, refreshReservations } = useContext(ReservationContext);

  const paidReservations = reservations
    .filter((r) => r.paymentStatus === "paid")
    .sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0));

  const load = useCallback(() => {
    if (profile?.phone) refreshReservations(profile.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.phone]);

  useEffect(load, [load]);
  useFocusEffect(load);

  const totalPaid = paidReservations.reduce(
    (sum, r) => sum + (r.paidAmount || 0),
    0,
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>총 결제 금액</Text>
          <Text style={styles.summaryValue}>
            {totalPaid.toLocaleString()}원
          </Text>
          <Text style={styles.summarySub}>
            총 {paidReservations.length}건 결제
          </Text>
        </View>

        {paidReservations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="receipt-outline"
              size={28}
              color={Palette.inkFaint}
            />
            <Text style={styles.emptyText}>결제 내역이 없습니다.</Text>
          </View>
        ) : (
          paidReservations.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.card}
              activeOpacity={0.75}
              onPress={() =>
                router.push(`/reservation-detail?id=${r.id}` as any)
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>
                  {r.date} {r.time}
                </Text>
                <Text style={styles.cardAmount}>
                  {(r.paidAmount || 0).toLocaleString()}원
                </Text>
              </View>
              <Text style={styles.cardRoom}>{r.roomLabel}</Text>
              <View style={styles.cardFooter}>
                <View style={styles.methodBadge}>
                  <Ionicons
                    name="card-outline"
                    size={12}
                    color={Palette.amberDeep}
                  />
                  <Text style={styles.methodBadgeText}>
                    {r.paymentMethod || "결제 수단 미상"}
                  </Text>
                </View>
                {r.paidAt && (
                  <Text style={styles.paidAtText}>
                    {new Date(r.paidAt).toLocaleString("ko-KR", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    결제
                  </Text>
                )}
              </View>
              <View style={styles.cardDetailHint}>
                <Text style={styles.cardDetailHintText}>
                  주문한 메뉴·상세 보기
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={Palette.gold}
                />
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.testNoticeBox}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={Palette.inkFaint}
          />
          <Text style={styles.testNoticeText}>
            이 앱의 결제는 테스트용이며, 실제로 결제되지 않았습니다.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { padding: Spacing.lg },

  summaryCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  summaryLabel: { fontSize: 12, color: Palette.inkFaint },
  summaryValue: {
    fontSize: 26,
    fontWeight: "800",
    color: Palette.ink,
    marginTop: 4,
  },
  summarySub: { fontSize: 12, color: Palette.inkFaint, marginTop: 6 },

  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 60,
  },
  emptyText: { fontSize: 13, color: Palette.inkFaint },

  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardDate: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  cardAmount: { fontSize: 15, fontWeight: "800", color: Palette.amberDeep },
  cardRoom: { fontSize: 12, color: Palette.inkSoft, marginBottom: Spacing.sm },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  cardDetailHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: Spacing.sm,
  },
  cardDetailHintText: {
    fontSize: 11,
    fontWeight: "600",
    color: Palette.gold,
  },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  methodBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  paidAtText: { fontSize: 11, color: Palette.inkFaint },

  testNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.md,
  },
  testNoticeText: {
    flex: 1,
    fontSize: 11,
    color: Palette.inkFaint,
  },
});
