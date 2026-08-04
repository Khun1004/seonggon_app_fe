// app/admin/components/faq/faq.tsx
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
  AdminFaqItem,
  createAdminFaqItem,
  deleteAdminFaqItem,
  getAdminFaqItems,
  updateAdminFaqItem,
  UpsertFaqItemPayload,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

const EMPTY_DRAFT: UpsertFaqItemPayload = {
  category: "",
  categoryIcon: "help-circle-outline",
  question: "",
  answer: "",
  displayOrder: 0,
  active: true,
};

const ICON_OPTIONS = [
  "calendar-outline",
  "time-outline",
  "car-outline",
  "card-outline",
  "people-outline",
  "help-circle-outline",
];

export default function AdminFaq() {
  const { adminPassword } = useContext(AdminContext);
  const [items, setItems] = useState<AdminFaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminFaqItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<UpsertFaqItemPayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminFaqItems(adminPassword)
      .then(setItems)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // 카테고리별로 묶어서 보여줘요 (등록 순서 그대로).
  const groups: { category: string; icon: string; items: AdminFaqItem[] }[] =
    [];
  for (const item of items) {
    let group = groups.find((g) => g.category === item.category);
    if (!group) {
      group = { category: item.category, icon: item.categoryIcon, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }

  const openCreate = () => {
    setDraft({ ...EMPTY_DRAFT, displayOrder: items.length });
    setIsNew(true);
    setEditing({} as AdminFaqItem);
  };

  const openEdit = (i: AdminFaqItem) => {
    setDraft({
      category: i.category,
      categoryIcon: i.categoryIcon,
      question: i.question,
      answer: i.answer,
      displayOrder: i.displayOrder,
      active: i.active,
    });
    setIsNew(false);
    setEditing(i);
  };

  const closeModal = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!adminPassword) return;
    if (
      !draft.category.trim() ||
      !draft.question.trim() ||
      !draft.answer.trim()
    ) {
      Alert.alert("알림", "카테고리, 질문, 답변을 모두 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createAdminFaqItem(draft, adminPassword);
      } else if (editing) {
        await updateAdminFaqItem(
          (editing as AdminFaqItem).id,
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

  const handleDelete = (i: AdminFaqItem) => {
    Alert.alert("질문 삭제", `"${i.question}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          if (!adminPassword) return;
          try {
            await deleteAdminFaqItem(i.id, adminPassword);
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
            <Text style={styles.addBtnText}>새 질문 추가</Text>
          </TouchableOpacity>

          {groups.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons
                name="help-circle-outline"
                size={40}
                color={Palette.line}
              />
              <Text style={styles.emptyText}>등록된 질문이 없습니다.</Text>
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Ionicons
                    name={group.icon as any}
                    size={15}
                    color={Palette.amberDeep}
                  />
                  <Text style={styles.categoryTitle}>{group.category}</Text>
                </View>
                {group.items.map((i) => (
                  <TouchableOpacity
                    key={i.id}
                    style={styles.card}
                    onPress={() => openEdit(i)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardQuestion}>{i.question}</Text>
                      <Text style={styles.cardAnswer} numberOfLines={2}>
                        {i.answer}
                      </Text>
                      {!i.active && (
                        <View style={styles.inactiveBadge}>
                          <Text style={styles.inactiveBadgeText}>비활성</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(i)}
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
                ))}
              </View>
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
                  {isNew ? "새 질문 추가" : "질문 수정"}
                </Text>
                <TouchableOpacity onPress={closeModal} hitSlop={10}>
                  <Ionicons name="close" size={22} color={Palette.inkFaint} />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>카테고리</Text>
              <TextInput
                style={styles.input}
                value={draft.category}
                onChangeText={(v) => setDraft((p) => ({ ...p, category: v }))}
                placeholder="예: 예약"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>카테고리 아이콘</Text>
              <View style={styles.iconRow}>
                {ICON_OPTIONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconChip,
                      draft.categoryIcon === icon && styles.iconChipActive,
                    ]}
                    onPress={() =>
                      setDraft((p) => ({ ...p, categoryIcon: icon }))
                    }
                  >
                    <Ionicons
                      name={icon as any}
                      size={18}
                      color={
                        draft.categoryIcon === icon
                          ? Palette.white
                          : Palette.amberDeep
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>질문</Text>
              <TextInput
                style={styles.input}
                value={draft.question}
                onChangeText={(v) => setDraft((p) => ({ ...p, question: v }))}
                placeholder="예: 예약은 어떻게 하나요?"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>답변</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={draft.answer}
                onChangeText={(v) => setDraft((p) => ({ ...p, answer: v }))}
                placeholder="답변 내용을 입력해 주세요."
                placeholderTextColor={Palette.inkFaint}
                multiline
                textAlignVertical="top"
              />

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
  categorySection: { marginBottom: Spacing.lg },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.sm,
  },
  categoryTitle: { fontSize: 13, fontWeight: "700", color: Palette.ink },
  card: {
    flexDirection: "row",
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  cardQuestion: { fontSize: 13.5, fontWeight: "700", color: Palette.ink },
  cardAnswer: { fontSize: 12, color: Palette.inkSoft, marginTop: 4 },
  inactiveBadge: {
    alignSelf: "flex-start",
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    marginTop: 6,
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
  inputMultiline: { height: 110 },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: Spacing.md,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Palette.creamDim,
    alignItems: "center",
    justifyContent: "center",
  },
  iconChipActive: { backgroundColor: Palette.amberDeep },
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
