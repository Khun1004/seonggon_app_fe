// components/Reviews/ReviewDetail.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ReviewContext } from "@/components/contexts/ReviewContext";
import { resolvePhotoUrl } from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    let iconName: keyof typeof Ionicons.glyphMap = "star";
    if (i > rating && i - rating < 1) iconName = "star-half";
    else if (i > rating) iconName = "star-outline";
    stars.push(
      <Ionicons
        key={i}
        name={iconName}
        size={size}
        color={Palette.gold}
        style={{ marginRight: 2 }}
      />,
    );
  }
  return <View style={{ flexDirection: "row" }}>{stars}</View>;
}

export default function ReviewDetail() {
  const router = useRouter();
  const { id, mine } = useLocalSearchParams<{ id: string; mine?: string }>();
  const { allReviews, myReviews, removeReview } = useContext(ReviewContext);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const review =
    allReviews.find((r) => r.id === id) ?? myReviews.find((r) => r.id === id);

  if (!review) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notFoundText}>리뷰를 찾을 수 없습니다.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.notFoundLink}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isMine = mine === "true";
  const validPhotos = (review.photos ?? [])
    .map((u) => resolvePhotoUrl(u))
    .filter((u): u is string => !!u);

  const handleDelete = () => {
    Alert.alert("리뷰 삭제", "정말 이 리뷰를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await removeReview(review.id);
            Alert.alert("알림", "리뷰가 삭제되었습니다.", [
              { text: "확인", onPress: () => router.back() },
            ]);
          } catch (e: any) {
            Alert.alert("알림", e.message || "리뷰 삭제에 실패했습니다.");
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
        <View style={styles.card}>
          <View style={styles.reviewerInfo}>
            {resolvePhotoUrl(review.avatarUrl) ? (
              <Image
                source={{ uri: resolvePhotoUrl(review.avatarUrl)! }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarEmpty}>
                <Ionicons name="person" size={20} color={Palette.inkFaint} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewerName}>{review.name}</Text>
              <View style={styles.timeRow}>
                <StarRow rating={review.rating} size={14} />
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
            </View>
          </View>

          {review.options.length > 0 && (
            <View style={styles.optionsBox}>
              <Text style={styles.optionsText}>
                {review.options.join(" • ")} 가(이) 포함된 식사
              </Text>
            </View>
          )}

          <Text style={styles.reviewText}>{review.text}</Text>

          {validPhotos.length > 0 && (
            <View style={styles.photoGrid}>
              {validPhotos.map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.photoLarge}
                  activeOpacity={0.85}
                  onPress={() => setViewerIndex(idx)}
                >
                  <Image
                    source={{ uri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: Radius.md,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.actionButtonRow}>
            <View style={styles.likeBtn}>
              <Ionicons
                name="thumbs-up-outline"
                size={13}
                color={Palette.inkFaint}
              />
              <Text style={styles.likeText}>도움이 돼요 {review.likes}</Text>
            </View>
            {review.ownerReply && (
              <View style={styles.commentBtn}>
                <Ionicons
                  name="chatbubble-outline"
                  size={13}
                  color={Palette.amberDeep}
                />
                <Text style={styles.commentBtnText}>댓글 1</Text>
              </View>
            )}
          </View>
        </View>

        {review.ownerReply && (
          <View style={styles.replyCard}>
            <View style={styles.replyHeaderRow}>
              <Ionicons name="storefront" size={16} color={Palette.amberDeep} />
              <Text style={styles.replyHeaderText}>사장님 답변</Text>
              {review.ownerReplyAt && (
                <Text style={styles.replyDate}>
                  {new Date(review.ownerReplyAt).toLocaleDateString("ko-KR")}
                </Text>
              )}
            </View>
            <Text style={styles.replyText}>{review.ownerReply}</Text>
          </View>
        )}

        {isMine && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={15} color={Palette.error} />
            <Text style={styles.deleteBtnText}>리뷰 삭제</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 사진 크게 보기 — 썸네일을 누르면 전체화면으로, 여러 장이면 좌우로 넘겨볼 수 있어요 */}
      <Modal
        visible={viewerIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerIndex(null)}
      >
        <View style={styles.viewerBackdrop}>
          <TouchableOpacity
            style={styles.viewerCloseBtn}
            onPress={() => setViewerIndex(null)}
          >
            <Ionicons name="close" size={28} color={Palette.white} />
          </TouchableOpacity>

          {viewerIndex !== null && (
            <Image
              source={{ uri: validPhotos[viewerIndex] }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          )}

          {validPhotos.length > 1 && viewerIndex !== null && (
            <>
              {viewerIndex > 0 && (
                <TouchableOpacity
                  style={[styles.viewerNavBtn, styles.viewerNavBtnLeft]}
                  onPress={() => setViewerIndex((prev) => (prev ?? 0) - 1)}
                >
                  <Ionicons
                    name="chevron-back"
                    size={28}
                    color={Palette.white}
                  />
                </TouchableOpacity>
              )}
              {viewerIndex < validPhotos.length - 1 && (
                <TouchableOpacity
                  style={[styles.viewerNavBtn, styles.viewerNavBtnRight]}
                  onPress={() => setViewerIndex((prev) => (prev ?? 0) + 1)}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={28}
                    color={Palette.white}
                  />
                </TouchableOpacity>
              )}
              <Text style={styles.viewerCounter}>
                {viewerIndex + 1} / {validPhotos.length}
              </Text>
            </>
          )}
        </View>
      </Modal>
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

  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarEmpty: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.creamDim,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm + 4,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.creamDim,
    marginRight: Spacing.sm + 4,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: 4,
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewDate: { fontSize: 12, color: Palette.inkFaint },

  optionsBox: {
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
    alignSelf: "flex-start",
  },
  optionsText: { fontSize: 12, color: Palette.inkSoft },

  reviewText: {
    fontSize: 15,
    color: Palette.ink,
    lineHeight: 23,
    marginBottom: Spacing.md,
  },

  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  photoLarge: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: Radius.md,
    backgroundColor: Palette.creamDim,
    overflow: "hidden",
  },

  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerImage: {
    width: "100%",
    height: "80%",
  },
  viewerCloseBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  viewerNavBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -24,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 24,
  },
  viewerNavBtnLeft: { left: 12 },
  viewerNavBtnRight: { right: 12 },
  viewerCounter: {
    position: "absolute",
    bottom: 48,
    color: Palette.white,
    fontSize: 13,
    fontWeight: "700",
  },

  actionButtonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md + 4,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 32,
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  likeText: { fontSize: 12, color: Palette.inkFaint },
  commentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 32,
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  commentBtnText: { fontSize: 12, color: Palette.amberDeep, fontWeight: "700" },

  replyCard: {
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  replyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.sm,
  },
  replyHeaderText: {
    fontSize: 13,
    fontWeight: "800",
    color: Palette.amberDeep,
    flex: 1,
  },
  replyDate: { fontSize: 11, color: Palette.amberDeep },
  replyText: { fontSize: 14, color: Palette.ink, lineHeight: 21 },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Palette.error,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.md,
  },
  deleteBtnText: { fontSize: 13, fontWeight: "700", color: Palette.error },
});
