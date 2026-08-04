// app/admin/components/user-detail/user-detail.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
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
import {
  getMyReviews,
  getRewardSummary,
  getVisitStampStatus,
  RewardSummary,
  ServerReview,
} from "@/constants/api";

type TabKey = "reservations" | "reviews" | "stamps" | "reward";

export default function AdminUserDetail() {
  const { phone, name, loginId } = useLocalSearchParams<{
    phone: string;
    name: string;
    loginId?: string;
  }>();
  const { adminPassword } = useContext(AdminContext);
  const isMember = !!loginId && loginId.trim().length > 0;

  const [activeTab, setActiveTab] = useState<TabKey>("reservations");
  const [loading, setLoading] = useState(true);

  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [reviews, setReviews] = useState<ServerReview[]>([]);
  const [visitCount, setVisitCount] = useState(0);
  const [rewardSummary, setRewardSummary] = useState<RewardSummary | null>(
    null,
  );

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);

    const tasks: Promise<any>[] = [
      getAdminReservations(adminPassword)
        .then((all) =>
          setReservations(
            all
              .filter((r) => r.phone === phone)
              .sort((a, b) => b.date.localeCompare(a.date)),
          ),
        )
        .catch(() => setReservations([])),
    ];

    // 회원(로그인 아이디가 있는 손님)만 리뷰·방문도장·리뷰적립 조회가 가능해요.
    // 사장님이 대신 등록해준 미등록 손님은 앱 계정이 없어서 이 정보들이 없어요.
    if (isMember && loginId) {
      tasks.push(
        getMyReviews(loginId)
          .then(setReviews)
          .catch(() => setReviews([])),
      );
      tasks.push(
        getVisitStampStatus(phone, loginId)
          .then((s) => setVisitCount(s.visitCount))
          .catch(() => setVisitCount(0)),
      );
      tasks.push(
        getRewardSummary(loginId)
          .then(setRewardSummary)
          .catch(() => setRewardSummary(null)),
      );
    }

    Promise.all(tasks).finally(() => setLoading(false));
  }, [adminPassword, phone, loginId, isMember]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const activeReservations = reservations.filter(
    (r) => r.status !== "CANCELLED",
  );

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: "reservations", label: "예약", icon: "calendar-outline" },
    { key: "reviews", label: "리뷰", icon: "star-outline" },
    { key: "stamps", label: "방문도장", icon: "trophy-outline" },
    { key: "reward", label: "리뷰적립", icon: "cash-outline" },
  ];

  return (
    <View style={styles.container}>
      {/* 프로필 헤더 */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons
            name={isMember ? "person" : "person-outline"}
            size={22}
            color={Palette.white}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            <View
              style={[
                styles.badge,
                isMember ? styles.badgeMember : styles.badgeGuest,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isMember ? styles.badgeTextMember : styles.badgeTextGuest,
                ]}
              >
                {isMember ? "회원" : "미등록"}
              </Text>
            </View>
          </View>
          <Text style={styles.phone}>{phone}</Text>
        </View>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Ionicons
              name={t.icon as any}
              size={14}
              color={activeTab === t.key ? Palette.cream : Palette.inkSoft}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === t.key && styles.tabTextActive,
              ]}
            >
              {t.label}
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
          {!isMember && activeTab !== "reservations" && (
            <View style={styles.guestNotice}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={Palette.inkFaint}
              />
              <Text style={styles.guestNoticeText}>
                앱 계정이 없는 손님이라(사장님이 대신 등록해주신 예약이라)
                리뷰·방문도장·리뷰적립 정보가 없어요.
              </Text>
            </View>
          )}

          {activeTab === "reservations" && (
            <>
              <Text style={styles.sectionSummary}>
                전체 {reservations.length}건 (취소 제외{" "}
                {activeReservations.length}
                건)
              </Text>
              {reservations.length === 0 ? (
                <EmptyBox icon="calendar-outline" text="예약 내역이 없어요." />
              ) : (
                reservations.map((r) => (
                  <View key={r.id} style={styles.card}>
                    <View style={styles.cardTopRow}>
                      <View
                        style={[
                          styles.typeBadge,
                          r.type === "TAKEOUT" && styles.typeBadgeTakeout,
                        ]}
                      >
                        <Text style={styles.typeBadgeText}>
                          {r.type === "TAKEOUT" ? "포장" : "방문"}
                        </Text>
                      </View>
                      {r.status === "CANCELLED" ? (
                        <View style={styles.cancelledBadge}>
                          <Text style={styles.cancelledBadgeText}>취소됨</Text>
                        </View>
                      ) : r.paymentStatus === "PAID" ? (
                        <View style={styles.paidBadge}>
                          <Text style={styles.paidBadgeText}>결제완료</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.cardDateTime}>
                      {r.date} {r.time}
                    </Text>
                    <Text style={styles.cardSub}>{r.roomLabel}</Text>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === "reviews" && (
            <>
              {reviews.length === 0 ? (
                <EmptyBox icon="star-outline" text="작성한 리뷰가 없어요." />
              ) : (
                reviews.map((rv) => (
                  <View key={rv.id} style={styles.card}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.starRow}>
                        <Ionicons name="star" size={13} color={Palette.gold} />
                        <Text style={styles.starText}>
                          {rv.rating.toFixed(1)}
                        </Text>
                      </View>
                      <Text style={styles.reviewDate}>
                        {new Date(rv.createdAt).toLocaleDateString("ko-KR")}
                      </Text>
                    </View>
                    {rv.menuRatings.length > 0 && (
                      <Text style={styles.reviewMenus}>
                        {rv.menuRatings
                          .map((m) => `${m.menuName}(${m.rating})`)
                          .join(", ")}
                      </Text>
                    )}
                    <Text style={styles.reviewText} numberOfLines={3}>
                      {rv.text}
                    </Text>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === "stamps" && isMember && (
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={28} color={Palette.amberDeep} />
              <Text style={styles.statValue}>{visitCount}개</Text>
              <Text style={styles.statLabel}>방문 도장</Text>
            </View>
          )}

          {activeTab === "reward" && isMember && (
            <View style={styles.statCard}>
              <Ionicons name="cash" size={28} color={Palette.amberDeep} />
              <Text style={styles.statValue}>
                {(rewardSummary?.balance ?? 0).toLocaleString()}원
              </Text>
              <Text style={styles.statLabel}>
                리뷰 적립 잔액
                {rewardSummary && rewardSummary.spent > 0
                  ? ` (사용 ${rewardSummary.spent.toLocaleString()}원)`
                  : ""}
              </Text>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

function EmptyBox({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.centerBox}>
      <Ionicons name={icon as any} size={36} color={Palette.line} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: Spacing.sm,
  },
  emptyText: { color: Palette.inkFaint, fontSize: 13 },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Palette.charcoal,
    padding: Spacing.lg,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 17, fontWeight: "800", color: Palette.cream },
  phone: { fontSize: 12.5, color: "rgba(251,246,238,0.7)", marginTop: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  badgeMember: { backgroundColor: "rgba(91,123,90,0.25)" },
  badgeGuest: { backgroundColor: "rgba(255,255,255,0.12)" },
  badgeText: { fontSize: 10, fontWeight: "700" },
  badgeTextMember: { color: "#8FCB8E" },
  badgeTextGuest: { color: "rgba(251,246,238,0.7)" },

  tabRow: {
    flexDirection: "row",
    gap: 6,
    padding: Spacing.md,
    backgroundColor: Palette.cream,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    backgroundColor: Palette.creamDim,
  },
  tabActive: { backgroundColor: Palette.charcoal },
  tabText: { fontSize: 11, fontWeight: "700", color: Palette.inkSoft },
  tabTextActive: { color: Palette.cream },

  scrollContent: { padding: Spacing.lg, paddingTop: 0 },

  guestNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Palette.creamDim,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  guestNoticeText: {
    flex: 1,
    fontSize: 12,
    color: Palette.inkFaint,
    lineHeight: 17,
  },

  sectionSummary: {
    fontSize: 12,
    color: Palette.inkFaint,
    marginBottom: Spacing.md,
  },

  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  typeBadgeTakeout: { backgroundColor: "rgba(107,63,160,0.14)" },
  typeBadgeText: { fontSize: 10, fontWeight: "700", color: Palette.amberDeep },
  cancelledBadge: {
    backgroundColor: "rgba(162,62,62,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  cancelledBadgeText: { fontSize: 10, fontWeight: "700", color: Palette.error },
  paidBadge: {
    backgroundColor: "rgba(91,123,90,0.14)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  paidBadgeText: { fontSize: 10, fontWeight: "700", color: Palette.success },
  cardDateTime: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  cardSub: { fontSize: 12, color: Palette.inkFaint, marginTop: 2 },

  starRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  starText: { fontSize: 13, fontWeight: "700", color: Palette.ink },
  reviewDate: { fontSize: 11, color: Palette.inkFaint },
  reviewMenus: {
    fontSize: 11.5,
    color: Palette.amberDeep,
    fontWeight: "600",
    marginBottom: 4,
  },
  reviewText: { fontSize: 13, color: Palette.inkSoft, lineHeight: 19 },

  statCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    alignItems: "center",
    gap: 6,
    ...Shadow.card,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: Palette.ink },
  statLabel: { fontSize: 12, color: Palette.inkFaint },
});
