// app/admin/components/review-guide/review-guide.tsx
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
  AdminReviewGuideStep,
  createAdminReviewGuideStep,
  deleteAdminReviewGuideStep,
  getAdminReviewGuideSteps,
  updateAdminReviewGuideStep,
  UpsertReviewGuideStepPayload,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

const EMPTY_DRAFT: UpsertReviewGuideStepPayload = {
  title: "",
  description: "",
  imageUrl: "",
  displayOrder: 0,
  active: true,
};

export default function AdminReviewGuide() {
  const { adminPassword } = useContext(AdminContext);
  const [steps, setSteps] = useState<AdminReviewGuideStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminReviewGuideStep | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<UpsertReviewGuideStepPayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminReviewGuideSteps(adminPassword)
      .then(setSteps)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openCreate = () => {
    setDraft({ ...EMPTY_DRAFT, displayOrder: steps.length + 1 });
    setIsNew(true);
    setEditing({} as AdminReviewGuideStep);
  };

  const openEdit = (s: AdminReviewGuideStep) => {
    setDraft({
      title: s.title,
      description: s.description,
      imageUrl: s.imageUrl ?? "",
      displayOrder: s.displayOrder,
      active: s.active,
    });
    setIsNew(false);
    setEditing(s);
  };

  const closeModal = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!adminPassword) return;
    if (!draft.title.trim() || !draft.description.trim()) {
      Alert.alert("알림", "제목과 설명을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...draft,
        imageUrl: draft.imageUrl?.trim() || undefined,
      };
      if (isNew) {
        await createAdminReviewGuideStep(payload, adminPassword);
      } else if (editing) {
        await updateAdminReviewGuideStep(
          (editing as AdminReviewGuideStep).id,
          payload,
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

  const handleDelete = (s: AdminReviewGuideStep) => {
    Alert.alert("단계 삭제", `"${s.title}" 단계를 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          if (!adminPassword) return;
          try {
            await deleteAdminReviewGuideStep(s.id, adminPassword);
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
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={18} color={Palette.white} />
            <Text style={styles.addBtnText}>새 단계 추가</Text>
          </TouchableOpacity>

          {steps.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="book-outline" size={40} color={Palette.line} />
              <Text style={styles.emptyText}>등록된 단계가 없습니다.</Text>
            </View>
          ) : (
            steps.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.card}
                onPress={() => openEdit(s)}
              >
                <View style={styles.stepNumberCircle}>
                  <Text style={styles.stepNumberText}>{s.displayOrder}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{s.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {s.description}
                  </Text>
                  {!s.active && (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>비활성</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(s)}
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
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>
                  {isNew ? "새 단계 추가" : "단계 수정"}
                </Text>
                <TouchableOpacity onPress={closeModal} hitSlop={10}>
                  <Ionicons name="close" size={22} color={Palette.inkFaint} />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>순서 (숫자)</Text>
              <TextInput
                style={styles.input}
                value={String(draft.displayOrder)}
                onChangeText={(v) =>
                  setDraft((p) => ({
                    ...p,
                    displayOrder: Number(v.replace(/[^0-9]/g, "")) || 0,
                  }))
                }
                keyboardType="number-pad"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>제목</Text>
              <TextInput
                style={styles.input}
                value={draft.title}
                onChangeText={(v) => setDraft((p) => ({ ...p, title: v }))}
                placeholder="예: 로그인하기"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>설명</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={draft.description}
                onChangeText={(v) =>
                  setDraft((p) => ({ ...p, description: v }))
                }
                placeholder="이 단계에 대한 안내 문구"
                placeholderTextColor={Palette.inkFaint}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>이미지 URL (선택)</Text>
              <TextInput
                style={styles.input}
                value={draft.imageUrl}
                onChangeText={(v) => setDraft((p) => ({ ...p, imageUrl: v }))}
                placeholder="https://..."
                placeholderTextColor={Palette.inkFaint}
                autoCapitalize="none"
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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { padding: Spacing.lg },
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
  stepNumberCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { fontSize: 13, fontWeight: "800", color: Palette.white },
  cardTitle: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  cardDesc: { fontSize: 12, color: Palette.inkFaint, marginTop: 2 },
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
    maxHeight: "85%",
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
  inputMultiline: { height: 90 },
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
