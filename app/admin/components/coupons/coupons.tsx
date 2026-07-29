// app/admin/components/coupons/coupons.tsx
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
  AdminCoupon,
  createAdminCoupon,
  deleteAdminCoupon,
  getAdminCouponNotice,
  getAdminCoupons,
  updateAdminCoupon,
  updateAdminCouponNotice,
  UpsertCouponPayload,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

const EMPTY_DRAFT: UpsertCouponPayload = {
  title: "",
  subtitle: "",
  icon: "pricetag-outline",
  count: "",
  displayOrder: 0,
  active: true,
};

const ICON_OPTIONS = [
  "restaurant-outline",
  "beer-outline",
  "leaf-outline",
  "pricetag-outline",
  "gift-outline",
  "cafe-outline",
];

export default function AdminCoupons() {
  const { adminPassword } = useContext(AdminContext);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<UpsertCouponPayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [noticeContent, setNoticeContent] = useState("");
  const [savingNotice, setSavingNotice] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminCoupons(adminPassword)
      .then(setCoupons)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
    getAdminCouponNotice(adminPassword)
      .then((n) => setNoticeContent(n.content))
      .catch(() => {});
  }, [adminPassword]);

  const handleSaveNotice = async () => {
    if (!adminPassword) return;
    setSavingNotice(true);
    try {
      await updateAdminCouponNotice(noticeContent, adminPassword);
      Alert.alert("알림", "저장되었습니다.");
    } catch (e: any) {
      Alert.alert("알림", e.message || "저장에 실패했습니다.");
    } finally {
      setSavingNotice(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openCreate = () => {
    setDraft({ ...EMPTY_DRAFT, displayOrder: coupons.length });
    setIsNew(true);
    setEditing({} as AdminCoupon);
  };

  const openEdit = (c: AdminCoupon) => {
    setDraft({
      title: c.title,
      subtitle: c.subtitle,
      icon: c.icon,
      count: c.count ?? "",
      displayOrder: c.displayOrder,
      active: c.active,
    });
    setIsNew(false);
    setEditing(c);
  };

  const closeModal = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!adminPassword) return;
    if (!draft.title.trim() || !draft.subtitle.trim()) {
      Alert.alert("알림", "제목과 부제목을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...draft, count: draft.count?.trim() || undefined };
      if (isNew) {
        await createAdminCoupon(payload, adminPassword);
      } else if (editing) {
        await updateAdminCoupon(
          (editing as AdminCoupon).id,
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

  const handleDelete = (c: AdminCoupon) => {
    Alert.alert("쿠폰 삭제", `"${c.title}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          if (!adminPassword) return;
          try {
            await deleteAdminCoupon(c.id, adminPassword);
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
            <Text style={styles.addBtnText}>새 쿠폰 추가</Text>
          </TouchableOpacity>

          {coupons.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons
                name="pricetag-outline"
                size={40}
                color={Palette.line}
              />
              <Text style={styles.emptyText}>등록된 쿠폰이 없습니다.</Text>
            </View>
          ) : (
            coupons.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.card}
                onPress={() => openEdit(c)}
              >
                <View style={styles.cardIconWrap}>
                  <Ionicons
                    name={c.icon as any}
                    size={22}
                    color={Palette.amberDeep}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardSubtitle}>{c.subtitle}</Text>
                  <Text style={styles.cardTitle}>{c.title}</Text>
                  {c.count && <Text style={styles.cardCount}>{c.count}</Text>}
                  {!c.active && (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>비활성</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(c)}
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

          <Text style={styles.sectionTitle}>"꼭 읽어주세요!" 안내 문구</Text>
          <Text style={styles.sectionSubText}>
            한 줄에 안내 항목 하나씩 입력해 주세요. 손님 화면에서 각 줄이 점(•)
            하나로 나와요.
          </Text>
          <TextInput
            style={styles.noticeInput}
            value={noticeContent}
            onChangeText={setNoticeContent}
            multiline
            textAlignVertical="top"
            placeholder="예: 리뷰를 작성하시기 전, 꼭 직원에게 영수증 요청을 해주세요."
            placeholderTextColor={Palette.inkFaint}
          />
          <TouchableOpacity
            style={[styles.saveNoticeBtn, savingNotice && { opacity: 0.6 }]}
            onPress={handleSaveNotice}
            disabled={savingNotice}
          >
            {savingNotice ? (
              <ActivityIndicator color={Palette.white} />
            ) : (
              <Text style={styles.saveBtnText}>안내 문구 저장</Text>
            )}
          </TouchableOpacity>

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
                  {isNew ? "새 쿠폰 추가" : "쿠폰 수정"}
                </Text>
                <TouchableOpacity onPress={closeModal} hitSlop={10}>
                  <Ionicons name="close" size={22} color={Palette.inkFaint} />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>제목</Text>
              <TextInput
                style={styles.input}
                value={draft.title}
                onChangeText={(v) => setDraft((p) => ({ ...p, title: v }))}
                placeholder="예: 도토리묵 증정"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>부제목 (조건)</Text>
              <TextInput
                style={styles.input}
                value={draft.subtitle}
                onChangeText={(v) => setDraft((p) => ({ ...p, subtitle: v }))}
                placeholder="예: 네이버 포토리뷰 작성 시"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>수량 안내 (선택)</Text>
              <TextInput
                style={styles.input}
                value={draft.count}
                onChangeText={(v) => setDraft((p) => ({ ...p, count: v }))}
                placeholder="예: 총 3매 제공"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>아이콘</Text>
              <View style={styles.iconRow}>
                {ICON_OPTIONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconChip,
                      draft.icon === icon && styles.iconChipActive,
                    ]}
                    onPress={() => setDraft((p) => ({ ...p, icon }))}
                  >
                    <Ionicons
                      name={icon as any}
                      size={18}
                      color={
                        draft.icon === icon ? Palette.white : Palette.amberDeep
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>

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
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Palette.amberSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardSubtitle: { fontSize: 11, color: Palette.inkFaint },
  cardTitle: { fontSize: 15, fontWeight: "700", color: Palette.ink },
  cardCount: { fontSize: 11, color: Palette.amberDeep, marginTop: 2 },
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Palette.ink,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sectionSubText: {
    fontSize: 11.5,
    color: Palette.inkFaint,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  noticeInput: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: 13,
    color: Palette.ink,
    minHeight: 130,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  saveNoticeBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
});
