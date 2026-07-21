// app/admin/reviews.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdminContext } from "@/components/contexts/AdminContext";
import {
  AdminReview,
  getAdminReviews,
  setReviewOwnerReply,
} from "@/constants/adminApi";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

function StarRow({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Ionicons
        key={i}
        name={i <= rating ? "star" : "star-outline"}
        size={13}
        color={Palette.gold}
        style={{ marginRight: 1 }}
      />,
    );
  }
  return <View style={{ flexDirection: "row" }}>{stars}</View>;
}

export default function AdminReviews() {
  const { adminPassword } = useContext(AdminContext);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminReview | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminReviews(adminPassword)
      .then(setReviews)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openEditor = (review: AdminReview) => {
    setEditing(review);
    setReplyDraft(review.ownerReply ?? "");
  };

  const handleSaveReply = async () => {
    if (!editing || !adminPassword) return;
    if (!replyDraft.trim()) {
      Alert.alert("알림", "답변 내용을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      await setReviewOwnerReply(editing.id, replyDraft.trim(), adminPassword);
      setEditing(null);
      load();
    } catch (e: any) {
      Alert.alert("알림", e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>REVIEW REPLIES</Text>
              <Text style={styles.headerTitle}>리뷰 답변</Text>
            </View>
          </View>
        </SafeAreaView>
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
          {reviews.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons
                name="chatbubbles-outline"
                size={44}
                color={Palette.line}
              />
              <Text style={styles.emptyText}>아직 작성된 리뷰가 없습니다.</Text>
            </View>
          ) : (
            reviews.map((rev) => (
              <TouchableOpacity
                key={rev.id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => openEditor(rev)}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.reviewerName}>{rev.displayName}</Text>
                  <StarRow rating={rev.rating} />
                </View>
                <Text style={styles.reviewText} numberOfLines={2}>
                  {rev.text}
                </Text>
                <View style={styles.replyPreview}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={13}
                    color={
                      rev.ownerReply ? Palette.amberDeep : Palette.inkFaint
                    }
                  />
                  <Text
                    style={[
                      styles.replyPreviewText,
                      !rev.ownerReply && styles.replyPreviewTextEmpty,
                    ]}
                    numberOfLines={1}
                  >
                    {rev.ownerReply || "답변을 남겨보세요"}
                  </Text>
                  <Ionicons
                    name="create-outline"
                    size={14}
                    color={Palette.gold}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      <Modal
        visible={!!editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>답변 작성</Text>
              <TouchableOpacity onPress={() => setEditing(null)} hitSlop={10}>
                <Ionicons name="close" size={22} color={Palette.inkFaint} />
              </TouchableOpacity>
            </View>
            {editing && (
              <Text style={styles.modalReviewText} numberOfLines={3}>
                “{editing.text}”
              </Text>
            )}
            <TextInput
              style={styles.replyInput}
              placeholder="손님께 남길 답변을 입력해 주세요."
              placeholderTextColor={Palette.inkFaint}
              multiline
              textAlignVertical="top"
              value={replyDraft}
              onChangeText={setReplyDraft}
            />
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSaveReply}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={Palette.white} />
              ) : (
                <Text style={styles.saveBtnText}>답변 저장</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  header: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 2,
    textAlign: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Palette.cream },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: Spacing.sm,
  },
  emptyText: { color: Palette.inkFaint, fontSize: 13 },
  scrollContent: { padding: Spacing.lg },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewerName: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  reviewText: {
    fontSize: 13,
    color: Palette.inkSoft,
    lineHeight: 19,
    marginBottom: Spacing.sm,
  },
  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  replyPreviewText: { flex: 1, fontSize: 12, color: Palette.amberDeep },
  replyPreviewTextEmpty: { color: Palette.inkFaint },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: Palette.ink },
  modalReviewText: {
    fontSize: 12.5,
    color: Palette.inkFaint,
    fontStyle: "italic",
    marginBottom: Spacing.md,
  },
  replyInput: {
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Palette.ink,
    height: 110,
    marginBottom: Spacing.md,
  },
  saveBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: Palette.cream },
});
