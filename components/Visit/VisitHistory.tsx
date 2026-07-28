// components/Visit/VisitHistory.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/components/contexts/AuthContext";
import { useProfile } from "@/components/contexts/ProfileContext";
import { TOTAL_STAMPS, VisitContext } from "@/components/contexts/VisitContext";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

export default function VisitHistory() {
  const { visitCount, visitRecords, canClaim, refreshVisits, claimReward } =
    useContext(VisitContext);
  const { profile } = useProfile();
  const { user } = useAuth();
  const [claiming, setClaiming] = useState(false);

  // 저장된 전화번호 기준으로 확정된 예약 = 방문 도장을 서버에서 불러옵니다.
  // 로그인 정보가 있으면 내 리뷰 목록과 도장 사용 현황도 같이 불러와서,
  // 어떤 방문에 리뷰를 남겼는지 + 지금 혜택을 받을 수 있는지까지 정확히 표시해요.
  useEffect(() => {
    if (profile?.phone) refreshVisits(profile.phone, user?.loginId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.phone, user?.loginId]);

  // 도장 아래 작은 날짜를 보여주기 위해 오래된 순으로 다시 정렬
  const chronological = [...visitRecords].reverse();

  const handleUseReward = () => {
    if (!profile?.phone || !user?.loginId) {
      Alert.alert("알림", "로그인 후 이용해 주세요.");
      return;
    }
    Alert.alert(
      "혜택 사용",
      "매장 직원에게 이 화면을 보여주시면 해물파전을 받으실 수 있어요!",
      [
        { text: "취소", style: "cancel" },
        {
          text: "사용 확인",
          onPress: async () => {
            setClaiming(true);
            try {
              await claimReward(profile.phone, user.loginId);
              Alert.alert("알림", "혜택이 사용 처리되었습니다. 맛있게 드세요!");
            } catch (e: any) {
              Alert.alert("알림", e.message || "혜택 사용에 실패했습니다.");
            } finally {
              setClaiming(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stamp progress */}
        <View style={styles.stampCard}>
          <Text style={styles.stampCardTitle}>
            {canClaim
              ? "도장을 모두 모으셨어요!"
              : `${TOTAL_STAMPS - visitCount}번 더 방문하면 혜택을 받아요`}
          </Text>
          <View style={styles.stampRow}>
            {Array.from({ length: TOTAL_STAMPS }).map((_, idx) => {
              const filled = idx < visitCount;
              const tilt = idx % 2 === 0 ? "-7deg" : "6deg";
              const visitDate = chronological[idx]?.date;
              return (
                <View key={idx} style={styles.stampSlot}>
                  <View
                    style={[
                      styles.stampCircle,
                      filled && styles.stampCircleFilled,
                      filled && { transform: [{ rotate: tilt }] },
                    ]}
                  >
                    {filled ? (
                      <>
                        <View style={styles.stampInnerRing} />
                        <Text style={styles.stampGlyph}>완</Text>
                      </>
                    ) : (
                      <Text style={styles.stampNumber}>{idx + 1}</Text>
                    )}
                  </View>
                  <Text style={styles.stampDate}>
                    {filled && visitDate
                      ? visitDate.slice(5).replace("-", ".")
                      : ""}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.rewardBox}>
            <Ionicons name="gift-outline" size={16} color={Palette.amberDeep} />
            <Text style={styles.rewardText}>
              5번 방문 완료 시 해물파전 서비스 증정
            </Text>
          </View>

          {canClaim && (
            <TouchableOpacity
              style={[styles.useRewardBtn, claiming && { opacity: 0.6 }]}
              onPress={handleUseReward}
              disabled={claiming}
            >
              {claiming ? (
                <ActivityIndicator color={Palette.white} size="small" />
              ) : (
                <>
                  <Ionicons name="gift" size={16} color={Palette.white} />
                  <Text style={styles.useRewardBtnText}>사용하기</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.noticeBox}>
          <Ionicons
            name="information-circle-outline"
            size={15}
            color={Palette.amberDeep}
          />
          <Text style={styles.noticeText}>
            예약을 완료하시면 도장이 바로 1개 찍혀요. 예약을 취소하시면 해당
            도장도 함께 사라집니다.
          </Text>
        </View>

        {/* Visit history list */}
        <Text style={styles.sectionTitle}>방문 내역</Text>
        {visitRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={Palette.line} />
            <Text style={styles.emptyText}>
              아직 등록된 방문 내역이 없습니다.
            </Text>
          </View>
        ) : (
          visitRecords.map((record) => (
            <View key={record.id} style={styles.recordRow}>
              <View>
                <Text style={styles.recordDate}>{record.date}</Text>
                {record.roomLabel ? (
                  <Text style={styles.recordRoom}>{record.roomLabel}</Text>
                ) : null}
              </View>
              <View
                style={[
                  styles.reviewBadge,
                  record.hasReview
                    ? styles.reviewBadgeDone
                    : styles.reviewBadgeNone,
                ]}
              >
                <Text
                  style={[
                    styles.reviewBadgeText,
                    record.hasReview && styles.reviewBadgeTextDone,
                  ]}
                >
                  {record.hasReview ? "리뷰 작성됨" : "리뷰 없음"}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.card,
  },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Palette.ink },
  scrollContent: { paddingHorizontal: Spacing.lg },

  stampCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  stampCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  stampRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  stampSlot: {
    alignItems: "center",
    gap: 4,
  },
  stampCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Palette.creamDim,
    borderWidth: 1.5,
    borderColor: Palette.line,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  stampCircleFilled: {
    backgroundColor: "#B23A2E", // 전통 인주(붉은 도장 잉크) 색
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
  stampInnerRing: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  stampGlyph: {
    fontSize: 17,
    fontWeight: "800",
    color: Palette.cream,
  },
  stampNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.inkFaint,
  },
  stampDate: {
    fontSize: 9,
    color: Palette.inkFaint,
    fontWeight: "600",
    height: 12,
  },
  rewardBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Palette.amberSoft,
    padding: Spacing.sm + 4,
    borderRadius: Radius.sm,
  },
  rewardText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: Palette.amberDeep,
  },
  useRewardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#B23A2E",
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm + 4,
  },
  useRewardBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.white,
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Palette.white,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    color: Palette.inkSoft,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.inkSoft,
    marginBottom: Spacing.sm + 4,
  },
  emptyCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadow.card,
  },
  emptyText: {
    fontSize: 13,
    color: Palette.inkFaint,
  },
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: "600",
    color: Palette.ink,
  },
  recordRoom: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginTop: 2,
  },
  reviewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  reviewBadgeDone: {
    backgroundColor: "rgba(91,123,90,0.12)",
  },
  reviewBadgeNone: {
    backgroundColor: Palette.creamDim,
  },
  reviewBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Palette.inkFaint,
  },
  reviewBadgeTextDone: {
    color: Palette.success,
  },
});
