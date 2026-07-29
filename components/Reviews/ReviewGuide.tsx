// components/Reviews/ReviewGuide.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getReviewGuideSteps, ReviewGuideStep } from "@/constants/api";
import { NAVER_REVIEW_URL } from "@/constants/store";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

export default function ReviewGuide() {
  const [activeTab, setActiveTab] = useState<"video" | "text">("text");
  const [steps, setSteps] = useState<ReviewGuideStep[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getReviewGuideSteps()
        .then(setSteps)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []),
  );

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
      ) : loading ? (
        <ActivityIndicator
          color={Palette.amberDeep}
          style={{ marginTop: Spacing.xl }}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {steps.map((step, idx) => (
            <View key={step.id} style={styles.stepCard}>
              {step.imageUrl && (
                <Image
                  source={{ uri: step.imageUrl }}
                  style={styles.stepImage}
                />
              )}
              <View style={styles.stepBody}>
                <View style={styles.stepNumberRow}>
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>{idx + 1}</Text>
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
