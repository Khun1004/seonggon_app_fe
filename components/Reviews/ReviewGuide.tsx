// components/Reviews/ReviewGuide.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { NAVER_REVIEW_URL } from "@/constants/store";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

type GuideStep = {
  step: number;
  title: string;
  description: string;
  image: string;
};

const GUIDE_STEPS: GuideStep[] = [
  {
    step: 1,
    title: "로그인하기",
    description:
      "방문자 리뷰는 로그인 후에만 작성할 수 있어요. 아직 회원이 아니라면 간단하게 가입 후 로그인해 주세요.",
    image:
      "https://images.unsplash.com/photo-1610945415295-d2bbf6a3c3e6?w=600&q=80",
  },
  {
    step: 2,
    title: "별점과 메뉴 선택하기",
    description:
      "별점을 선택하고, 드셨던 메뉴와 '이런 점이 좋았어요' 항목을 골라주세요. 통계에 반영됩니다.",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
  },
  {
    step: 3,
    title: "리뷰 작성하기",
    description:
      "직접 작성하거나, 선택한 키워드를 바탕으로 AI가 자연스러운 문장을 만들어주는 'AI 작성' 모드를 이용해도 좋아요.",
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&q=80",
  },
  {
    step: 4,
    title: "사진 첨부하고 등록하기",
    description:
      "음식 사진을 첨부하면 '포토리뷰'로 표시돼요. 작성이 끝나면 '방문자 리뷰로 등록하기'를 눌러주세요.",
    image:
      "https://images.unsplash.com/photo-1556742111-a301076d9d18?w=600&q=80",
  },
];

export default function ReviewGuide() {
  const [activeTab, setActiveTab] = useState<"video" | "text">("text");

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === "video" && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab("video")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "video" && styles.tabTextActive,
            ]}
          >
            영상
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "text" && styles.tabItemActive]}
          onPress={() => setActiveTab("text")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "text" && styles.tabTextActive,
            ]}
          >
            설명
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "video" ? (
        <View style={styles.videoEmptyWrap}>
          <Ionicons name="videocam-outline" size={40} color={Palette.line} />
          <Text style={styles.videoEmptyText}>
            영상 가이드는 준비 중입니다.
          </Text>
          <Text style={styles.videoEmptySubText}>
            아래 '설명' 탭에서 작성법을 확인해 주세요.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {GUIDE_STEPS.map((step) => (
            <View key={step.step} style={styles.stepCard}>
              <Image source={{ uri: step.image }} style={styles.stepImage} />
              <View style={styles.stepBody}>
                <View style={styles.stepNumberRow}>
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>{step.step}</Text>
                  </View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}

          <View style={styles.naverCard}>
            <Ionicons
              name="heart-outline"
              size={22}
              color={Palette.amberDeep}
            />
            <Text style={styles.naverCardTitle}>
              네이버에도 리뷰를 남겨주시면{"\n"}큰 도움이 됩니다 😊
            </Text>
            <TouchableOpacity
              style={styles.naverCardBtn}
              onPress={() => Linking.openURL(NAVER_REVIEW_URL).catch(() => {})}
            >
              <Text style={styles.naverCardBtnText}>
                네이버 리뷰 남기러 가기
              </Text>
              <Ionicons name="open-outline" size={14} color={Palette.white} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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

  tabRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.white,
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: Radius.pill,
  },
  tabItemActive: {
    backgroundColor: Palette.charcoal,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.inkSoft,
  },
  tabTextActive: {
    color: Palette.cream,
  },

  videoEmptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  videoEmptyText: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  videoEmptySubText: {
    fontSize: 12,
    color: Palette.inkFaint,
    textAlign: "center",
  },

  scrollContent: { paddingHorizontal: Spacing.lg },
  stepCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
    ...Shadow.card,
  },
  stepImage: {
    width: "100%",
    height: 140,
    backgroundColor: Palette.creamDim,
  },
  stepBody: {
    padding: Spacing.md,
  },
  stepNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepNumberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.amber,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.white,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
    flex: 1,
  },
  stepDescription: {
    fontSize: 12,
    color: Palette.inkSoft,
    lineHeight: 18,
  },

  naverCard: {
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Palette.amber,
  },
  naverCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.amberDeep,
    textAlign: "center",
    lineHeight: 19,
  },
  naverCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Palette.amberDeep,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.pill,
  },
  naverCardBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.white,
  },
});
