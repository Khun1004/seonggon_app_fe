// components/MyPage/ReviewReward.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/components/contexts/AuthContext";
import { getRewardSummary, redeemReward, RewardSummary } from "@/constants/api";
import { findMenuItemById, resolveImageSource } from "@/constants/menu-data";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

// 리뷰 적립금으로 사용할 수 있는 메뉴
const REDEEMABLE_ITEMS = [
  { id: "s2", name: "도토리묵", price: 9000, menuDataId: "s2" },
  { id: "s1", name: "해물파전", price: 15000, menuDataId: "s1" },
];

export default function ReviewReward() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const loadSummary = useCallback(() => {
    if (!user) return;
    setLoading(true);
    getRewardSummary(user.loginId)
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // 다른 화면에서 리뷰를 쓰고 돌아왔을 때도 잔액이 최신으로 보이도록
  useFocusEffect(loadSummary);

  const handleRedeem = (item: (typeof REDEEMABLE_ITEMS)[number]) => {
    if (!user) return;
    Alert.alert(
      "적립금 사용",
      `${item.name} (${item.price.toLocaleString()}원)에 적립금을 사용하시겠습니까?\n\n※ 실제로 매장에서 해당 메뉴를 받으신 후에 사용해 주세요.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "사용하기",
          onPress: async () => {
            setRedeemingId(item.id);
            try {
              const updated = await redeemReward(
                user.loginId,
                item.name,
                item.price,
              );
              setSummary(updated);
              Alert.alert("완료", `${item.name}에 적립금이 사용되었어요.`);
            } catch (e: any) {
              Alert.alert("알림", e.message || "적립금 사용에 실패했습니다.");
            } finally {
              setRedeemingId(null);
            }
          },
        },
      ],
    );
  };

  const balance = summary?.balance ?? 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 적립 요약 */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceIconCircle}>
            <Ionicons name="pricetag" size={20} color={Palette.white} />
          </View>
          <Text style={styles.balanceLabel}>내 리뷰 적립금</Text>
          {loading && !summary ? (
            <ActivityIndicator
              color={Palette.amberDeep}
              style={{ marginTop: 10 }}
            />
          ) : (
            <>
              <Text style={styles.balanceValue}>
                {balance.toLocaleString()}원
              </Text>
              <Text style={styles.balanceSub}>
                총 적립 {(summary?.earned ?? 0).toLocaleString()}원 · 사용{" "}
                {(summary?.spent ?? 0).toLocaleString()}원
              </Text>
            </>
          )}
        </View>

        <View style={styles.noticeBox}>
          <Ionicons
            name="information-circle"
            size={16}
            color={Palette.amberDeep}
          />
          <Text style={styles.noticeText}>
            적립금은 아래 2가지 메뉴 결제 시에만 사용하실 수 있어요. 매장에서
            실제로 받으신 후 "사용하기"를 눌러 주세요.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>적립금으로 이용 가능한 메뉴</Text>

        {REDEEMABLE_ITEMS.map((item) => {
          const fullItem = item.menuDataId
            ? findMenuItemById(item.menuDataId)
            : undefined;
          const available = balance >= item.price;
          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemImageWrap}>
                {fullItem?.image ? (
                  <Image
                    source={resolveImageSource(fullItem.image) ?? undefined}
                    style={[styles.itemImage, !available && { opacity: 0.4 }]}
                  />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Ionicons
                      name="wine-outline"
                      size={26}
                      color={available ? Palette.amberDeep : Palette.inkFaint}
                    />
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                  {item.price.toLocaleString()}원
                </Text>
                <View
                  style={[
                    styles.availBadge,
                    available ? styles.availBadgeOn : styles.availBadgeOff,
                  ]}
                >
                  <Text
                    style={[
                      styles.availBadgeText,
                      available
                        ? styles.availBadgeTextOn
                        : styles.availBadgeTextOff,
                    ]}
                  >
                    {available ? "사용 가능" : "사용 불가능"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.useBtn, !available && styles.useBtnDisabled]}
                disabled={!available || redeemingId === item.id}
                onPress={() => handleRedeem(item)}
              >
                {redeemingId === item.id ? (
                  <ActivityIndicator size="small" color={Palette.white} />
                ) : (
                  <Text
                    style={[
                      styles.useBtnText,
                      !available && styles.useBtnTextDisabled,
                    ]}
                  >
                    사용하기
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { padding: Spacing.lg },

  balanceCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  balanceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#B23A2E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  balanceLabel: { fontSize: 12, color: Palette.inkFaint },
  balanceValue: {
    fontSize: 28,
    fontWeight: "800",
    color: Palette.ink,
    marginTop: 4,
  },
  balanceSub: { fontSize: 12, color: Palette.inkFaint, marginTop: 6 },

  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Palette.amberSoft,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: Palette.amberDeep,
    lineHeight: 18,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm + 4,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  itemImageWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: Palette.creamDim,
  },
  itemImage: { width: "100%", height: "100%" },
  itemImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: { fontSize: 15, fontWeight: "700", color: Palette.ink },
  itemPrice: { fontSize: 13, color: Palette.amberDeep, marginTop: 4 },
  availBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginTop: 6,
  },
  availBadgeOn: { backgroundColor: "rgba(91,123,90,0.14)" },
  availBadgeOff: { backgroundColor: Palette.creamDim },
  availBadgeText: { fontSize: 10, fontWeight: "700" },
  availBadgeTextOn: { color: Palette.success },
  availBadgeTextOff: { color: Palette.inkFaint },
  useBtn: {
    backgroundColor: "#B23A2E",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
    minWidth: 76,
    alignItems: "center",
  },
  useBtnDisabled: { backgroundColor: Palette.creamDim },
  useBtnText: { fontSize: 12, fontWeight: "700", color: Palette.white },
  useBtnTextDisabled: { color: Palette.inkFaint },
});
