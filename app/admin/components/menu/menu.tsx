// app/admin/components/menu/menu.tsx
import { Ionicons } from "@expo/vector-icons";
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
  AdminMenuItem,
  createAdminMenu,
  deleteAdminMenu,
  getAdminMenus,
  hideAdminMenu,
  restoreAdminMenu,
  updateAdminMenu,
  uploadAdminMenuPhoto,
  UpsertMenuItemPayload,
} from "@/constants/adminMenuApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";
import { resolvePhotoUrl } from "@/constants/api";

const CATEGORIES = ["백숙", "고기", "사이드", "음료", "주류", "추가 메뉴"];

const EMPTY_DRAFT: UpsertMenuItemPayload = {
  category: "백숙",
  name: "",
  description: "",
  price: "",
  priceVal: 0,
  isHot: false,
  imageUrl: undefined,
  displayOrder: 0,
  active: true,
};

export default function AdminMenu() {
  const { adminPassword } = useContext(AdminContext);
  const [menus, setMenus] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminMenuItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<UpsertMenuItemPayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminMenus(adminPassword)
      .then(setMenus)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openEdit = (item: AdminMenuItem) => {
    setEditing(item);
    setIsNew(false);
    setDraft({
      category: item.category,
      name: item.name,
      description: item.description,
      price: item.price,
      priceVal: item.priceVal,
      isHot: item.isHot,
      imageUrl: item.imageUrl,
      displayOrder: item.displayOrder,
      active: item.active,
    });
  };

  const openCreate = (category: string) => {
    setEditing(null);
    setIsNew(true);
    setDraft({ ...EMPTY_DRAFT, category });
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("알림", "사진 접근 권한이 필요해요.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;
    if (!adminPassword) return;

    setUploadingPhoto(true);
    try {
      const url = await uploadAdminMenuPhoto(
        `data:image/jpeg;base64,${result.assets[0].base64}`,
        adminPassword,
      );
      setDraft((prev) => ({ ...prev, imageUrl: url }));
    } catch (e: any) {
      Alert.alert("알림", e.message || "사진 업로드에 실패했습니다.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!adminPassword) return;
    if (!draft.name.trim() || !draft.price.trim()) {
      Alert.alert("알림", "메뉴 이름과 가격을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createAdminMenu(draft, adminPassword);
      } else if (editing) {
        await updateAdminMenu(editing.id, draft, adminPassword);
      }
      setEditing(null);
      setIsNew(false);
      load();
    } catch (e: any) {
      Alert.alert("알림", e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: AdminMenuItem) => {
    if (!adminPassword) return;
    try {
      if (item.active) {
        await hideAdminMenu(item.id, adminPassword);
      } else {
        await restoreAdminMenu(item.id, adminPassword);
      }
      load();
    } catch (e: any) {
      Alert.alert("알림", e.message || "처리에 실패했습니다.");
    }
  };

  const handleDelete = (item: AdminMenuItem) => {
    Alert.alert(
      "메뉴 삭제",
      `"${item.name}"을(를) 완전히 삭제할까요?\n이 작업은 되돌릴 수 없어요.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            if (!adminPassword) return;
            try {
              await deleteAdminMenu(item.id, adminPassword);
              load();
            } catch (e: any) {
              Alert.alert("알림", e.message || "삭제에 실패했습니다.");
            }
          },
        },
      ],
    );
  };

  const closeModal = () => {
    setEditing(null);
    setIsNew(false);
  };

  const isModalOpen = isNew || !!editing;

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
          {CATEGORIES.map((cat) => {
            const items = menus.filter((m) => m.category === cat);
            return (
              <View key={cat} style={styles.categorySection}>
                <View style={styles.categoryHeaderRow}>
                  <Text style={styles.categoryTitle}>{cat}</Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => openCreate(cat)}
                  >
                    <Ionicons name="add" size={16} color={Palette.amberDeep} />
                    <Text style={styles.addBtnText}>메뉴 추가</Text>
                  </TouchableOpacity>
                </View>

                {items.length === 0 ? (
                  <Text style={styles.emptyText}>등록된 메뉴가 없습니다.</Text>
                ) : (
                  items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.card, !item.active && styles.cardHidden]}
                      activeOpacity={0.8}
                      onPress={() => openEdit(item)}
                    >
                      {item.imageUrl && resolvePhotoUrl(item.imageUrl) ? (
                        <Image
                          source={{ uri: resolvePhotoUrl(item.imageUrl)! }}
                          style={styles.thumb}
                        />
                      ) : (
                        <View style={[styles.thumb, styles.thumbPlaceholder]}>
                          <Ionicons
                            name="restaurant-outline"
                            size={20}
                            color={Palette.amberDeep}
                          />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          {item.isHot && (
                            <View style={styles.hotBadge}>
                              <Text style={styles.hotBadgeText}>인기</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.itemPrice}>{item.price}</Text>
                        {!item.active && (
                          <Text style={styles.hiddenLabel}>숨김 처리됨</Text>
                        )}
                      </View>
                      <Switch
                        value={item.active}
                        onValueChange={() => handleToggleActive(item)}
                        trackColor={{
                          false: Palette.line,
                          true: Palette.amberDeep,
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => handleDelete(item)}
                        hitSlop={8}
                        style={{ marginLeft: Spacing.sm, padding: 4 }}
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
              </View>
            );
          })}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>
                  {isNew ? "메뉴 추가" : "메뉴 수정"}
                </Text>
                <TouchableOpacity onPress={closeModal} hitSlop={10}>
                  <Ionicons name="close" size={22} color={Palette.inkFaint} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.photoPicker}
                onPress={handlePickPhoto}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator color={Palette.amberDeep} />
                ) : draft.imageUrl && resolvePhotoUrl(draft.imageUrl) ? (
                  <Image
                    source={{ uri: resolvePhotoUrl(draft.imageUrl)! }}
                    style={styles.photoPickerImage}
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

              <Text style={styles.fieldLabel}>카테고리</Text>
              <View style={styles.categoryPickRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryPick,
                      draft.category === cat && styles.categoryPickActive,
                    ]}
                    onPress={() => setDraft((p) => ({ ...p, category: cat }))}
                  >
                    <Text
                      style={[
                        styles.categoryPickText,
                        draft.category === cat && styles.categoryPickTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>메뉴 이름</Text>
              <TextInput
                style={styles.input}
                value={draft.name}
                onChangeText={(v) => setDraft((p) => ({ ...p, name: v }))}
                placeholder="예: 능이오리백숙"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>설명</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={draft.description}
                onChangeText={(v) =>
                  setDraft((p) => ({ ...p, description: v }))
                }
                placeholder="메뉴 설명을 입력해 주세요."
                placeholderTextColor={Palette.inkFaint}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>가격 (화면에 보일 문구)</Text>
              <TextInput
                style={styles.input}
                value={draft.price}
                onChangeText={(v) => setDraft((p) => ({ ...p, price: v }))}
                placeholder="예: 69,000원"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>
                가격 (숫자, 결제·합계 계산용)
              </Text>
              <TextInput
                style={styles.input}
                value={draft.priceVal ? String(draft.priceVal) : ""}
                onChangeText={(v) =>
                  setDraft((p) => ({
                    ...p,
                    priceVal: Number(v.replace(/[^0-9]/g, "")) || 0,
                  }))
                }
                placeholder="예: 69000"
                placeholderTextColor={Palette.inkFaint}
                keyboardType="number-pad"
              />

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>인기 메뉴 뱃지</Text>
                <Switch
                  value={draft.isHot}
                  onValueChange={(v) => setDraft((p) => ({ ...p, isHot: v }))}
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
                  <Text style={styles.saveBtnText}>
                    {isNew ? "메뉴 추가하기" : "저장하기"}
                  </Text>
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
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  scrollContent: { padding: Spacing.lg },
  categorySection: { marginBottom: Spacing.lg },
  categoryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  categoryTitle: { fontSize: 16, fontWeight: "800", color: Palette.ink },
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
    alignItems: "center",
    gap: Spacing.sm + 4,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  cardHidden: { opacity: 0.5 },
  thumb: { width: 52, height: 52, borderRadius: Radius.md },
  thumbPlaceholder: {
    backgroundColor: Palette.creamDim,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemName: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  itemPrice: { fontSize: 13, color: Palette.amberDeep, marginTop: 2 },
  hotBadge: {
    backgroundColor: "#B23A2E",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  hotBadgeText: { fontSize: 9, fontWeight: "700", color: Palette.white },
  hiddenLabel: { fontSize: 11, color: Palette.error, marginTop: 2 },
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
  photoPicker: {
    height: 120,
    borderRadius: Radius.lg,
    backgroundColor: Palette.creamDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  photoPickerImage: { width: "100%", height: "100%" },
  photoPickerText: { fontSize: 12, color: Palette.amberDeep, marginTop: 4 },
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
  inputMultiline: { height: 80 },
  categoryPickRow: { flexDirection: "row", gap: 6, marginBottom: Spacing.md },
  categoryPick: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Palette.creamDim,
  },
  categoryPickActive: { backgroundColor: Palette.charcoal },
  categoryPickText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: Palette.inkSoft,
  },
  categoryPickTextActive: { color: Palette.cream },
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
  saveBtnText: { fontSize: 15, fontWeight: "700", color: Palette.cream },
});
