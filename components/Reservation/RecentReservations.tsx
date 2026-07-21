// components/Reservation/RecentReservations.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import ReservationCard from "@/components/Reservation/ReservationCard";
import { useProfile } from "@/components/contexts/ProfileContext";
import { ReservationContext } from "@/components/contexts/ReservationContext";
import { hasReviewed as apiHasReviewed } from "@/constants/api";
import { Palette, Spacing } from "@/constants/theme";

// 마이페이지의 "최근 예약 내역"에서 들어오는 전용 화면 — 취소된 건 빼고,
// 방문/포장 예약을 최근 만든 순서로 한 번에 보여줍니다.
export default function RecentReservations() {
  const { reservations, cancelReservation, refreshReservations } =
    useContext(ReservationContext);
  const { profile } = useProfile();
  const [now, setNow] = useState(new Date().getTime());
  const [alreadyReviewed, setAlreadyReviewed] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().getTime()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (profile?.phone) refreshReservations(profile.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.phone]);

  useEffect(() => {
    if (!profile?.phone) return;
    apiHasReviewed(profile.phone)
      .then(setAlreadyReviewed)
      .catch(() => setAlreadyReviewed(null));
  }, [profile?.phone]);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.phone) return;
      refreshReservations(profile.phone);
      apiHasReviewed(profile.phone)
        .then(setAlreadyReviewed)
        .catch(() => {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.phone]),
  );

  const handleCancel = async (id: string) => {
    try {
      await cancelReservation(id);
    } catch {
      // 무시 — 개별 실패가 화면 전체에 영향 주지 않도록
    }
  };

  const recentReservations = (reservations ?? [])
    .filter((r) => r.status !== "cancelled")
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recentReservations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={Palette.line} />
            <Text style={styles.emptyText}>예약 내역이 없습니다.</Text>
          </View>
        ) : (
          recentReservations.map((res) => (
            <ReservationCard
              key={res.id}
              res={res}
              now={now}
              alreadyReviewed={alreadyReviewed}
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
