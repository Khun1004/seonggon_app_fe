// app/admin/components/notices/notices.tsx
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
  AdminNotice,
  createAdminNotice,
  deleteAdminNotice,
  getAdminNotices,
  updateAdminNotice,
  UpsertNoticePayload,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

const EMPTY_DRAFT: UpsertNoticePayload = {
  date: "",
  title: "",
  content: "",
  active: true,
};

export default function AdminNotices() {
  const { adminPassword } = useContext(AdminContext);
  const [notices, setNotices] = useState<AdminNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminNotice | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<UpsertNoticePayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminNotices(adminPassword)
      .then(setNotices)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setIsNew(true);
    setEditing({} as AdminNotice);
  };

  const openEdit = (n: AdminNotice) => {
    setDraft({
      date: n.date,
      title: n.title,
      content: n.content,
      active: n.active,
    });
    setIsNew(false);
    setEditing(n);
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
        await createAdminNotice(draft, adminPassword);
      } else if (editing) {
        await updateAdminNotice(
          (editing as AdminNotice).id,
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

  const handleDelete = (n: AdminNotice) => {
    Alert.alert("공지 삭제", `"${n.title}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          if (!adminPassword) return;
          try {
            await deleteAdminNotice(n.id, adminPassword);
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
            <Text style={styles.addBtnText}>새 공지 추가</Text>
          </TouchableOpacity>

          {notices.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons
                name="megaphone-outline"
                size={40}
                color={Palette.line}
              />
              <Text style={styles.emptyText}>등록된 공지가 없습니다.</Text>
            </View>
          ) : (
            notices.map((n) => (
              <TouchableOpacity
                key={n.id}
                style={styles.card}
                onPress={() => openEdit(n)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardDate}>{n.date}</Text>
                  <Text style={styles.cardTitle}>{n.title}</Text>
                  <Text style={styles.cardContent} numberOfLines={2}>
                    {n.content}
                  </Text>
                  {!n.active && (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>비활성</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(n)}
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
                  {isNew ? "새 공지 추가" : "공지 수정"}
                </Text>
                <TouchableOpacity onPress={closeModal} hitSlop={10}>
                  <Ionicons name="close" size={22} color={Palette.inkFaint} />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>날짜 (비워두면 오늘)</Text>
              <TextInput
                style={styles.input}
                value={draft.date}
                onChangeText={(v) => setDraft((p) => ({ ...p, date: v }))}
                placeholder="2026-07-30"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>제목</Text>
              <TextInput
                style={styles.input}
                value={draft.title}
                onChangeText={(v) => setDraft((p) => ({ ...p, title: v }))}
                placeholder="예: 여름철 영업시간 안내"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>내용</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={draft.content}
                onChangeText={(v) => setDraft((p) => ({ ...p, content: v }))}
                placeholder="공지 내용을 입력해 주세요."
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
  cardDate: { fontSize: 11, color: Palette.inkFaint },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
    marginTop: 2,
  },
  cardContent: { fontSize: 12, color: Palette.inkSoft, marginTop: 4 },
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
  inputMultiline: { height: 120 },
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
