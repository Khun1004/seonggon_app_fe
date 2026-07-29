// components/Reservation/RecentReservations.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ReservationCard from "@/components/Reservation/ReservationCard";
import { useProfile } from "@/components/contexts/ProfileContext";
import { ReservationContext } from "@/components/contexts/ReservationContext";
import { ReviewContext } from "@/components/contexts/ReviewContext";
import { Palette, Radius, Spacing } from "@/constants/theme";

// 마이페이지의 "최근 예약 내역"에서 들어오는 전용 화면 — 취소된 건 빼고,
// 방문/포장 예약을 탭으로 나눠서 최근 만든 순서로 보여줍니다.
export default function RecentReservations() {
  const { reservations, cancelReservation, refreshReservations } =
    useContext(ReservationContext);
  const {
    myReviews,
    loading: reviewsLoading,
    refreshReviews,
  } = useContext(ReviewContext);
  const { profile } = useProfile();
  const [now, setNow] = useState(new Date().getTime());
  const [activeTab, setActiveTab] = useState<"dine_in" | "takeout">("dine_in");

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
      refreshReviews();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.phone]),
  );

  // 예약 하나하나마다 그 예약으로 이미 적립 대상 리뷰를 썼는지 정확히 확인해요
  // (전화번호 전체 기준으로 뭉뚱그리면, 리뷰 하나만 써도 다른 예약들까지 전부
  // "이미 썼음"으로 잘못 표시되니까요).
  const reviewedReservationIds = new Set(
    myReviews
      .filter((r) => r.rewardEligible && r.reservationId)
      .map((r) => r.reservationId),
  );
  const isAlreadyReviewed = (reservationId: string): boolean | null => {
    if (reviewsLoading) return null;
    return reviewedReservationIds.has(reservationId);
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelReservation(id);
    } catch {
      // 무시 — 개별 실패가 화면 전체에 영향 주지 않도록
    }
  };

  const recentReservations = (reservations ?? [])
    .filter((r) => r.status !== "cancelled" && r.type === activeTab)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "dine_in" && styles.tabActive]}
            onPress={() => setActiveTab("dine_in")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "dine_in" && styles.tabTextActive,
              ]}
            >
              🍽 방문 예약
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "takeout" && styles.tabActive]}
            onPress={() => setActiveTab("takeout")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "takeout" && styles.tabTextActive,
              ]}
            >
              🥡 포장 예약
            </Text>
          </TouchableOpacity>
        </View>

        {recentReservations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={Palette.line} />
            <Text style={styles.emptyText}>
              {activeTab === "dine_in"
                ? "방문 예약 내역이 없습니다."
                : "포장 예약 내역이 없습니다."}
            </Text>
          </View>
        ) : (
          recentReservations.map((res) => (
            <ReservationCard
              key={res.id}
              res={res}
              now={now}
              alreadyReviewed={isAlreadyReviewed(res.id)}
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
  tabRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.lg,
    backgroundColor: Palette.creamDim,
  },
  tabActive: {
    backgroundColor: Palette.charcoal,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: Palette.inkSoft,
  },
  tabTextActive: {
    color: Palette.cream,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    gap: Spacing.md,
  },
  emptyText: { color: Palette.inkFaint, fontSize: 14 },
});
