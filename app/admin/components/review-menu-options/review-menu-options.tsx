// app/admin/components/review-menu-options/review-menu-options.tsx
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
  AdminReviewMenuOption,
  createAdminReviewMenuOption,
  deleteAdminReviewMenuOption,
  getAdminReviewMenuOptions,
  updateAdminReviewMenuOption,
  UpsertReviewMenuOptionPayload,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

const EMPTY_DRAFT: UpsertReviewMenuOptionPayload = {
  name: "",
  displayOrder: 0,
  active: true,
};

export default function AdminReviewMenuOptions() {
  const { adminPassword } = useContext(AdminContext);
  const [options, setOptions] = useState<AdminReviewMenuOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminReviewMenuOption | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] =
    useState<UpsertReviewMenuOptionPayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminReviewMenuOptions(adminPassword)
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
    setEditing({} as AdminReviewMenuOption);
  };

  const openEdit = (o: AdminReviewMenuOption) => {
    setDraft({ name: o.name, displayOrder: o.displayOrder, active: o.active });
    setIsNew(false);
    setEditing(o);
  };

  const closeModal = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!adminPassword) return;
    if (!draft.name.trim()) {
      Alert.alert("알림", "메뉴 이름을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createAdminReviewMenuOption(draft, adminPassword);
      } else if (editing) {
        await updateAdminReviewMenuOption(
          (editing as AdminReviewMenuOption).id,
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

  const handleDelete = (o: AdminReviewMenuOption) => {
    Alert.alert("메뉴 삭제", `"${o.name}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          if (!adminPassword) return;
          try {
            await deleteAdminReviewMenuOption(o.id, adminPassword);
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
              여기서 추가한 메뉴들이 리뷰 작성 화면의 "어떤 메뉴를 드셨나요?"에
              나와요. 실제 메뉴판과는 별도로 관리돼요.
            </Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={18} color={Palette.white} />
            <Text style={styles.addBtnText}>새 메뉴 추가</Text>
          </TouchableOpacity>

          {options.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons
                name="restaurant-outline"
                size={40}
                color={Palette.line}
              />
              <Text style={styles.emptyText}>등록된 메뉴가 없습니다.</Text>
            </View>
          ) : (
            options.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={styles.card}
                onPress={() => openEdit(o)}
              >
                <Text style={styles.cardName}>{o.name}</Text>
                <View style={{ flex: 1 }}>
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
                {isNew ? "새 메뉴 추가" : "메뉴 수정"}
              </Text>
              <TouchableOpacity onPress={closeModal} hitSlop={10}>
                <Ionicons name="close" size={22} color={Palette.inkFaint} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>메뉴 이름</Text>
            <TextInput
              style={styles.input}
              value={draft.name}
              onChangeText={(v) => setDraft((p) => ({ ...p, name: v }))}
              placeholder="예: 능이오리백숙"
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
  cardName: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  inactiveBadge: {
    alignSelf: "flex-start",
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
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
