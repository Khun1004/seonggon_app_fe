// app/(tabs)/mypage.tsx
import { useAuth } from "@/components/contexts/AuthContext";
import { CartContext } from "@/components/contexts/CartContext";
import { useProfile } from "@/components/contexts/ProfileContext";
import { TOTAL_STAMPS, VisitContext } from "@/components/contexts/VisitContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { ReservationContext } from "@/components/contexts/ReservationContext";
import { ReviewContext } from "@/components/contexts/ReviewContext";
import {
  BASE_URL,
  getRewardSummary,
  RewardSummary,
  uploadAvatar,
} from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

type MenuItemDef = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  rightText?: string;
  isLogout?: boolean;
  onPress?: () => void;
};

const DEFAULT_AVATAR =
  "https://icons.veryicon.com/png/o/miscellaneous/user-avatar/user-avatar-male-5.png";

export default function MyPage() {
  const router = useRouter();
  const { user, signOut, updateAvatarLocal } = useAuth();
  const { cartItems } = useContext(CartContext);
  const { reservations, refreshReservations } = useContext(ReservationContext);
  const { myReviews, refreshReviews } = useContext(ReviewContext);
  const { visitCount, refreshVisits } = useContext(VisitContext);
  const { profile, saveAvatar, clearAvatar } = useProfile();
  const [rewardSummary, setRewardSummary] = useState<RewardSummary | null>(
    null,
  );

  // 로그인 상태면 서버에 저장된 계정 사진(user.avatarUrl)을 우선 사용해서
  // 어느 기기에서 로그인해도 같은 사진이 보이게 하고, 비회원이면 이 기기에만
  // 저장된 사진(profile.avatarUri)을 씁니다.
  const avatarUri = user?.avatarUrl
    ? `${BASE_URL}${user.avatarUrl}`
    : profile?.avatarUri || DEFAULT_AVATAR;

  // 마이페이지 진입 시 최신 내 리뷰를 다시 불러옵니다.
  useEffect(() => {
    refreshReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.loginId]);

  // 저장된 전화번호 기준으로 내 예약 목록을 서버에서 불러옵니다.
  useEffect(() => {
    if (profile?.phone) refreshReservations(profile.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.phone]);

  // 방문 도장(확정된 예약 개수)도 같은 전화번호 기준으로 불러옵니다.
  useEffect(() => {
    if (profile?.phone) refreshVisits(profile.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.phone]);

  // 리뷰를 쓰고 돌아왔을 때 "리뷰 적립" 금액이 바로 갱신되도록,
  // 이 탭에 포커스될 때마다 리뷰/예약/도장/적립금을 다시 불러옵니다.
  useFocusEffect(
    useCallback(() => {
      refreshReviews();
      if (profile?.phone) {
        refreshReservations(profile.phone);
        refreshVisits(profile.phone);
      }
      if (user) {
        getRewardSummary(user.loginId)
          .then(setRewardSummary)
          .catch(() => {});
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.phone, user?.loginId]),
  );

  const handleChangeAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("알림", "사진 보관함 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const uri = result.assets[0].uri;

    if (user) {
      // 로그인 상태 — 서버에 실제로 업로드해서, 어느 기기에서 로그인해도
      // 같은 사진이 보이게 합니다.
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const avatarUrl = await uploadAvatar(user.loginId, base64);
        await updateAvatarLocal(avatarUrl);
      } catch (e: any) {
        Alert.alert("알림", e.message || "프로필 사진 업로드에 실패했습니다.");
      }
    } else {
      // 비회원 — 계정이 없어 서버에 연결할 수 없으니, 이 기기에만 저장합니다.
      await saveAvatar(uri);
    }
  };

  const renderQuickStatus = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    value: string,
    onPress?: () => void,
  ) => (
    <TouchableOpacity
      style={styles.quickStatusItem}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={Palette.amberDeep} />
      <Text style={styles.quickStatusValue}>{value}</Text>
      <Text style={styles.quickStatusLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderMenuItem = (item: MenuItemDef, isLast: boolean) => (
    <TouchableOpacity
      key={item.label}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      activeOpacity={0.7}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons
          name={item.icon}
          size={19}
          color={item.isLogout ? Palette.error : Palette.ink}
        />
        <Text
          style={[
            styles.menuItemTitle,
            item.isLogout && { color: Palette.error },
          ]}
        >
          {item.label}
        </Text>
      </View>
      {!item.isLogout && (
        <View style={styles.menuItemRight}>
          {item.rightText != null && (
            <Text style={styles.menuItemRightText}>{item.rightText}</Text>
          )}
          <Ionicons name="chevron-forward" size={17} color={Palette.inkFaint} />
        </View>
      )}
    </TouchableOpacity>
  );

  const handleLogout = () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await signOut();
          await clearAvatar();
        },
      },
    ]);
  };

  const ACTIVITY_MENU: MenuItemDef[] = [
    {
      icon: "person-outline",
      label: "내 정보",
      onPress: () => router.push("/my-info" as any),
    },
    {
      icon: "heart-outline",
      label: "찜한 메뉴",
      onPress: () => router.push("/cart" as any),
    },
  ];

  const SUPPORT_MENU: MenuItemDef[] = [
    {
      icon: "information-circle-outline",
      label: "공지사항",
      onPress: () => router.push("/notice" as any),
    },
    {
      icon: "help-circle-outline",
      label: "자주 묻는 질문",
      onPress: () => router.push("/faq" as any),
    },
    {
      icon: "document-text-outline",
      label: "약관 및 정책",
      onPress: () => router.push("/policy" as any),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.profileRow}>
            <TouchableOpacity
              onPress={handleChangeAvatar}
              onLongPress={() => router.push("/admin/login" as any)}
              delayLongPress={1200}
              style={styles.avatarWrap}
            >
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={11} color={Palette.charcoal} />
              </View>
            </TouchableOpacity>

            {user ? (
              <>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{user.nickname} 님</Text>
                    <Text style={styles.greeting}>안녕하세요!</Text>
                  </View>
                  <Text style={styles.phoneText}>{profile?.phone ?? ""}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleLogout}
                  style={styles.editButton}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={14}
                    color={Palette.cream}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>로그인이 필요해요</Text>
                  <Text style={styles.greeting}>
                    회원만 이용 가능한 기능이 있어요
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => router.push("/login" as any)}
                >
                  <Ionicons
                    name="log-in-outline"
                    size={14}
                    color={Palette.cream}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>

          {!user && (
            <View style={styles.authBtnRow}>
              <TouchableOpacity
                style={styles.authBtnOutline}
                onPress={() => router.push("/signup" as any)}
              >
                <Text style={styles.authBtnOutlineText}>회원가입</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.authBtnFilled}
                onPress={() => router.push("/login" as any)}
              >
                <Text style={styles.authBtnFilledText}>로그인</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 30 }}
      >
        {/* Visit stamp card */}
        <TouchableOpacity
          style={styles.pointsCard}
          activeOpacity={0.85}
          onPress={() => router.push("/visit-history" as any)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.pointsLabel}>
              {visitCount >= TOTAL_STAMPS
                ? "혜택을 받을 수 있어요!"
                : "방문 도장"}
            </Text>
            <View style={styles.stampPreviewRow}>
              {Array.from({ length: TOTAL_STAMPS }).map((_, idx) => {
                const filled = idx < visitCount;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.stampPreviewCircle,
                      filled && styles.stampPreviewCircleFilled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stampPreviewNumber,
                        filled && styles.stampPreviewNumberFilled,
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Palette.inkFaint} />
        </TouchableOpacity>

        {/* Review reward card */}
        <TouchableOpacity
          style={styles.rewardPointsCard}
          activeOpacity={0.85}
          onPress={() => router.push("/review-reward" as any)}
        >
          <View style={styles.rewardIconCircle}>
            <Ionicons name="pricetag" size={18} color={Palette.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rewardPointsLabel}>리뷰 적립</Text>
            <Text style={styles.rewardPointsValue}>
              {(rewardSummary?.balance ?? 0).toLocaleString()}원
            </Text>
            <Text style={styles.rewardPointsHint}>
              리뷰 1개당 1,500원 적립
              {rewardSummary && rewardSummary.spent > 0
                ? ` · 사용 ${rewardSummary.spent.toLocaleString()}원`
                : ""}
            </Text>
            <Text style={styles.rewardPointsNote}>
              도토리묵 · 해물파전 결제 시에만 사용 가능
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Palette.inkFaint} />
        </TouchableOpacity>

        {/* Quick status board */}
        <View style={styles.quickStatusBoard}>
          {renderQuickStatus(
            "star-outline",
            "마이 리뷰",
            `${myReviews?.length || 0}개`,
            () => router.push("/my-review" as any),
          )}
          <View style={styles.verticalDivider} />
          {renderQuickStatus(
            "cart-outline",
            "장바구니",
            cartItems.length > 0
              ? `${cartItems.reduce((sum, item) => sum + item.quantity, 0)}개`
              : "0개",
            () => router.push("/cart" as any),
          )}
          <View style={styles.verticalDivider} />
          {renderQuickStatus(
            "calendar-outline",
            "예약 내역",
            `${reservations?.length || 0}건`,
            () => router.push("/recent-reservations" as any),
          )}
        </View>

        {/* Recent activity — 내 정보와 같은 리스트 행 디자인, 눌러서 상세로 이동 */}
        <View style={styles.menuSection}>
          <Text style={styles.plainSectionTitle}>나의 예약 · 리뷰</Text>
          <View style={styles.menuCard}>
            {renderMenuItem(
              {
                icon: "calendar-outline",
                label: "예약 내역",
                rightText:
                  reservations.length > 0 ? `${reservations.length}건` : "없음",
                onPress: () => router.push("/recent-reservations" as any),
              },
              false,
            )}
            {renderMenuItem(
              {
                icon: "close-circle-outline",
                label: "취소 내역",
                rightText:
                  reservations.filter((r) => r.status === "cancelled").length >
                  0
                    ? `${reservations.filter((r) => r.status === "cancelled").length}건`
                    : "없음",
                onPress: () => router.push("/cancelled-reservations" as any),
              },
              false,
            )}
            {renderMenuItem(
              {
                icon: "create-outline",
                label: "나의 작성 리뷰",
                rightText:
                  (myReviews?.length || 0) > 0
                    ? `${myReviews?.length}건`
                    : "없음",
                onPress: () => router.push("/my-review" as any),
              },
              true,
            )}
          </View>
        </View>

        {/* My payment — 결제 수단 관리 + 결제 내역 */}
        <View style={styles.menuSection}>
          <Text style={styles.plainSectionTitle}>나의 결제</Text>
          <View style={styles.menuCard}>
            {renderMenuItem(
              {
                icon: "card-outline",
                label: "결제 수단 관리",
                onPress: () => router.push("/payment-methods" as any),
              },
              false,
            )}
            {renderMenuItem(
              {
                icon: "receipt-outline",
                label: "결제 내역",
                rightText:
                  reservations.filter((r) => r.paymentStatus === "paid")
                    .length > 0
                    ? `${reservations.filter((r) => r.paymentStatus === "paid").length}건`
                    : "없음",
                onPress: () => router.push("/payment-history" as any),
              },
              true,
            )}
          </View>
        </View>

        {/* Activity menu */}
        <View style={styles.menuSection}>
          <Text style={styles.plainSectionTitle}>나의 활동</Text>
          <View style={styles.menuCard}>
            {ACTIVITY_MENU.map((item, idx) =>
              renderMenuItem(item, idx === ACTIVITY_MENU.length - 1),
            )}
          </View>
        </View>

        {/* Support menu */}
        <View style={styles.menuSection}>
          <Text style={styles.plainSectionTitle}>고객 지원</Text>
          <View style={styles.menuCard}>
            {SUPPORT_MENU.map((item, idx) =>
              renderMenuItem(item, idx === SUPPORT_MENU.length - 1),
            )}
          </View>
        </View>

        {/* Logout */}
        {user && (
          <View style={[styles.menuSection, { marginBottom: 20 }]}>
            <View style={styles.menuCard}>
              {renderMenuItem(
                {
                  icon: "log-out-outline",
                  label: "로그아웃",
                  isLogout: true,
                  onPress: handleLogout,
                },
                true,
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  profileHeader: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: Palette.gold,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Palette.gold,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Palette.charcoal,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  name: {
    color: Palette.cream,
    fontSize: 17,
    fontWeight: "700",
  },
  greeting: {
    color: "#C9BFAE",
    fontSize: 13,
  },
  phoneText: {
    color: "#C9BFAE",
    fontSize: 12,
    marginTop: 2,
  },
  editButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  pointsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Palette.white,
    marginHorizontal: Spacing.lg,
    marginTop: -24,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  rewardPointsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Palette.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm + 4,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  rewardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#B23A2E",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardPointsLabel: {
    fontSize: 12,
    color: Palette.inkFaint,
  },
  rewardPointsValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Palette.ink,
    marginTop: 2,
  },
  rewardPointsHint: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginTop: 2,
  },
  rewardPointsNote: {
    fontSize: 10,
    color: "#B23A2E",
    fontWeight: "600",
    marginTop: 3,
  },
  authBtnRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  authBtnOutline: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
  },
  authBtnOutlineText: {
    color: Palette.cream,
    fontSize: 13,
    fontWeight: "700",
  },
  authBtnFilled: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    backgroundColor: Palette.gold,
    alignItems: "center",
  },
  authBtnFilledText: {
    color: Palette.charcoal,
    fontSize: 13,
    fontWeight: "700",
  },
  pointsLabel: {
    fontSize: 12,
    color: Palette.inkFaint,
  },
  stampPreviewRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: Spacing.sm,
  },
  stampPreviewCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.creamDim,
    justifyContent: "center",
    alignItems: "center",
  },
  stampPreviewCircleFilled: {
    backgroundColor: Palette.amber,
  },
  stampPreviewNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.inkFaint,
  },
  stampPreviewNumberFilled: {
    color: Palette.white,
  },
  quickStatusBoard: {
    flexDirection: "row",
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.lg,
    ...Shadow.card,
  },
  quickStatusItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  quickStatusValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.ink,
  },
  quickStatusLabel: {
    fontSize: 11,
    color: Palette.inkFaint,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: Palette.line,
    marginVertical: Spacing.sm,
  },
  menuSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm + 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
  },
  sectionCount: {
    color: Palette.amberDeep,
    fontWeight: "700",
    fontSize: 13,
  },
  plainSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.inkSoft,
    marginBottom: Spacing.sm + 4,
    letterSpacing: 0.3,
  },
  emptyCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    ...Shadow.card,
  },
  emptyText: {
    color: Palette.inkFaint,
    fontSize: 13,
  },
  reservationCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  resHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  resDate: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
  },
  resStatus: {
    fontSize: 12,
    color: Palette.amberDeep,
    fontWeight: "700",
  },
  resStatusCancelled: {
    color: Palette.error,
  },
  resInfo: {
    fontSize: 13,
    color: Palette.ink,
    marginBottom: 2,
  },
  resPhone: {
    fontSize: 12,
    color: Palette.inkFaint,
    marginBottom: Spacing.sm + 4,
  },
  cancelBtnRes: {
    backgroundColor: "rgba(162,62,62,0.08)",
    padding: Spacing.sm + 2,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  cancelBtnTextRes: {
    color: Palette.error,
    fontWeight: "700",
    fontSize: 13,
  },
  myReviewCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm + 4,
    borderLeftWidth: 3,
    borderLeftColor: Palette.amber,
    ...Shadow.card,
  },
  myReviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  myReviewScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  myReviewScore: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  myReviewDate: {
    fontSize: 12,
    color: Palette.inkFaint,
  },
  myReviewOptions: {
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  myReviewOptionsText: {
    fontSize: 11,
    color: Palette.amberDeep,
    fontWeight: "600",
  },
  myReviewText: {
    fontSize: 13,
    color: Palette.ink,
    lineHeight: 19,
  },
  menuCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadow.card,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 4,
  },
  menuItemTitle: {
    fontSize: 14,
    color: Palette.ink,
    fontWeight: "500",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  menuItemRightText: {
    fontSize: 13,
    color: Palette.inkFaint,
    fontWeight: "600",
  },
});
