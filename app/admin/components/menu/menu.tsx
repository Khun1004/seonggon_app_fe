// app/admin/components/menu/menu.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
  AdminIngredientSet,
  AdminMenuIngredient,
  AdminMenuItem,
  createAdminIngredientSet,
  createAdminMenu,
  deleteAdminMenu,
  getAdminIngredientSets,
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

const FOOD_CATEGORIES = ["백숙", "고기", "사이드", "추가 메뉴"];
const DRINK_CATEGORIES = ["음료", "주류"];

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
  ingredients: [],
};

export default function AdminMenu() {
  const router = useRouter();
  const { group } = useLocalSearchParams<{ group?: string }>();
  const CATEGORIES = group === "drinks" ? DRINK_CATEGORIES : FOOD_CATEGORIES;
  const { adminPassword } = useContext(AdminContext);
  const [menus, setMenus] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminMenuItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<UpsertMenuItemPayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientImageUrl, setNewIngredientImageUrl] = useState<
    string | undefined
  >(undefined);
  const [uploadingIngredientPhoto, setUploadingIngredientPhoto] =
    useState(false);

  // 재료 세트 — 여러 메뉴가 함께 쓰는 재료 목록을 고를 수 있게 해줍니다.
  const [ingredientSets, setIngredientSets] = useState<AdminIngredientSet[]>(
    [],
  );
  const [useIngredientSet, setUseIngredientSet] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [creatingSet, setCreatingSet] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminMenus(adminPassword)
      .then(setMenus)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
    getAdminIngredientSets(adminPassword)
      .then(setIngredientSets)
      .catch(() => {});
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
      ingredientSetId: item.ingredientSetId,
      ingredients: item.extraIngredients ?? [],
    });
    setUseIngredientSet(item.ingredientSetId != null);
    setNewSetName("");
  };

  const openCreate = (category: string) => {
    setEditing(null);
    setIsNew(true);
    setDraft({ ...EMPTY_DRAFT, category });
    setUseIngredientSet(false);
    setNewSetName("");
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
    if (useIngredientSet && !draft.ingredientSetId) {
      Alert.alert("알림", "재료 세트를 선택해 주세요.");
      return;
    }
    // 세트를 쓰든 안 쓰든, ingredients는 항상 이 메뉴만의 추가 재료로
    // 보내요. 세트를 안 쓰면 세트 연결만 지웁니다.
    const payload: UpsertMenuItemPayload = useIngredientSet
      ? draft
      : { ...draft, ingredientSetId: undefined };
    setSaving(true);
    try {
      if (isNew) {
        await createAdminMenu(payload, adminPassword);
      } else if (editing) {
        await updateAdminMenu(editing.id, payload, adminPassword);
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

  // 목록 카드에서 수정 화면을 안 열고도 "인기" 뱃지를 바로 켜고 끌 수 있게
  // 해줍니다 — 나머지 필드는 그대로 두고 isHot만 바꿔서 저장해요.
  const handleToggleHot = async (item: AdminMenuItem) => {
    if (!adminPassword) return;
    try {
      await updateAdminMenu(
        item.id,
        {
          category: item.category,
          name: item.name,
          description: item.description,
          price: item.price,
          priceVal: item.priceVal,
          isHot: !item.isHot,
          imageUrl: item.imageUrl,
          displayOrder: item.displayOrder,
          active: item.active,
          ingredients: item.ingredients,
        },
        adminPassword,
      );
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
        ...(prev.ingredients ?? []),
        { name, imageUrl: newIngredientImageUrl },
      ],
    }));
    setNewIngredientName("");
    setNewIngredientImageUrl(undefined);
  };

  const handleRemoveIngredient = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      ingredients: (prev.ingredients ?? []).filter((_, i) => i !== index),
    }));
  };

  // 기존 세트의 재료를 이 메뉴의 "직접 입력" 목록으로 복사해옵니다 —
  // 세트에 연결되는 게 아니라, 그 내용을 그대로 복사만 해오는 거라서
  // 이후 자유롭게 재료를 더 추가하거나 뺄 수 있어요 (예: 세트 11개 +
  // 능이버섯 + 오리고기 = 이 메뉴만의 13개).
  const [showLoadFromSet, setShowLoadFromSet] = useState(false);
  const handleLoadFromSet = (set: AdminIngredientSet) => {
    setDraft((prev) => ({
      ...prev,
      ingredients: [...set.ingredients],
    }));
    setShowLoadFromSet(false);
  };

  // 지금 이 메뉴에 직접 입력해둔 재료들을, 새 "재료 세트"로 승격시켜서
  // 다른 메뉴에서도 바로 골라 쓸 수 있게 해줍니다. 이 메뉴는 자동으로
  // 그 새 세트를 쓰도록 바뀝니다.
  const handlePromoteToSet = async () => {
    if (!adminPassword) return;
    const name = newSetName.trim();
    if (!name) {
      Alert.alert("알림", "세트 이름을 입력해 주세요.");
      return;
    }
    if (!draft.ingredients || draft.ingredients.length === 0) {
      Alert.alert("알림", "먼저 재료를 하나 이상 추가해 주세요.");
      return;
    }
    setCreatingSet(true);
    try {
      const newSet = await createAdminIngredientSet(
        { name, ingredients: draft.ingredients },
        adminPassword,
      );
      setIngredientSets((prev) =>
        [...prev, newSet].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setDraft((prev) => ({
        ...prev,
        ingredientSetId: newSet.id,
        ingredients: [],
      }));
      setUseIngredientSet(true);
      setNewSetName("");
      Alert.alert("알림", `"${name}" 세트를 만들고 이 메뉴에 연결했어요.`);
    } catch (e: any) {
      Alert.alert("알림", e.message || "세트 만들기에 실패했습니다.");
    } finally {
      setCreatingSet(false);
    }
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
                          <TouchableOpacity
                            onPress={() => handleToggleHot(item)}
                            hitSlop={6}
                            style={[
                              styles.hotToggle,
                              item.isHot && styles.hotToggleActive,
                            ]}
                          >
                            <Ionicons
                              name={item.isHot ? "flame" : "flame-outline"}
                              size={11}
                              color={
                                item.isHot ? Palette.white : Palette.inkFaint
                              }
                            />
                            <Text
                              style={[
                                styles.hotToggleText,
                                item.isHot && styles.hotToggleTextActive,
                              ]}
                            >
                              인기
                            </Text>
                          </TouchableOpacity>
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

              <Text style={styles.fieldLabel}>
                종류 (재료 목록 — 백숙에 들어간 버섯 등)
              </Text>

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabelInline}>재료 세트 사용</Text>
                <Switch
                  value={useIngredientSet}
                  onValueChange={setUseIngredientSet}
                  trackColor={{ false: Palette.line, true: Palette.amberDeep }}
                />
              </View>

              {useIngredientSet && (
                <View style={styles.setPickerBox}>
                  {ingredientSets.length === 0 ? (
                    <Text style={styles.hint}>
                      아직 만들어둔 재료 세트가 없어요. "마이 → 재료 세트
                      관리"에서 먼저 만들어 주세요.
                    </Text>
                  ) : (
                    ingredientSets.map((set) => {
                      const selected = draft.ingredientSetId === set.id;
                      return (
                        <TouchableOpacity
                          key={set.id}
                          style={[
                            styles.setOption,
                            selected && styles.setOptionSelected,
                          ]}
                          onPress={() =>
                            setDraft((p) => ({ ...p, ingredientSetId: set.id }))
                          }
                        >
                          <Ionicons
                            name={
                              selected ? "radio-button-on" : "radio-button-off"
                            }
                            size={18}
                            color={
                              selected ? Palette.amberDeep : Palette.inkFaint
                            }
                          />
                          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                            <Text style={styles.setOptionName}>{set.name}</Text>
                            <Text style={styles.setOptionSub}>
                              재료 {set.ingredients.length}개 ·{" "}
                              {set.usedByCount}개 메뉴에서 사용 중
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                  <TouchableOpacity
                    style={styles.manageSetsLink}
                    onPress={() => {
                      closeModal();
                      router.push("/admin/ingredient-sets" as any);
                    }}
                  >
                    <Ionicons
                      name="settings-outline"
                      size={13}
                      color={Palette.amberDeep}
                    />
                    <Text style={styles.manageSetsLinkText}>
                      재료 세트 관리하러 가기
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 추가 재료 — 세트를 쓰든 안 쓰든 이 목록이 항상 이 메뉴만의
                  재료예요. 세트를 쓰면 손님 화면에서 세트 재료 뒤에 이어붙어서
                  보여요 (예: 백숙 기본 11종 + 능이버섯 + 오리고기). */}
              <Text style={styles.fieldLabel}>
                {useIngredientSet
                  ? "추가 재료 (이 메뉴에만 더 들어가는 재료)"
                  : "재료 목록"}
              </Text>

              {!useIngredientSet && ingredientSets.length > 0 && (
                <>
                  <TouchableOpacity
                    style={styles.loadFromSetBtn}
                    onPress={() => setShowLoadFromSet((v) => !v)}
                  >
                    <Ionicons
                      name="download-outline"
                      size={14}
                      color={Palette.amberDeep}
                    />
                    <Text style={styles.loadFromSetBtnText}>
                      기존 세트에서 불러와서 시작하기
                    </Text>
                  </TouchableOpacity>
                  {showLoadFromSet && (
                    <View style={styles.setPickerBox}>
                      {ingredientSets.map((set) => (
                        <TouchableOpacity
                          key={set.id}
                          style={styles.setOption}
                          onPress={() => handleLoadFromSet(set)}
                        >
                          <Ionicons
                            name="download-outline"
                            size={16}
                            color={Palette.inkFaint}
                          />
                          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                            <Text style={styles.setOptionName}>{set.name}</Text>
                            <Text style={styles.setOptionSub}>
                              재료 {set.ingredients.length}개 불러오기
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <Text style={styles.hint}>
                    불러오면 이 목록에 그대로 복사돼요 (세트에 연결되는 게
                    아니에요). 불러온 뒤 이 메뉴에만 필요한 재료를 자유롭게 더
                    추가하거나 뺄 수 있어요.
                  </Text>
                </>
              )}

              {(draft.ingredients ?? []).length > 0 && (
                <View style={styles.ingredientList}>
                  {(draft.ingredients ?? []).map(
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
                      source={{
                        uri: resolvePhotoUrl(newIngredientImageUrl)!,
                      }}
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
              <Text style={styles.hint}>
                사진 아이콘을 눌러 재료 사진을 먼저 올린 뒤, 이름을 입력하고
                추가해 주세요. 사진은 선택사항이에요.
              </Text>

              {!useIngredientSet && (draft.ingredients ?? []).length > 0 && (
                <View style={styles.promoteBox}>
                  <Text style={styles.promoteLabel}>
                    이 재료들, 다른 메뉴에서도 재사용하고 싶다면?
                  </Text>
                  <View style={styles.promoteRow}>
                    <TextInput
                      style={[styles.input, styles.promoteInput]}
                      value={newSetName}
                      onChangeText={setNewSetName}
                      placeholder="예: 백숙 기본 버섯 11종"
                      placeholderTextColor={Palette.inkFaint}
                    />
                    <TouchableOpacity
                      style={[
                        styles.promoteBtn,
                        creatingSet && { opacity: 0.6 },
                      ]}
                      onPress={handlePromoteToSet}
                      disabled={creatingSet}
                    >
                      {creatingSet ? (
                        <ActivityIndicator color={Palette.white} size="small" />
                      ) : (
                        <Text style={styles.promoteBtnText}>세트로 저장</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

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
  hotToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  hotToggleActive: { backgroundColor: "#B23A2E" },
  hotToggleText: { fontSize: 9, fontWeight: "700", color: Palette.inkFaint },
  hotToggleTextActive: { color: Palette.white },
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
  fieldLabelInline: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkSoft,
  },
  setPickerBox: { marginBottom: Spacing.lg },
  setOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    padding: Spacing.sm + 4,
    marginBottom: Spacing.sm,
  },
  setOptionSelected: {
    backgroundColor: Palette.amberSoft,
    borderWidth: 1,
    borderColor: Palette.amberDeep,
  },
  setOptionName: { fontSize: 13.5, fontWeight: "700", color: Palette.ink },
  setOptionSub: { fontSize: 11, color: Palette.inkFaint, marginTop: 2 },
  manageSetsLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: Spacing.sm + 2,
  },
  manageSetsLinkText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  loadFromSetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.sm,
  },
  loadFromSetBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  promoteBox: {
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    padding: Spacing.sm + 4,
    marginBottom: Spacing.lg,
  },
  promoteLabel: {
    fontSize: 11.5,
    color: Palette.inkSoft,
    marginBottom: Spacing.sm,
  },
  promoteRow: { flexDirection: "row", gap: 8 },
  promoteInput: { flex: 1, marginBottom: 0 },
  promoteBtn: {
    backgroundColor: Palette.amberDeep,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  promoteBtnText: { fontSize: 12.5, fontWeight: "700", color: Palette.white },
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
  hint: {
    fontSize: 11,
    color: Palette.inkFaint,
    lineHeight: 15,
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
