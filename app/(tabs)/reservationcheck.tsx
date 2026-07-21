// app/(tabs)/reservationcheck.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ReservationCard from "@/components/Reservation/ReservationCard";
import { useProfile } from "@/components/contexts/ProfileContext";
import { ReservationContext } from "@/components/contexts/ReservationContext";
import { hasReviewed as apiHasReviewed } from "@/constants/api";
import { Palette, Radius, Spacing } from "@/constants/theme";

export default function ReservationCheck() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { reservations, cancelReservation, refreshReservations } =
    useContext(ReservationContext);
  const { profile } = useProfile();
  const [now, setNow] = useState(new Date().getTime());
  const [alreadyReviewed, setAlreadyReviewed] = useState<boolean | null>(null);
  // 마이페이지의 "취소 내역"에서 넘어오면 ?tab=cancelled로 바로 그 탭이 열려요.
  const [activeTab, setActiveTab] = useState<
    "dine_in" | "takeout" | "cancelled"
  >(
    tab === "cancelled"
      ? "cancelled"
      : tab === "takeout"
        ? "takeout"
        : "dine_in",
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().getTime()), 10000);
    return () => clearInterval(timer);
  }, []);

  // 저장된 전화번호 기준으로 내 예약 목록을 서버에서 불러옵니다.
  useEffect(() => {
    if (profile?.phone) refreshReservations(profile.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.phone]);

  // 방문 완료된 예약에 "리뷰 작성하고 1,500원 적립" 버튼을 보여줄지 확인
  useEffect(() => {
    if (!profile?.phone) return;
    apiHasReviewed(profile.phone)
      .then(setAlreadyReviewed)
      .catch(() => setAlreadyReviewed(null));
  }, [profile?.phone]);

  // 이 화면으로 돌아올 때마다 최신 내역을 다시 불러옵니다 (결제/수정/취소 후 등).
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

  const handleCancel = (id: string) => {
    Alert.alert("예약 취소", "정말 예약을 취소하시겠습니까?", [
      { text: "닫기", style: "cancel" },
      {
        text: "예약 취소",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelReservation(id);
            Alert.alert("알림", "예약이 취소되었습니다.");
          } catch (err: any) {
            Alert.alert("알림", err.message || "예약 취소에 실패했습니다.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <Text style={styles.eyebrow}>MY RESERVATIONS</Text>
          <Text style={styles.headerTitle}>예약 전체 내역</Text>
        </SafeAreaView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.noticeBanner}>
          <Ionicons
            name="information-circle"
            size={18}
            color={Palette.amberDeep}
          />
          <Text style={styles.noticeBannerText}>
            식당에 방문하실 때 예약자 연락처를 사장님께 알려 주시면 됩니다.
          </Text>
        </View>

        <View style={styles.checkTabRow}>
          <TouchableOpacity
            style={[
              styles.checkTab,
              activeTab === "dine_in" && styles.checkTabActive,
            ]}
            onPress={() => setActiveTab("dine_in")}
          >
            <Text
              style={[
                styles.checkTabText,
                activeTab === "dine_in" && styles.checkTabTextActive,
              ]}
            >
              🍽 방문 예약
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.checkTab,
              activeTab === "takeout" && styles.checkTabActive,
            ]}
            onPress={() => setActiveTab("takeout")}
          >
            <Text
              style={[
                styles.checkTabText,
                activeTab === "takeout" && styles.checkTabTextActive,
              ]}
            >
              🥡 포장 예약
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.checkTab,
              activeTab === "cancelled" && styles.checkTabActive,
            ]}
            onPress={() => setActiveTab("cancelled")}
          >
            <Text
              style={[
                styles.checkTabText,
                activeTab === "cancelled" && styles.checkTabTextActive,
              ]}
            >
              🗂 예약 취소
            </Text>
          </TouchableOpacity>
        </View>

        {(() => {
          const filteredReservations = (reservations ?? []).filter((r) =>
            activeTab === "cancelled"
              ? r.status === "cancelled"
              : r.type === activeTab && r.status !== "cancelled",
          );

          if (filteredReservations.length === 0) {
            return (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={Palette.line}
                />
                <Text style={styles.emptyText}>
                  {activeTab === "dine_in"
                    ? "방문 예약 내역이 없습니다."
                    : activeTab === "takeout"
                      ? "포장 예약 내역이 없습니다."
                      : "취소된 내역이 없습니다."}
                </Text>
              </View>
            );
          }

          return filteredReservations.map((res) => (
            <ReservationCard
              key={res.id}
              res={res}
              now={now}
              alreadyReviewed={alreadyReviewed}
              onCancel={handleCancel}
            />
          ));
        })()}
        <View style={{ height: 100 }} />
      </ScrollView>
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
    marginBottom: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: Palette.cream },
  scrollContent: { padding: Spacing.lg },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Palette.amberSoft,
    borderWidth: 1,
    borderColor: Palette.amber,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  noticeBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: Palette.amberDeep,
    lineHeight: 19,
  },
  checkTabRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: Spacing.lg,
  },
  checkTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.lg,
    backgroundColor: Palette.creamDim,
  },
  checkTabActive: {
    backgroundColor: Palette.charcoal,
  },
  checkTabText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: Palette.inkSoft,
  },
  checkTabTextActive: {
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
