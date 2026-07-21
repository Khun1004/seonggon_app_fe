// components/Reservation/CancelledReservations.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import ReservationCard from "@/components/Reservation/ReservationCard";
import { useProfile } from "@/components/contexts/ProfileContext";
import { ReservationContext } from "@/components/contexts/ReservationContext";
import { Palette, Spacing } from "@/constants/theme";

// 마이페이지의 "취소 내역"에서 들어오는 전용 화면 — 취소된 예약/포장 주문만 모아서 보여줍니다.
export default function CancelledReservations() {
  const { reservations, cancelReservation, refreshReservations } =
    useContext(ReservationContext);
  const { profile } = useProfile();
  const [now, setNow] = useState(new Date().getTime());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().getTime()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (profile?.phone) refreshReservations(profile.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.phone]);

  useFocusEffect(
    useCallback(() => {
      if (profile?.phone) refreshReservations(profile.phone);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.phone]),
  );

  // 취소된 예약은 다시 취소할 수 없으니, 이 화면에서는 실제로 호출될 일이 없어요
  // (ReservationCard가 canCancel=false로 판단해서 취소 버튼 자체를 안 보여줍니다).
  const handleCancel = async (id: string) => {
    try {
      await cancelReservation(id);
    } catch {
      // 무시
    }
  };

  const cancelledReservations = (reservations ?? [])
    .filter((r) => r.status === "cancelled")
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {cancelledReservations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="close-circle-outline"
              size={48}
              color={Palette.line}
            />
            <Text style={styles.emptyText}>취소된 내역이 없습니다.</Text>
          </View>
        ) : (
          cancelledReservations.map((res) => (
            <ReservationCard
              key={res.id}
              res={res}
              now={now}
              alreadyReviewed={null}
              onCancel={handleCancel}
            />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { padding: Spacing.lg },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    gap: Spacing.md,
  },
  emptyText: { color: Palette.inkFaint, fontSize: 14 },
});
