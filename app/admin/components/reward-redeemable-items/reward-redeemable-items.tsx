// app/admin/components/reward-redeemable-items/reward-redeemable-items.tsx
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
  AdminRewardRedeemableItem,
  createAdminRewardRedeemableItem,
  deleteAdminRewardRedeemableItem,
  getAdminRewardRedeemableItems,
  updateAdminRewardRedeemableItem,
  uploadRewardItemPhoto,
  UpsertRewardRedeemableItemPayload,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";
import { resolvePhotoUrl } from "@/constants/api";

const EMPTY_DRAFT: UpsertRewardRedeemableItemPayload = {
  name: "",
  price: 0,
  imageUrl: "",
  displayOrder: 0,
  active: true,
};

export default function AdminRewardRedeemableItems() {
  const { adminPassword } = useContext(AdminContext);
  const [items, setItems] = useState<AdminRewardRedeemableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminRewardRedeemableItem | null>(
    null,
  );
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] =
    useState<UpsertRewardRedeemableItemPayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminRewardRedeemableItems(adminPassword)
      .then(setItems)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openCreate = () => {
    setDraft({ ...EMPTY_DRAFT, displayOrder: items.length });
    setIsNew(true);
    setEditing({} as AdminRewardRedeemableItem);
  };

  const openEdit = (i: AdminRewardRedeemableItem) => {
    setDraft({
      name: i.name,
      price: i.price,
      imageUrl: i.imageUrl ?? "",
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

  const handlePickPhoto = async () => {
    if (!adminPassword) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("알림", "사진 보관함 접근 권한이 필요합니다.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setPhotoUploading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const url = await uploadRewardItemPhoto(base64, adminPassword);
      setDraft((p) => ({ ...p, imageUrl: url }));
    } catch (e: any) {
      Alert.alert("알림", e.message || "사진 업로드에 실패했습니다.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!adminPassword) return;
    if (!draft.name.trim() || !draft.price) {
      Alert.alert("알림", "이름과 가격을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createAdminRewardRedeemableItem(draft, adminPassword);
      } else if (editing) {
        await updateAdminRewardRedeemableItem(
          (editing as AdminRewardRedeemableItem).id,
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

  const handleDelete = (i: AdminRewardRedeemableItem) => {
    Alert.alert("항목 삭제", `"${i.name}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          if (!adminPassword) return;
          try {
            await deleteAdminRewardRedeemableItem(i.id, adminPassword);
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
              리뷰 적립금(1,500원)으로 교환할 수 있는 메뉴예요. 가격은 실제 메뉴
              가격과 같게 입력해 주세요.
            </Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={18} color={Palette.white} />
            <Text style={styles.addBtnText}>새 메뉴 추가</Text>
          </TouchableOpacity>

          {items.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons
                name="pricetag-outline"
                size={40}
                color={Palette.line}
              />
              <Text style={styles.emptyText}>등록된 메뉴가 없습니다.</Text>
            </View>
          ) : (
            items.map((i) => (
              <TouchableOpacity
                key={i.id}
                style={styles.card}
                onPress={() => openEdit(i)}
              >
                <View style={styles.cardImageWrap}>
                  {i.imageUrl ? (
                    <Image
                      source={{
                        uri: resolvePhotoUrl(i.imageUrl) ?? i.imageUrl,
                      }}
                      style={styles.cardImage}
                    />
                  ) : (
                    <Ionicons
                      name="image-outline"
                      size={20}
                      color={Palette.inkFaint}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{i.name}</Text>
                  <Text style={styles.cardPrice}>
                    {i.price.toLocaleString()}원
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
              placeholder="예: 도토리묵"
              placeholderTextColor={Palette.inkFaint}
            />

            <Text style={styles.fieldLabel}>가격 (원)</Text>
            <TextInput
              style={styles.input}
              value={draft.price ? String(draft.price) : ""}
              onChangeText={(v) =>
                setDraft((p) => ({
                  ...p,
                  price: Number(v.replace(/[^0-9]/g, "")) || 0,
                }))
              }
              keyboardType="number-pad"
              placeholder="예: 9000"
              placeholderTextColor={Palette.inkFaint}
            />

            <Text style={styles.fieldLabel}>사진 (선택)</Text>
            <TouchableOpacity
              style={styles.photoPicker}
              onPress={handlePickPhoto}
              disabled={photoUploading}
            >
              {photoUploading ? (
                <ActivityIndicator color={Palette.amberDeep} />
              ) : draft.imageUrl ? (
                <Image
                  source={{
                    uri: resolvePhotoUrl(draft.imageUrl) ?? draft.imageUrl,
                  }}
                  style={styles.photoPreview}
                />
              ) : (
                <>
                  <Ionicons
                    name="camera-outline"
                    size={22}
                    color={Palette.amberDeep}
                  />
                  <Text style={styles.photoPickerText}>사진 선택</Text>
                </>
              )}
            </TouchableOpacity>
            {!!draft.imageUrl && !photoUploading && (
              <TouchableOpacity
                onPress={() => setDraft((p) => ({ ...p, imageUrl: "" }))}
                style={styles.photoRemoveBtn}
              >
                <Text style={styles.photoRemoveBtnText}>사진 제거</Text>
              </TouchableOpacity>
            )}

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
  cardImageWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Palette.creamDim,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: "100%" },
  cardName: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  cardPrice: {
    fontSize: 12,
    color: Palette.amberDeep,
    marginTop: 2,
    fontWeight: "700",
  },
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
  photoPicker: {
    height: 90,
    borderRadius: Radius.md,
    backgroundColor: Palette.creamDim,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  photoPickerText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  photoPreview: { width: "100%", height: "100%" },
  photoRemoveBtn: {
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
  },
  photoRemoveBtnText: {
    fontSize: 11.5,
    color: Palette.error,
    fontWeight: "700",
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
