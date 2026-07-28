// app/admin/components/ingredient-sets/ingredient-sets.tsx
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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { AdminContext } from "@/components/contexts/AdminContext";
import {
  AdminIngredientSet,
  AdminMenuIngredient,
  createAdminIngredientSet,
  deleteAdminIngredientSet,
  getAdminIngredientSets,
  updateAdminIngredientSet,
  uploadAdminMenuPhoto,
  UpsertIngredientSetPayload,
} from "@/constants/adminMenuApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";
import { resolvePhotoUrl } from "@/constants/api";

const EMPTY_DRAFT: UpsertIngredientSetPayload = {
  name: "",
  ingredients: [],
};

export default function AdminIngredientSets() {
  const { adminPassword } = useContext(AdminContext);
  const [sets, setSets] = useState<AdminIngredientSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminIngredientSet | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<UpsertIngredientSetPayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientImageUrl, setNewIngredientImageUrl] = useState<
    string | undefined
  >(undefined);
  const [uploadingIngredientPhoto, setUploadingIngredientPhoto] =
    useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminIngredientSets(adminPassword)
      .then(setSets)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openEdit = (set: AdminIngredientSet) => {
    setEditing(set);
    setIsNew(false);
    setDraft({ name: set.name, ingredients: set.ingredients });
  };

  const openCreate = () => {
    setEditing(null);
    setIsNew(true);
    setDraft(EMPTY_DRAFT);
  };

  const closeModal = () => {
    setEditing(null);
    setIsNew(false);
    setNewIngredientName("");
    setNewIngredientImageUrl(undefined);
  };

  const handlePickIngredientPhoto = async () => {
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

    setUploadingIngredientPhoto(true);
    try {
      const url = await uploadAdminMenuPhoto(
        `data:image/jpeg;base64,${result.assets[0].base64}`,
        adminPassword,
      );
      setNewIngredientImageUrl(url);
    } catch (e: any) {
      Alert.alert("알림", e.message || "사진 업로드에 실패했습니다.");
    } finally {
      setUploadingIngredientPhoto(false);
    }
  };

  const handleAddIngredient = () => {
    const name = newIngredientName.trim();
    if (!name) return;
    setDraft((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { name, imageUrl: newIngredientImageUrl },
      ],
    }));
    setNewIngredientName("");
    setNewIngredientImageUrl(undefined);
  };

  const handleRemoveIngredient = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!adminPassword) return;
    if (!draft.name.trim()) {
      Alert.alert("알림", "세트 이름을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createAdminIngredientSet(draft, adminPassword);
      } else if (editing) {
        await updateAdminIngredientSet(editing.id, draft, adminPassword);
      }
      closeModal();
      load();
    } catch (e: any) {
      Alert.alert("알림", e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (set: AdminIngredientSet) => {
    if (set.usedByCount > 0) {
      Alert.alert(
        "알림",
        `"${set.name}"은(는) 지금 ${set.usedByCount}개 메뉴에서 쓰고 있어서 삭제할 수 없어요. 먼저 그 메뉴들의 재료 세트를 다른 걸로 바꿔주세요.`,
      );
      return;
    }
    Alert.alert("세트 삭제", `"${set.name}" 세트를 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          if (!adminPassword) return;
          try {
            await deleteAdminIngredientSet(set.id, adminPassword);
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
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Palette.amberDeep} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Text style={styles.hint}>
              같은 재료를 쓰는 메뉴가 여러 개면, 여기서 세트를 하나 만들어 두고
              메뉴마다 이 세트를 골라서 연결하세요. 세트를 고치면 그 세트를 쓰는
              메뉴 전체에 자동으로 반영돼요.
            </Text>
            <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
              <Ionicons name="add" size={16} color={Palette.amberDeep} />
              <Text style={styles.addBtnText}>세트 추가</Text>
            </TouchableOpacity>
          </View>

          {sets.length === 0 ? (
            <Text style={styles.emptyText}>등록된 재료 세트가 없습니다.</Text>
          ) : (
            sets.map((set) => (
              <TouchableOpacity
                key={set.id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => openEdit(set)}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.setName}>{set.name}</Text>
                    <View style={styles.usageBadge}>
                      <Text style={styles.usageBadgeText}>
                        {set.usedByCount}개 메뉴에서 사용 중
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.setSub}>
                    재료 {set.ingredients.length}개
                    {set.ingredients.length > 0 &&
                      ` · ${set.ingredients.map((i) => i.name).join(", ")}`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(set)}
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
                  {isNew ? "재료 세트 추가" : "재료 세트 수정"}
                </Text>
                <TouchableOpacity onPress={closeModal} hitSlop={10}>
                  <Ionicons name="close" size={22} color={Palette.inkFaint} />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>세트 이름</Text>
              <TextInput
                style={styles.input}
                value={draft.name}
                onChangeText={(v) => setDraft((p) => ({ ...p, name: v }))}
                placeholder="예: 백숙 기본 버섯 11종"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>재료 목록</Text>
              {draft.ingredients.length > 0 && (
                <View style={styles.ingredientList}>
                  {draft.ingredients.map(
                    (ing: AdminMenuIngredient, idx: number) => (
                      <View key={idx} style={styles.ingredientChip}>
                        {ing.imageUrl && resolvePhotoUrl(ing.imageUrl) ? (
                          <Image
                            source={{ uri: resolvePhotoUrl(ing.imageUrl)! }}
                            style={styles.ingredientThumb}
                          />
                        ) : (
                          <View
                            style={[
                              styles.ingredientThumb,
                              styles.ingredientThumbPlaceholder,
                            ]}
                          >
                            <Ionicons
                              name="image-outline"
                              size={11}
                              color={Palette.inkFaint}
                            />
                          </View>
                        )}
                        <Text style={styles.ingredientChipText}>
                          {ing.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveIngredient(idx)}
                          hitSlop={6}
                        >
                          <Ionicons
                            name="close-circle"
                            size={16}
                            color={Palette.inkFaint}
                          />
                        </TouchableOpacity>
                      </View>
                    ),
                  )}
                </View>
              )}

              <View style={styles.ingredientAddRow}>
                <TouchableOpacity
                  style={styles.ingredientPhotoBtn}
                  onPress={handlePickIngredientPhoto}
                  disabled={uploadingIngredientPhoto}
                >
                  {uploadingIngredientPhoto ? (
                    <ActivityIndicator color={Palette.amberDeep} size="small" />
                  ) : newIngredientImageUrl &&
                    resolvePhotoUrl(newIngredientImageUrl) ? (
                    <Image
                      source={{ uri: resolvePhotoUrl(newIngredientImageUrl)! }}
                      style={styles.ingredientPhotoBtnImage}
                    />
                  ) : (
                    <Ionicons
                      name="camera-outline"
                      size={18}
                      color={Palette.amberDeep}
                    />
                  )}
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, styles.ingredientInput]}
                  value={newIngredientName}
                  onChangeText={setNewIngredientName}
                  placeholder="예: 표고버섯"
                  placeholderTextColor={Palette.inkFaint}
                  onSubmitEditing={handleAddIngredient}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.ingredientAddBtn}
                  onPress={handleAddIngredient}
                >
                  <Ionicons name="add" size={18} color={Palette.amberDeep} />
                </TouchableOpacity>
              </View>
              <Text style={styles.hintSmall}>
                사진 아이콘을 눌러 재료 사진을 먼저 올린 뒤, 이름을 입력하고
                추가해 주세요. 사진은 선택사항이에요.
              </Text>

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Palette.white} />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {isNew ? "세트 추가하기" : "저장하기"}
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
  headerRow: { marginBottom: Spacing.md },
  hint: {
    fontSize: 12,
    color: Palette.inkFaint,
    lineHeight: 17,
    marginBottom: Spacing.md,
  },
  hintSmall: {
    fontSize: 11,
    color: Palette.inkFaint,
    lineHeight: 15,
    marginBottom: Spacing.lg,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    backgroundColor: Palette.amberSoft,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
  },
  addBtnText: { fontSize: 13, fontWeight: "700", color: Palette.amberDeep },
  emptyText: {
    fontSize: 12,
    color: Palette.inkFaint,
    textAlign: "center",
    marginTop: Spacing.lg,
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
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  setName: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  usageBadge: {
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  usageBadgeText: { fontSize: 9.5, fontWeight: "700", color: Palette.inkSoft },
  setSub: { fontSize: 11.5, color: Palette.inkFaint, marginTop: 4 },
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
  input: {
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: 14,
    color: Palette.ink,
    marginBottom: Spacing.md,
  },
  ingredientList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: Spacing.sm,
  },
  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  ingredientThumb: { width: 20, height: 20, borderRadius: 10 },
  ingredientThumbPlaceholder: {
    backgroundColor: Palette.creamDim,
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  ingredientAddRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  ingredientInput: { flex: 1, marginBottom: 0 },
  ingredientPhotoBtn: {
    width: 44,
    height: 44,
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ingredientPhotoBtnImage: { width: "100%", height: "100%" },
  ingredientAddBtn: {
    width: 44,
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: Palette.cream },
});
