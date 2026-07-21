// app/admin/(tabs)/info.tsx
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
  AdminStoreInfoSection,
  createAdminStoreInfo,
  deleteAdminStoreInfo,
  getAdminStoreInfo,
  updateAdminStoreInfo,
  UpsertStoreInfoPayload,
} from "@/constants/adminStoreInfoApi";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const GROUPS: { key: string; label: string }[] = [
  { key: "intro", label: "소개" },
  { key: "taste", label: "성공식당의 맛" },
  { key: "seats", label: "좌석 및 공간 (1층·2층 안내)" },
  { key: "directions", label: "오시는 길 및 주차" },
];

const EMPTY_DRAFT: UpsertStoreInfoPayload = {
  group: "seats",
  title: "",
  content: "",
  icon: "",
  displayOrder: 0,
  active: true,
};

export default function AdminInfo() {
  const { adminPassword } = useContext(AdminContext);
  const [sections, setSections] = useState<AdminStoreInfoSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminStoreInfoSection | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<UpsertStoreInfoPayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminStoreInfo(adminPassword)
      .then(setSections)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openEdit = (section: AdminStoreInfoSection) => {
    setEditing(section);
    setIsNew(false);
    setDraft({
      group: section.group,
      title: section.title,
      content: section.content,
      icon: section.icon,
      displayOrder: section.displayOrder,
      active: section.active,
    });
  };

  const openCreate = (groupKey: string) => {
    setEditing(null);
    setIsNew(true);
    const count = sections.filter((s) => s.group === groupKey).length;
    setDraft({ ...EMPTY_DRAFT, group: groupKey, displayOrder: count + 1 });
  };

  const closeModal = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!adminPassword) return;
    if (!draft.title.trim() || !draft.content.trim()) {
      Alert.alert("알림", "제목과 내용을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createAdminStoreInfo(draft, adminPassword);
      } else if (editing) {
        await updateAdminStoreInfo(editing.id, draft, adminPassword);
      }
      closeModal();
      load();
    } catch (e: any) {
      Alert.alert("알림", e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (section: AdminStoreInfoSection) => {
    Alert.alert("삭제", `"${section.title}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          if (!adminPassword) return;
          try {
            await deleteAdminStoreInfo(section.id, adminPassword);
            load();
          } catch (e: any) {
            Alert.alert("알림", e.message || "삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const isModalOpen = isNew || !!editing;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View>
            <Text style={styles.eyebrow}>STORE INFO</Text>
            <Text style={styles.headerTitle}>정보 관리</Text>
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
          {GROUPS.map((g) => {
            const items = sections
              .filter((s) => s.group === g.key)
              .sort((a, b) => a.displayOrder - b.displayOrder);
            return (
              <View key={g.key} style={styles.groupSection}>
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.groupTitle}>{g.label}</Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => openCreate(g.key)}
                  >
                    <Ionicons name="add" size={16} color={Palette.amberDeep} />
                    <Text style={styles.addBtnText}>내용 추가</Text>
                  </TouchableOpacity>
                </View>

                {items.length === 0 ? (
                  <Text style={styles.emptyText}>등록된 내용이 없습니다.</Text>
                ) : (
                  items.map((section) => (
                    <TouchableOpacity
                      key={section.id}
                      style={styles.card}
                      activeOpacity={0.8}
                      onPress={() => openEdit(section)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{section.title}</Text>
                        <Text style={styles.cardBody} numberOfLines={2}>
                          {section.content}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(section)}
                        hitSlop={8}
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={17}
                          color={Palette.error}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>
                  {isNew ? "내용 추가" : "내용 수정"}
                </Text>
                <TouchableOpacity onPress={closeModal} hitSlop={10}>
                  <Ionicons name="close" size={22} color={Palette.inkFaint} />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>분류</Text>
              <View style={styles.groupPickRow}>
                {GROUPS.map((g) => (
                  <TouchableOpacity
                    key={g.key}
                    style={[
                      styles.groupPick,
                      draft.group === g.key && styles.groupPickActive,
                    ]}
                    onPress={() => setDraft((p) => ({ ...p, group: g.key }))}
                  >
                    <Text
                      style={[
                        styles.groupPickText,
                        draft.group === g.key && styles.groupPickTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>제목</Text>
              <TextInput
                style={styles.input}
                value={draft.title}
                onChangeText={(v) => setDraft((p) => ({ ...p, title: v }))}
                placeholder="예: 1층 안내"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>내용</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={draft.content}
                onChangeText={(v) => setDraft((p) => ({ ...p, content: v }))}
                placeholder="손님께 보여줄 내용을 입력해 주세요."
                placeholderTextColor={Palette.inkFaint}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>순서 (작을수록 먼저 보여요)</Text>
              <TextInput
                style={styles.input}
                value={String(draft.displayOrder)}
                onChangeText={(v) =>
                  setDraft((p) => ({
                    ...p,
                    displayOrder: Number(v.replace(/[^0-9]/g, "")) || 0,
                  }))
                }
                placeholder="예: 1"
                placeholderTextColor={Palette.inkFaint}
                keyboardType="number-pad"
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Palette.white} />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {isNew ? "추가하기" : "저장하기"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Palette.cream },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: Spacing.lg },
  groupSection: { marginBottom: Spacing.lg },
  groupHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  groupTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: Palette.ink,
    flex: 1,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  addBtnText: { fontSize: 12, fontWeight: "700", color: Palette.amberDeep },
  emptyText: {
    fontSize: 12,
    color: Palette.inkFaint,
    marginBottom: Spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  cardBody: {
    fontSize: 12,
    color: Palette.inkFaint,
    marginTop: 3,
    lineHeight: 17,
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
    maxHeight: "88%",
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
  groupPickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: Spacing.md,
  },
  groupPick: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Palette.creamDim,
  },
  groupPickActive: { backgroundColor: Palette.charcoal },
  groupPickText: { fontSize: 11.5, fontWeight: "700", color: Palette.inkSoft },
  groupPickTextActive: { color: Palette.cream },
  input: {
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: 14,
    color: Palette.ink,
    marginBottom: Spacing.md,
  },
  inputMultiline: { height: 120 },
  saveBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: Palette.cream },
});
