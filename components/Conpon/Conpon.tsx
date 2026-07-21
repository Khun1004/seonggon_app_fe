// components/Conpon/Conpon.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

type CouponItemProps = {
  title: string;
  subtitle: string;
  count?: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function CouponItem({ title, subtitle, count, icon }: CouponItemProps) {
  return (
    <View style={styles.couponWrapper}>
      <View style={styles.couponContainer}>
        {/* Left icon area */}
        <View style={styles.couponIconArea}>
          <Ionicons name={icon} size={28} color={Palette.amberDeep} />
        </View>

        {/* Perforated divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.cutoutTop} />
          <View style={styles.dashLine} />
          <View style={styles.cutoutBottom} />
        </View>

        {/* Right info area */}
        <View style={styles.couponInfoArea}>
          <Text style={styles.couponSubtitle}>{subtitle}</Text>
          <Text style={styles.couponTitle}>{title}</Text>
          {count && <Text style={styles.couponCount}>{count}</Text>}
          <View style={styles.useBtn}>
            <Text style={styles.useBtnText}>상태: 사용 전</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function Conpon() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Text style={styles.bannerMainTitle}>
            성공식당 방문 고객님을 위한
          </Text>
          <Text style={styles.bannerSubTitle}>특별한 리뷰 혜택</Text>
        </View>

        {/* Coupon list */}
        <View style={styles.listSection}>
          <CouponItem
            title="도토리묵 증정"
            subtitle="네이버 포토리뷰 작성 시"
            icon="restaurant-outline"
          />
          <CouponItem
            title="음료 2개 증정"
            subtitle="네이버 리뷰 작성 시"
            icon="beer-outline"
          />
          <CouponItem
            title="모둠버섯 추가"
            subtitle="네이버 포토리뷰 작성 시"
            count="총 3매 제공"
            icon="leaf-outline"
          />
        </View>

        {/* Notice */}
        <View style={styles.noticeContainer}>
          <View style={styles.noticeHeader}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={Palette.ink}
            />
            <Text style={styles.noticeHeaderText}>꼭 읽어주세요!</Text>
          </View>

          <View style={styles.noticeList}>
            <View style={styles.noticeItem}>
              <Text style={styles.noticeBullet}>•</Text>
              <Text style={styles.noticeText}>
                리뷰를 작성하시기 전, 꼭 직원에게{" "}
                <Text style={styles.bold}>영수증 요청</Text>을 해주세요.
              </Text>
            </View>
            <View style={styles.noticeItem}>
              <Text style={styles.noticeBullet}>•</Text>
              <Text style={styles.noticeText}>
                위 3가지 쿠폰 중 <Text style={styles.bold}>한 가지만 선택</Text>{" "}
                가능합니다.
              </Text>
            </View>
            <View style={styles.noticeItem}>
              <Text style={styles.noticeBullet}>•</Text>
              <Text style={styles.noticeText}>
                리뷰 작성을 완료한 후,{" "}
                <Text style={styles.bold}>직원에게 화면을 보여주셔야</Text>{" "}
                혜택을 받으실 수 있습니다.
              </Text>
            </View>
            <View style={styles.noticeItem}>
              <Text style={styles.noticeBullet}>•</Text>
              <Text style={styles.noticeText}>
                사진이 포함된 <Text style={styles.bold}>포토리뷰</Text>일 때만
                해당 쿠폰 혜택이 적용됩니다 (음료 제외).
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 하단 고정 리뷰 작성 바 */}
      <View style={styles.writeBar}>
        <TouchableOpacity
          style={styles.writeBarBtn}
          activeOpacity={0.85}
          onPress={() => router.push("/review-write" as any)}
        >
          <Ionicons name="create-outline" size={18} color={Palette.white} />
          <Text style={styles.writeBarBtnText}>리뷰 작성하고 혜택 받기</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: Spacing.sm,
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
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Palette.ink,
  },
  headerWriteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  headerWriteText: {
    fontSize: 12,
    color: Palette.amberDeep,
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  bannerContainer: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Palette.charcoal,
    alignItems: "center",
  },
  bannerMainTitle: {
    fontSize: 14,
    color: "#C9BFAE",
    fontWeight: "500",
  },
  bannerSubTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Palette.gold,
    marginTop: 8,
  },
  listSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  couponWrapper: {
    marginVertical: Spacing.sm,
    ...Shadow.card,
  },
  couponContainer: {
    height: 108,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    flexDirection: "row",
    overflow: "hidden",
  },
  couponIconArea: {
    width: 86,
    backgroundColor: Palette.amberSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  dividerContainer: {
    width: 2,
    height: "100%",
    position: "relative",
    alignItems: "center",
  },
  cutoutTop: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Palette.cream,
    position: "absolute",
    top: -9,
    zIndex: 10,
  },
  cutoutBottom: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Palette.cream,
    position: "absolute",
    bottom: -9,
    zIndex: 10,
  },
  dashLine: {
    flex: 1,
    width: 1,
    borderWidth: 1,
    borderColor: Palette.line,
    borderStyle: "dashed",
  },
  couponInfoArea: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
  },
  couponSubtitle: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginBottom: 4,
  },
  couponTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Palette.ink,
  },
  couponCount: {
    fontSize: 11,
    color: Palette.amberDeep,
    fontWeight: "700",
    marginTop: 2,
  },
  useBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
  },
  useBtnText: {
    fontSize: 11,
    color: Palette.inkSoft,
    fontWeight: "600",
  },
  noticeContainer: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  noticeHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
  },
  noticeList: {
    gap: Spacing.sm + 4,
  },
  noticeItem: {
    flexDirection: "row",
  },
  noticeBullet: {
    fontSize: 13,
    color: Palette.inkFaint,
    marginRight: 8,
  },
  noticeText: {
    fontSize: 13,
    color: Palette.inkSoft,
    lineHeight: 19,
    flex: 1,
  },
  bold: {
    fontWeight: "700",
    color: Palette.ink,
  },
  writeBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm + 4,
    paddingBottom: 20,
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  writeBarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Palette.amberDeep,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  writeBarBtnText: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
