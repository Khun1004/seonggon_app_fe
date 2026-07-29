// components/Reservation/ReservationDetail.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useProfile } from "@/components/contexts/ProfileContext";
import { ReservationContext } from "@/components/contexts/ReservationContext";
import { ReviewContext } from "@/components/contexts/ReviewContext";
import { findMenuItemById, resolveImageSource } from "@/constants/menu-data";
import { getReservationMenuName } from "@/constants/reservation-menu-data";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";
import { getReservationWindow } from "@/utils/reservationTimerNotifications";

function getPrimaryMenuName(res: {
  menus?: Record<string, number>;
}): string | undefined {
  if (!res.menus || Object.keys(res.menus).length === 0) return undefined;
  const topId = Object.entries(res.menus).sort((a, b) => b[1] - a[1])[0]?.[0];
  return topId ? getReservationMenuName(topId) : undefined;
}

export default function ReservationDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { findReservationById, cancelReservation, refreshReservations } =
    useContext(ReservationContext);
  const {
    myReviews,
    loading: reviewsLoading,
    refreshReviews,
  } = useContext(ReviewContext);
  const { profile } = useProfile();

  const [now, setNow] = useState(new Date().getTime());

  const res = findReservationById(id);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().getTime()), 10000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.phone) return;
      refreshReservations(profile.phone);
      refreshReviews();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.phone]),
  );

  // 이 예약으로 이미 적립 대상 리뷰를 썼는지, 예약 하나하나마다 정확히
  // 확인해요 (전화번호 전체로 뭉뚱그리면, 다른 예약에 쓴 리뷰 때문에 이
  // 예약도 "이미 썼음"으로 잘못 표시될 수 있어요).
  const alreadyReviewed: boolean | null = reviewsLoading
    ? null
    : myReviews.some((r) => r.rewardEligible && r.reservationId === id);

  if (!res) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notFoundText}>예약 정보를 찾을 수 없습니다.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.notFoundLink}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const minutesPassed = (now - res.createdAt) / (1000 * 60);
  const canCancel =
    minutesPassed <= 30 &&
    res.status !== "cancelled" &&
    res.paymentStatus !== "paid";
  const menuKeys = res.menus ? Object.keys(res.menus) : [];
  // 수정도 취소랑 똑같이 "예약한 지 30분 이내"까지만 가능해요.
  const canEditMenu =
    minutesPassed <= 30 &&
    res.status !== "cancelled" &&
    res.paymentStatus !== "paid";

  // "방문 완료"는 날짜가 아니라 실제 이용 시간이 끝났는지로 판단해요.
  // 방문 예약은 1시간 이용 시간이 끝나는 순간 바로 완료로 바뀌어서
  // 리뷰 작성(1,500원 적립) 안내가 그 즉시 뜨고, 다음 날까지 기다릴 필요가 없어요.
  const { start, end } = getReservationWindow(res);
  const completionTime = res.type === "takeout" ? start : end;
  const isPastVisit = now >= completionTime;

  // 방문 예약이 지금 진행 중일 때만(입장~종료 사이) 남은 시간을 보여줘요.
  let remainingLabel: string | null = null;
  if (res.type === "dine_in" && res.status !== "cancelled") {
    if (now >= start && now < end) {
      const remainingMs = end - now;
      const mm = Math.floor(remainingMs / 60000);
      const ss = Math.floor((remainingMs % 60000) / 1000);
      remainingLabel = `${mm}:${String(ss).padStart(2, "0")}`;
    }
  }

  const handleCancel = () => {
    Alert.alert("예약 취소", "정말 예약을 취소하시겠습니까?", [
      { text: "닫기", style: "cancel" },
      {
        text: "예약 취소",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelReservation(res.id);
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerCard}>
          <View style={styles.typeBadgeRow}>
            <View
              style={[
                styles.typeBadge,
                res.type === "takeout" && styles.typeBadgeTakeout,
              ]}
            >
              <Text style={styles.typeBadgeText}>
                {res.type === "takeout"
                  ? "🥡 포장"
                  : res.wantsTakeout
                    ? "🍽 방문(+포장)"
                    : "🍽 방문"}
              </Text>
            </View>
            {res.paymentStatus === "paid" && (
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>결제완료</Text>
              </View>
            )}
          </View>
          <Text style={styles.resDate}>
            {res.date} {res.time}
          </Text>
          <Text
            style={[
              styles.resStatus,
              res.status === "cancelled" && styles.resStatusCancelled,
            ]}
          >
            {res.status === "cancelled"
              ? "취소됨"
              : res.type === "takeout"
                ? "주문접수"
                : "예약완료"}
          </Text>
        </View>

        {remainingLabel && (
          <View style={styles.countdownCard}>
            <Ionicons name="time-outline" size={22} color={Palette.white} />
            <View style={{ flex: 1 }}>
              <Text style={styles.countdownCardLabel}>이용 종료까지</Text>
              <Text style={styles.countdownCardTime}>{remainingLabel}</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.resDetail}>
            <Text style={styles.detailTitle}>
              {res.type === "takeout" ? "주문자" : "예약자"}
            </Text>
            <Text style={styles.detailText}>{res.name}</Text>
          </View>
          <View style={styles.resDetail}>
            <Text style={styles.detailTitle}>연락처</Text>
            <Text style={styles.detailText}>{res.phone}</Text>
          </View>
          {res.type !== "takeout" && (
            <View style={styles.resDetail}>
              <Text style={styles.detailTitle}>방문 인원</Text>
              <Text style={styles.detailText}>{res.peopleCount}명</Text>
            </View>
          )}
          {res.roomLabel && res.type !== "takeout" && (
            <View style={styles.resDetail}>
              <Text style={styles.detailTitle}>좌석/룸</Text>
              <Text style={styles.detailText}>{res.roomLabel}</Text>
            </View>
          )}
          {res.message && (
            <View style={styles.resDetail}>
              <Text style={styles.detailTitle}>전달 말씀</Text>
              <Text style={styles.detailText}>{res.message}</Text>
            </View>
          )}
          {res.hasPet && (
            <View style={styles.resDetail}>
              <Text style={styles.detailTitle}>반려동물</Text>
              <Text style={styles.detailText}>🐾 동반</Text>
            </View>
          )}
          {res.wantsTakeout && (
            <View style={styles.resDetail}>
              <Text style={styles.detailTitle}>포장</Text>
              <Text style={styles.detailText}>
                🥡{" "}
                {res.takeoutMenus && Object.keys(res.takeoutMenus).length > 0
                  ? Object.entries(res.takeoutMenus)
                      .filter(([, qty]) => qty > 0)
                      .map(
                        ([id2, qty]) =>
                          `${getReservationMenuName(id2)} × ${qty}`,
                      )
                      .join(", ")
                  : "나가실 때 포장 예정"}
              </Text>
            </View>
          )}
        </View>

        {menuKeys.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.menuBoxTitle}>주문한 메뉴</Text>
            {menuKeys.map((menuId) => {
              const fullItem = findMenuItemById(menuId);
              return (
                <View key={menuId} style={styles.menuItemRow}>
                  <View style={styles.menuItemImageWrap}>
                    {fullItem?.image ? (
                      <Image
                        source={resolveImageSource(fullItem.image) ?? undefined}
                        style={styles.menuItemImage}
                      />
                    ) : (
                      <View style={styles.menuItemImagePlaceholder}>
                        <Ionicons
                          name="restaurant-outline"
                          size={16}
                          color={Palette.amberDeep}
                        />
                      </View>
                    )}
                  </View>
                  <Text style={styles.menuItemText}>
                    {getReservationMenuName(menuId)} ({res.menus[menuId]}개)
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {res.paymentStatus === "paid" && (
          <View style={styles.card}>
            <Text style={styles.menuBoxTitle}>결제 정보</Text>
            <View style={styles.resDetail}>
              <Text style={styles.detailTitle}>결제 금액</Text>
              <Text style={styles.paymentAmountText}>
                {(res.paidAmount || 0).toLocaleString()}원
              </Text>
            </View>
            <View style={styles.resDetail}>
              <Text style={styles.detailTitle}>결제 수단</Text>
              <Text style={styles.detailText}>
                {res.paymentMethod || "결제 수단 미상"}
              </Text>
            </View>
            {res.paidAt && (
              <View style={styles.resDetail}>
                <Text style={styles.detailTitle}>결제 일시</Text>
                <Text style={styles.detailText}>
                  {new Date(res.paidAt).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            )}
          </View>
        )}

        {canEditMenu && (
          <TouchableOpacity
            style={styles.editMenuBtn}
            onPress={() => router.push(`/reservation?editId=${res.id}` as any)}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={Palette.amberDeep}
            />
            <Text style={styles.editMenuBtnText}>
              {res.type === "takeout" ? "주문 메뉴 수정" : "예약 · 메뉴 수정"} (
              {30 - Math.floor(minutesPassed)}분 남음)
            </Text>
          </TouchableOpacity>
        )}
        {res.paymentStatus === "paid" &&
          res.status !== "cancelled" &&
          !isPastVisit && (
            <Text style={styles.paidEditHint}>
              결제가 완료되어 메뉴 수정이 어려워요. 변경을 원하시면 전화로
              문의해 주세요.
            </Text>
          )}

        {res.status !== "cancelled" && !isPastVisit && (
          <View style={styles.actionRow}>
            {res.paymentStatus !== "paid" && (
              <TouchableOpacity
                style={styles.payBtn}
                onPress={() =>
                  router.push(
                    `/payment-checkout?reservationId=${res.id}` as any,
                  )
                }
              >
                <Ionicons name="card-outline" size={16} color={Palette.ink} />
                <Text style={styles.payBtnText}>결제하기</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() =>
                router.push({
                  pathname: "/review-write" as any,
                  params: {
                    menu: getPrimaryMenuName(res) ?? "",
                    reservationId: res.id,
                  },
                })
              }
            >
              <Ionicons name="create-outline" size={16} color={Palette.white} />
              <Text style={styles.reviewBtnText}>리뷰 작성</Text>
            </TouchableOpacity>
          </View>
        )}

        {res.status !== "cancelled" && isPastVisit && (
          <>
            <View style={styles.thanksBox}>
              <Ionicons name="heart" size={16} color={Palette.amberDeep} />
              <Text style={styles.thanksText}>
                방문 완료 되었습니다. 방문해 주셔서 감사드립니다.{"\n"}또 다시
                방문해 주시면 너무 감사하겠습니다.
              </Text>
            </View>
            {alreadyReviewed === false && (
              <TouchableOpacity
                style={styles.rewardReviewBtn}
                onPress={() =>
                  router.push({
                    pathname: "/review-write" as any,
                    params: {
                      rewardEligible: "true",
                      menu: getPrimaryMenuName(res) ?? "",
                      reservationId: res.id,
                    },
                  })
                }
              >
                <Ionicons
                  name="pricetag-outline"
                  size={16}
                  color={Palette.white}
                />
                <Text style={styles.rewardReviewBtnText}>
                  리뷰 작성 (1,500원 적립)
                </Text>
              </TouchableOpacity>
            )}
            {alreadyReviewed === false && (
              <Text style={styles.rewardHintText}>
                방문 후 리뷰 작성해 주시면 1,500원이 적립됩니다.{"\n"}
                (도토리묵 · 해물파전 결제 시에만 사용 가능합니다)
              </Text>
            )}
          </>
        )}

        {canCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>
              예약 취소 ({30 - Math.floor(minutesPassed)}분 남음)
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { padding: Spacing.lg },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Palette.cream,
  },
  notFoundText: { fontSize: 14, color: Palette.inkFaint },
  notFoundLink: {
    fontSize: 14,
    color: Palette.amberDeep,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  headerCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  countdownCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 4,
    backgroundColor: "#B23A2E",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  countdownCardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  countdownCardTime: {
    fontSize: 24,
    fontWeight: "800",
    color: Palette.white,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },

  typeBadgeRow: { flexDirection: "row", gap: 6, marginBottom: Spacing.sm },
  typeBadge: {
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  typeBadgeTakeout: { backgroundColor: "rgba(107,63,160,0.14)" },
  typeBadgeText: { fontSize: 11, fontWeight: "700", color: Palette.amberDeep },

  paidBadge: {
    backgroundColor: "rgba(91,123,90,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  paidBadgeText: { fontSize: 11, fontWeight: "700", color: Palette.success },

  resDate: {
    fontSize: 20,
    fontWeight: "800",
    color: Palette.ink,
    marginBottom: 6,
  },
  resStatus: { fontSize: 13, fontWeight: "700", color: Palette.amberDeep },
  resStatusCancelled: { color: Palette.error },

  resDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm + 4,
  },
  detailTitle: { fontSize: 13, color: Palette.inkFaint },
  detailText: { fontSize: 14, color: Palette.ink, fontWeight: "600" },
  paymentAmountText: {
    fontSize: 16,
    color: Palette.amberDeep,
    fontWeight: "800",
  },

  menuBoxTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm + 4,
  },
  menuItemText: { fontSize: 13, color: Palette.inkSoft, flex: 1 },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  menuItemImageWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    overflow: "hidden",
    backgroundColor: Palette.creamDim,
  },
  menuItemImage: { width: "100%", height: "100%" },
  menuItemImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  editMenuBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Palette.amber,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Palette.white,
  },
  editMenuBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  paidEditHint: {
    fontSize: 11,
    color: Palette.inkFaint,
    textAlign: "center",
    marginBottom: Spacing.md,
    lineHeight: 16,
  },

  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  payBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Palette.creamDim,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.sm,
  },
  payBtnText: { fontSize: 13, fontWeight: "700", color: Palette.ink },
  reviewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Palette.amberDeep,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.sm,
  },
  reviewBtnText: { fontSize: 13, fontWeight: "700", color: Palette.white },

  thanksBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Palette.amberSoft,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm + 4,
  },
  thanksText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: Palette.amberDeep,
    lineHeight: 18,
  },
  rewardReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#B23A2E",
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.sm,
    marginBottom: 6,
  },
  rewardReviewBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.white,
  },
  rewardHintText: {
    fontSize: 11,
    color: Palette.inkFaint,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: Spacing.md,
  },

  cancelBtn: {
    backgroundColor: "hsla(0, 45%, 44%, 0.08)",
    padding: Spacing.sm + 6,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  cancelBtnText: { color: Palette.error, fontWeight: "700", fontSize: 13 },
});
