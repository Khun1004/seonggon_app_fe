// components/Reservation/ReservationCard.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Reservation } from "@/components/contexts/ReservationContext";
import { getReservationMenuName } from "@/constants/reservation-menu-data";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";
import { getReservationWindow } from "@/utils/reservationTimerNotifications";

// 예약에서 가장 많이 고른(수량 기준) 메뉴 이름을 하나 뽑아서, 리뷰 작성 화면의
// "어떤 메뉴를 드셨나요?"에 미리 선택되도록 넘겨줍니다.
function getPrimaryMenuName(res: {
  menus?: Record<string, number>;
}): string | undefined {
  if (!res.menus || Object.keys(res.menus).length === 0) return undefined;
  const topId = Object.entries(res.menus).sort((a, b) => b[1] - a[1])[0]?.[0];
  return topId ? getReservationMenuName(topId) : undefined;
}

// 예약/포장 주문 카드 하나 — 예약 전체 내역, 최근 예약 내역, 취소 내역 화면이
// 전부 이 컴포넌트 하나를 공유해서 씁니다 (디자인/동작을 한 곳에서만 관리하면 되게).
export default function ReservationCard({
  res,
  now,
  alreadyReviewed,
  onCancel,
}: {
  res: Reservation;
  now: number;
  alreadyReviewed: boolean | null;
  onCancel: (id: string) => void;
}) {
  const router = useRouter();

  const minutesPassed = (now - res.createdAt) / (1000 * 60);
  const canCancel =
    minutesPassed <= 30 &&
    res.status !== "cancelled" &&
    res.paymentStatus !== "paid";
  // 수정도 취소랑 똑같이 "예약한 지 30분 이내"까지만 가능해요.
  const canEditMenu =
    minutesPassed <= 30 &&
    res.status !== "cancelled" &&
    res.paymentStatus !== "paid";

  // "방문 완료"는 날짜만 보지 않고, 실제 이용 시간이 끝났는지로 판단해요.
  // 방문 예약은 1시간 이용 시간이 끝나는 순간 바로 "완료"로 바뀌어서
  // 리뷰 작성(1,500원 적립) 안내가 그 즉시 뜨고, 다음 날까지 기다릴 필요가 없어요.
  // 포장 주문은 픽업 시간이 지나면 완료로 봅니다.
  const { start, end } = getReservationWindow(res);
  const completionTime = res.type === "takeout" ? start : end;
  const isPastVisit = now >= completionTime;

  // 방문 예약이 "지금 진행 중"일 때만(입장 시간~종료 시간 사이) 남은 시간을 보여줘요.
  // 포장 주문은 테이블을 쓰는 개념이 아니라서 카운트다운을 안 보여줍니다.
  let remainingLabel: string | null = null;
  if (res.type === "dine_in" && res.status !== "cancelled") {
    if (now >= start && now < end) {
      const remainingMs = end - now;
      const mm = Math.floor(remainingMs / 60000);
      const ss = Math.floor((remainingMs % 60000) / 1000);
      remainingLabel = `종료까지 ${mm}:${String(ss).padStart(2, "0")}`;
    }
  }

  return (
    <View style={styles.reservationCard}>
      <TouchableOpacity
        style={styles.cardSummaryRow}
        activeOpacity={0.75}
        onPress={() => router.push(`/reservation-detail?id=${res.id}` as any)}
      >
        <View
          style={[
            styles.cardAccentBar,
            res.status === "cancelled" && styles.cardAccentBarMuted,
          ]}
        />
        <View style={{ flex: 1 }}>
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
            {res.paymentStatus === "refunded" && (
              <View style={styles.refundedBadge}>
                <Text style={styles.refundedBadgeText}>환불됨</Text>
              </View>
            )}
          </View>
          <Text style={styles.resDate}>
            {res.date} {res.time}
          </Text>
          <Text style={styles.summarySubText}>
            {res.name} ·{" "}
            {res.type === "takeout" ? "포장 픽업" : `${res.peopleCount}명`}
          </Text>
          {remainingLabel && (
            <View style={styles.countdownBadge}>
              <Ionicons name="time-outline" size={11} color={Palette.white} />
              <Text style={styles.countdownBadgeText}>{remainingLabel}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardSummaryRight}>
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
          <Ionicons name="chevron-forward" size={18} color={Palette.gold} />
        </View>
      </TouchableOpacity>

      {res.status === "cancelled" && res.paymentStatus === "refunded" && (
        <View style={styles.cardActionsWrap}>
          <View style={styles.refundNoticeBox}>
            <Ionicons name="cash-outline" size={16} color={Palette.amberDeep} />
            <Text style={styles.refundNoticeText}>
              사장님이 예약을 취소하시면서, 결제하신{" "}
              {res.paidAmount.toLocaleString()}원이 환불 처리되었어요.
            </Text>
          </View>
        </View>
      )}

      {/* 상세 화면까지 안 들어가도, 자주 쓰는 버튼들은 목록에서 바로 쓸 수 있게 */}
      {res.status !== "cancelled" && (
        <View style={styles.cardActionsWrap}>
          {canEditMenu && (
            <TouchableOpacity
              style={styles.editMenuBtn}
              onPress={() =>
                router.push(`/reservation?editId=${res.id}` as any)
              }
            >
              <Ionicons
                name="create-outline"
                size={15}
                color={Palette.amberDeep}
              />
              <Text style={styles.editMenuBtnText}>
                {res.type === "takeout" ? "주문 메뉴 수정" : "예약 · 메뉴 수정"}{" "}
                ({30 - Math.floor(minutesPassed)}분 남음)
              </Text>
            </TouchableOpacity>
          )}
          {res.paymentStatus === "paid" && !isPastVisit && (
            <Text style={styles.paidEditHint}>
              결제가 완료되어 메뉴 수정이 어려워요. 변경을 원하시면 전화로
              문의해 주세요.
            </Text>
          )}

          {!isPastVisit && (
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
                  <Ionicons name="card-outline" size={15} color={Palette.ink} />
                  <Text style={styles.payBtnText}>결제하기</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() =>
                  router.push({
                    pathname: "/review-write" as any,
                    params: { menu: getPrimaryMenuName(res) ?? "" },
                  })
                }
              >
                <Ionicons
                  name="create-outline"
                  size={15}
                  color={Palette.white}
                />
                <Text style={styles.reviewBtnText}>리뷰 작성</Text>
              </TouchableOpacity>
            </View>
          )}

          {isPastVisit && (
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
                      },
                    })
                  }
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={15}
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
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => onCancel(res.id)}
            >
              <Text style={styles.cancelBtnText}>
                예약 취소 ({30 - Math.floor(minutesPassed)}분 남음)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  reservationCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
    ...Shadow.card,
  },
  cardSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardActionsWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  cardAccentBar: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    backgroundColor: Palette.gold,
  },
  cardAccentBarMuted: {
    backgroundColor: Palette.line,
  },
  cardSummaryRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  summarySubText: {
    fontSize: 12,
    color: Palette.inkFaint,
    marginTop: 3,
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: "#B23A2E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginTop: 6,
  },
  countdownBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.white,
  },
  resDate: {
    fontSize: 17,
    fontWeight: "800",
    color: Palette.ink,
    letterSpacing: 0.2,
  },
  typeBadgeRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  typeBadge: {
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  typeBadgeTakeout: {
    backgroundColor: "rgba(107,63,160,0.14)",
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  paidBadge: {
    backgroundColor: "rgba(91,123,90,0.14)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.success,
  },
  refundedBadge: {
    backgroundColor: "rgba(162,62,62,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  refundedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.error,
  },
  refundNoticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Palette.amberSoft,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  refundNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: Palette.amberDeep,
    lineHeight: 18,
  },
  resStatus: { fontSize: 13, fontWeight: "700", color: Palette.amberDeep },
  resStatusCancelled: { color: Palette.error },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm + 4,
  },
  editMenuBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Palette.amber,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm + 4,
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
    marginTop: Spacing.sm,
    lineHeight: 16,
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
    marginTop: Spacing.sm + 4,
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
    marginTop: Spacing.sm + 4,
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
    marginTop: 6,
    lineHeight: 16,
  },
  cancelBtn: {
    backgroundColor: "hsla(0, 45%, 44%, 0.08)",
    padding: Spacing.sm + 6,
    borderRadius: Radius.sm,
    alignItems: "center",
    marginTop: Spacing.sm + 4,
  },
  cancelBtnText: { color: Palette.error, fontWeight: "700", fontSize: 13 },
});
