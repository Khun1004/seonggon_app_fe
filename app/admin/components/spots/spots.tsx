// app/admin/components/spots/spots.tsx
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
  AdminNearbySpot,
  createAdminSpot,
  deleteAdminSpot,
  getAdminSpots,
  updateAdminSpot,
  uploadAdminSpotPhoto,
  UpsertSpotPayload,
} from "@/constants/adminSpotApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";
import { resolvePhotoUrl } from "@/constants/api";

const EMPTY_DRAFT: UpsertSpotPayload = {
  name: "",
  description: "",
  icon: "flower-outline",
  imageUrl: undefined,
  sortOrder: 0,
};

export default function AdminNearbySpots() {
  const { adminPassword } = useContext(AdminContext);
  const [spots, setSpots] = useState<AdminNearbySpot[]>([]);
  const [spotsLoading, setSpotsLoading] = useState(true);
  const [editing, setEditing] = useState<AdminNearbySpot | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<UpsertSpotPayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadSpots = useCallback(() => {
    if (!adminPassword) return;
    setSpotsLoading(true);
    getAdminSpots(adminPassword)
      .then(setSpots)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setSpotsLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      loadSpots();
    }, [loadSpots]),
  );

  const openEdit = (spot: AdminNearbySpot) => {
    setEditing(spot);
    setIsNew(false);
    setDraft({
      name: spot.name,
      description: spot.description,
      icon: spot.icon,
      imageUrl: spot.imageUrl,
      sortOrder: spot.sortOrder,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setIsNew(true);
    setDraft({ ...EMPTY_DRAFT, sortOrder: spots.length + 1 });
  };

  const closeModal = () => {
    setEditing(null);
    setIsNew(false);
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
      const url = await uploadAdminSpotPhoto(
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
    if (!draft.name.trim()) {
      Alert.alert("알림", "명소 이름을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createAdminSpot(draft, adminPassword);
      } else if (editing) {
        await updateAdminSpot(editing.id, draft, adminPassword);
      }
      closeModal();
      loadSpots();
    } catch (e: any) {
      Alert.alert("알림", e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (spot: AdminNearbySpot) => {
    Alert.alert("명소 삭제", `"${spot.name}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          if (!adminPassword) return;
          try {
            await deleteAdminSpot(spot.id, adminPassword);
            loadSpots();
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
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionEyebrow}>HOME SCREEN</Text>
          <Text style={styles.sectionTitle}>주변 명소 관리</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={16} color={Palette.amberDeep} />
          <Text style={styles.addBtnText}>명소 추가</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionHint}>
        여기서 추가·수정한 내용이 손님 홈 화면의 "팔공산 근처 가볼만한 곳"에
        그대로 보여요.
      </Text>

      {spotsLoading ? (
        <ActivityIndicator
          color={Palette.amberDeep}
          style={{ marginTop: Spacing.lg }}
        />
      ) : spots.length === 0 ? (
        <Text style={styles.emptyText}>등록된 명소가 없습니다.</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {spots.map((spot) => (
            <TouchableOpacity
              key={spot.id}
              style={styles.spotCard}
              activeOpacity={0.8}
              onPress={() => openEdit(spot)}
            >
              {spot.imageUrl && resolvePhotoUrl(spot.imageUrl) ? (
                <Image
                  source={{ uri: resolvePhotoUrl(spot.imageUrl)! }}
                  style={styles.spotThumb}
                />
              ) : (
                <View style={[styles.spotThumb, styles.spotThumbPlaceholder]}>
                  <Ionicons
                    name={(spot.icon as any) || "location-outline"}
                    size={20}
                    color={Palette.amberDeep}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.spotName}>{spot.name}</Text>
                <Text style={styles.spotDesc} numberOfLines={1}>
                  {spot.description}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(spot)}
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
          ))}
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
                  {isNew ? "명소 추가" : "명소 수정"}
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
                    <Text style={styles.photoPickerText}>
                      사진 선택 (선택사항)
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>명소 이름</Text>
              <TextInput
                style={styles.input}
                value={draft.name}
                onChangeText={(v) => setDraft((p) => ({ ...p, name: v }))}
                placeholder="예: 동화사"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>설명</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={draft.description}
                onChangeText={(v) =>
                  setDraft((p) => ({ ...p, description: v }))
                }
                placeholder="한 줄 설명을 입력해 주세요."
                placeholderTextColor={Palette.inkFaint}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>순서 (작을수록 먼저 보여요)</Text>
              <TextInput
                style={styles.input}
                value={String(draft.sortOrder)}
                onChangeText={(v) =>
                  setDraft((p) => ({
                    ...p,
                    sortOrder: Number(v.replace(/[^0-9]/g, "")) || 0,
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
                    {isNew ? "명소 추가하기" : "저장하기"}
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
  container: { flex: 1, backgroundColor: Palette.cream, padding: Spacing.lg },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  sectionEyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: Palette.ink },
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
  sectionHint: {
    fontSize: 11.5,
    color: Palette.inkFaint,
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 12,
    color: Palette.inkFaint,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
  spotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 4,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  spotThumb: { width: 48, height: 48, borderRadius: Radius.md },
  spotThumbPlaceholder: {
    backgroundColor: Palette.creamDim,
    alignItems: "center",
    justifyContent: "center",
  },
  spotName: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  spotDesc: { fontSize: 12, color: Palette.inkFaint, marginTop: 2 },
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
  inputMultiline: { height: 70 },
  saveBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: Palette.cream },
});
