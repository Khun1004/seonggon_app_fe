// app/admin/components/policy-sections/policy-sections.tsx
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
  AdminPolicySection,
  createAdminPolicySection,
  deleteAdminPolicySection,
  getAdminPolicySections,
  updateAdminPolicySection,
  UpsertPolicySectionPayload,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

const emptyDraft = (policyType: string): UpsertPolicySectionPayload => ({
  policyType,
  heading: "",
  body: "",
  displayOrder: 0,
  active: true,
});

export default function AdminPolicySections() {
  const { adminPassword } = useContext(AdminContext);
  const [activeTab, setActiveTab] = useState<"TERMS" | "PRIVACY">("TERMS");
  const [sections, setSections] = useState<AdminPolicySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminPolicySection | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<UpsertPolicySectionPayload>(
    emptyDraft("TERMS"),
  );
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminPolicySections(adminPassword)
      .then(setSections)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const shown = sections
    .filter((s) => s.policyType === activeTab)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const openCreate = () => {
    setDraft({ ...emptyDraft(activeTab), displayOrder: shown.length });
    setIsNew(true);
    setEditing({} as AdminPolicySection);
  };

  const openEdit = (s: AdminPolicySection) => {
    setDraft({
      policyType: s.policyType,
      heading: s.heading,
      body: s.body,
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
    if (!draft.heading.trim() || !draft.body.trim()) {
      Alert.alert("알림", "제목과 내용을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createAdminPolicySection(draft, adminPassword);
      } else if (editing) {
        await updateAdminPolicySection(
          (editing as AdminPolicySection).id,
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

  const handleDelete = (s: AdminPolicySection) => {
    Alert.alert("조항 삭제", `"${s.heading}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          if (!adminPassword) return;
          try {
            await deleteAdminPolicySection(s.id, adminPassword);
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
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === "TERMS" && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab("TERMS")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "TERMS" && styles.tabTextActive,
            ]}
          >
            이용약관
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === "PRIVACY" && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab("PRIVACY")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "PRIVACY" && styles.tabTextActive,
            ]}
          >
            개인정보 처리방침
          </Text>
        </TouchableOpacity>
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
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={18} color={Palette.white} />
            <Text style={styles.addBtnText}>새 조항 추가</Text>
          </TouchableOpacity>

          {shown.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons
                name="document-text-outline"
                size={40}
                color={Palette.line}
              />
              <Text style={styles.emptyText}>등록된 조항이 없습니다.</Text>
            </View>
          ) : (
            shown.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.card}
                onPress={() => openEdit(s)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardHeading}>{s.heading}</Text>
                  <Text style={styles.cardBody} numberOfLines={2}>
                    {s.body}
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
                  {isNew ? "새 조항 추가" : "조항 수정"}
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

              <Text style={styles.fieldLabel}>제목 (예: 제1조 (목적))</Text>
              <TextInput
                style={styles.input}
                value={draft.heading}
                onChangeText={(v) => setDraft((p) => ({ ...p, heading: v }))}
                placeholder="예: 제1조 (목적)"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>내용</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={draft.body}
                onChangeText={(v) => setDraft((p) => ({ ...p, body: v }))}
                placeholder="조항 내용을 입력해 주세요."
                placeholderTextColor={Palette.inkFaint}
                multiline
                textAlignVertical="top"
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
  tabRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Palette.white,
    borderRadius: Radius.pill,
    padding: 4,
    ...Shadow.card,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: Radius.pill,
  },
  tabItemActive: { backgroundColor: Palette.charcoal },
  tabText: { fontSize: 12, fontWeight: "600", color: Palette.inkSoft },
  tabTextActive: { color: Palette.cream },
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
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  cardHeading: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  cardBody: { fontSize: 12, color: Palette.inkSoft, marginTop: 4 },
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
  inputMultiline: { height: 140 },
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
