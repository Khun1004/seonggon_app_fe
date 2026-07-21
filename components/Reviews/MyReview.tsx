// components/Reviews/MyReview.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useContext } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ReviewContext } from "@/components/contexts/ReviewContext";
import { resolvePhotoUrl } from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

export default function MyReview() {
  const router = useRouter();
  const { myReviews, refreshReviews } = useContext(ReviewContext);

  // 이 화면에 들어올 때마다(리뷰를 쓰고 돌아왔을 때 포함) 최신 내 리뷰를 다시 불러옵니다.
  useFocusEffect(
    useCallback(() => {
      refreshReviews();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            총{" "}
            <Text style={styles.summaryCount}>{myReviews?.length || 0}개</Text>
            의 리뷰를 작성했어요
          </Text>
          <TouchableOpacity
            style={styles.writeBtn}
            onPress={() => router.push("/review-write" as any)}
          >
            <Ionicons name="pencil" size={13} color={Palette.amberDeep} />
            <Text style={styles.writeBtnText}>리뷰 작성</Text>
          </TouchableOpacity>
        </View>

        {!myReviews || myReviews.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="star-outline" size={32} color={Palette.line} />
            <Text style={styles.emptyText}>작성한 리뷰가 없습니다.</Text>
            <Text style={styles.emptySubText}>
              방문 후 리뷰를 남기고 다양한 혜택을 받아보세요!
            </Text>
          </View>
        ) : (
          myReviews.map((rev) => (
            <TouchableOpacity
              key={rev.id}
              style={styles.reviewCard}
              activeOpacity={0.75}
              onPress={() =>
                router.push(`/review-detail?id=${rev.id}&mine=true` as any)
              }
            >
              <View style={styles.reviewHeader}>
                <View style={styles.scoreRow}>
                  <Ionicons name="star" size={14} color={Palette.gold} />
                  <Text style={styles.score}>{rev.rating}점</Text>
                </View>
                <View style={styles.headerRight}>
                  <Text style={styles.date}>{rev.date}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Palette.gold}
                  />
                </View>
              </View>

              {rev.options && rev.options.length > 0 && (
                <View style={styles.optionsBox}>
                  <Text style={styles.optionsText}>
                    {rev.options.join(", ")}
                  </Text>
                </View>
              )}

              <Text style={styles.reviewText} numberOfLines={3}>
                {rev.text}
              </Text>

              {rev.photos &&
                rev.photos.filter((u) => resolvePhotoUrl(u)).length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.photoRow}>
                      {rev.photos
                        .map((u) => resolvePhotoUrl(u))
                        .filter((u): u is string => !!u)
                        .map((uri, idx) => (
                          <Image
                            key={idx}
                            source={{ uri }}
                            style={styles.photoThumb}
                          />
                        ))}
                    </View>
                  </ScrollView>
                )}

              {rev.ownerReply && (
                <View style={styles.commentBtn}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={13}
                    color={Palette.amberDeep}
                  />
                  <Text style={styles.commentBtnText}>댓글 1</Text>
                </View>
              )}
            </TouchableOpacity>
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

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  summaryText: {
    fontSize: 13,
    color: Palette.inkSoft,
  },
  summaryCount: {
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  writeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  writeBtnText: {
    fontSize: 12,
    color: Palette.amberDeep,
    fontWeight: "700",
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
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  emptySubText: {
    fontSize: 12,
    color: Palette.inkFaint,
    textAlign: "center",
  },

  reviewCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Palette.amber,
    ...Shadow.card,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commentBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
  },
  commentBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  score: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  date: {
    fontSize: 12,
    color: Palette.inkFaint,
  },
  optionsBox: {
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  optionsText: {
    fontSize: 11,
    color: Palette.amberDeep,
    fontWeight: "600",
  },
  reviewText: {
    fontSize: 13,
    color: Palette.ink,
    lineHeight: 19,
  },
  photoRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
    backgroundColor: Palette.creamDim,
  },
});
