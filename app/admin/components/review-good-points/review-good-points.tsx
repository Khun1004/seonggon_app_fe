// app/admin/components/review-good-points/review-good-points.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { AdminContext } from "@/components/contexts/AdminContext";
import {
  AdminReviewGoodPointOption,
  createAdminReviewGoodPointOption,
  deleteAdminReviewGoodPointOption,
  getAdminReviewGoodPointOptions,
  updateAdminReviewGoodPointOption,
  UpsertReviewGoodPointOptionPayload,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

const EMPTY_DRAFT: UpsertReviewGoodPointOptionPayload = {
  emoji: "✨",
  label: "",
  displayOrder: 0,
  active: true,
};

export default function AdminReviewGoodPoints() {
  const { adminPassword } = useContext(AdminContext);
  const [options, setOptions] = useState<AdminReviewGoodPointOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminReviewGoodPointOption | null>(
    null,
  );
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] =
    useState<UpsertReviewGoodPointOptionPayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminReviewGoodPointOptions(adminPassword)
      .then(setOptions)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openCreate = () => {
    setDraft({ ...EMPTY_DRAFT, displayOrder: options.length });
    setIsNew(true);
    setEditing({} as AdminReviewGoodPointOption);
  };

  const openEdit = (o: AdminReviewGoodPointOption) => {
    setDraft({
      emoji: o.emoji,
      label: o.label,
      displayOrder: o.displayOrder,
      active: o.active,
    });
    setIsNew(false);
    setEditing(o);
  };

  const closeModal = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!adminPassword) return;
    if (!draft.emoji.trim() || !draft.label.trim()) {
      Alert.alert("알림", "이모지와 문구를 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createAdminReviewGoodPointOption(draft, adminPassword);
      } else if (editing) {
        await updateAdminReviewGoodPointOption(
          (editing as AdminReviewGoodPointOption).id,
          draft,
          adminPassword,
        );
      }
      closeModal();
      load();
    } catch (e: any) {
      Alert.alert("알림", e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (o: AdminReviewGoodPointOption) => {
    Alert.alert("항목 삭제", `"${o.label}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          if (!adminPassword) return;
          try {
            await deleteAdminReviewGoodPointOption(o.id, adminPassword);
            load();
          } catch (e: any) {
            Alert.alert("알림", e.message || "삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Palette.amberDeep} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hintBox}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={Palette.amberDeep}
            />
            <Text style={styles.hintText}>
              여기서 추가한 항목은 손님이 리뷰 작성할 때 "어떤 점이
              좋았나요?"에서 선택할 수 있어요. 문구를 나중에 바꾸면 예전 리뷰의
              통계가 살짝 안 맞을 수 있어요 — 되도록 새로 추가하는 방식을
              권장해요.
            </Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={18} color={Palette.white} />
            <Text style={styles.addBtnText}>새 항목 추가</Text>
          </TouchableOpacity>

          {options.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="happy-outline" size={40} color={Palette.line} />
              <Text style={styles.emptyText}>등록된 항목이 없습니다.</Text>
            </View>
          ) : (
            options.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={styles.card}
                onPress={() => openEdit(o)}
              >
                <Text style={styles.cardEmoji}>{o.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>{o.label}</Text>
                  {!o.active && (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>비활성</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(o)}
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={Palette.error}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      <Modal visible={!!editing} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {isNew ? "새 항목 추가" : "항목 수정"}
              </Text>
              <TouchableOpacity onPress={closeModal} hitSlop={10}>
                <Ionicons name="close" size={22} color={Palette.inkFaint} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>이모지</Text>
            <TextInput
              style={styles.input}
              value={draft.emoji}
              onChangeText={(v) => setDraft((p) => ({ ...p, emoji: v }))}
              placeholder="예: 😋"
              placeholderTextColor={Palette.inkFaint}
            />

            <Text style={styles.fieldLabel}>문구</Text>
            <TextInput
              style={styles.input}
              value={draft.label}
              onChangeText={(v) => setDraft((p) => ({ ...p, label: v }))}
              placeholder="예: 음식이 맛있어요"
              placeholderTextColor={Palette.inkFaint}
            />

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>손님 화면에 보이기</Text>
              <Switch
                value={draft.active}
                onValueChange={(v) => setDraft((p) => ({ ...p, active: v }))}
                trackColor={{ false: Palette.line, true: Palette.amberDeep }}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={Palette.white} />
              ) : (
                <Text style={styles.saveBtnText}>저장</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { padding: Spacing.lg },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Palette.amberSoft,
    padding: Spacing.sm + 4,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  hintText: {
    flex: 1,
    fontSize: 11.5,
    color: Palette.amberDeep,
    fontWeight: "600",
    lineHeight: 16,
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: Spacing.sm,
  },
  emptyText: { color: Palette.inkFaint, fontSize: 13 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Palette.charcoal,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  addBtnText: { color: Palette.white, fontWeight: "700", fontSize: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  cardEmoji: { fontSize: 26 },
  cardLabel: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  inactiveBadge: {
    alignSelf: "flex-start",
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  inactiveBadgeText: {
    fontSize: 10,
    color: Palette.inkFaint,
    fontWeight: "700",
  },
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
    marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: Palette.ink },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkSoft,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: 14,
    color: Palette.ink,
    marginBottom: Spacing.md,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  saveBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  saveBtnText: { color: Palette.white, fontWeight: "700", fontSize: 15 },
});
