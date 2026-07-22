// app/admin/(tabs)/seats.tsx
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
import { SafeAreaView } from "react-native-safe-area-context";

import { AdminContext } from "@/components/contexts/AdminContext";
import {
  AdminRoom,
  createAdminRoom,
  deleteAdminRoom,
  getAdminRooms,
  hideAdminRoom,
  restoreAdminRoom,
  updateAdminRoom,
  uploadAdminRoomPhoto,
  UpsertRoomPayload,
} from "@/constants/adminRoomApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";
import { resolvePhotoUrl } from "@/constants/api";

const EMPTY_DRAFT: UpsertRoomPayload = {
  number: "",
  floor: 1,
  category: "hall",
  categoryLabel: "일반 홀 좌석",
  capacity: "",
  isRoom: false,
  note: "",
  imageUrl: undefined,
  displayOrder: 0,
  active: true,
};

const CATEGORY_ORDER: { key: string; label: string; floor: number }[] = [
  { key: "hall", label: "일반 홀 좌석", floor: 1 },
  { key: "small", label: "프라이빗 룸 (소형)", floor: 1 },
  { key: "medium", label: "프라이빗 룸 (중형)", floor: 1 },
  { key: "large", label: "프라이빗 룸 (대형)", floor: 1 },
  { key: "group_room", label: "단체 룸 (소형)", floor: 2 },
  { key: "group_large", label: "단체 룸 (대형)", floor: 2 },
  { key: "group_hall", label: "대형 홀 (단체석)", floor: 2 },
];

export default function AdminSeats() {
  const { adminPassword } = useContext(AdminContext);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminRoom | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<UpsertRoomPayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminRooms(adminPassword)
      .then(setRooms)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openEdit = (room: AdminRoom) => {
    setEditing(room);
    setIsNew(false);
    setDraft({
      number: room.number,
      floor: room.floor,
      category: room.category,
      categoryLabel: room.categoryLabel,
      capacity: room.capacity,
      isRoom: room.isRoom,
      note: room.note,
      imageUrl: room.imageUrl,
      displayOrder: room.displayOrder,
      active: room.active,
    });
  };

  const openCreate = (cat: (typeof CATEGORY_ORDER)[number]) => {
    setEditing(null);
    setIsNew(true);
    setDraft({
      ...EMPTY_DRAFT,
      category: cat.key,
      categoryLabel: cat.label,
      floor: cat.floor,
      isRoom: cat.key !== "hall" && cat.key !== "group_hall",
    });
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
      const url = await uploadAdminRoomPhoto(
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
    if (!draft.number.trim() || !draft.capacity.trim()) {
      Alert.alert("알림", "번호와 인원수를 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createAdminRoom(draft, adminPassword);
      } else if (editing) {
        await updateAdminRoom(editing.id, draft, adminPassword);
      }
      closeModal();
      load();
    } catch (e: any) {
      Alert.alert("알림", e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (room: AdminRoom) => {
    if (!adminPassword) return;
    try {
      if (room.active) {
        await hideAdminRoom(room.id, adminPassword);
      } else {
        await restoreAdminRoom(room.id, adminPassword);
      }
      load();
    } catch (e: any) {
      Alert.alert("알림", e.message || "처리에 실패했습니다.");
    }
  };

  const handleDelete = (room: AdminRoom) => {
    Alert.alert(
      "좌석 삭제",
      `"${room.number}번" 좌석을 완전히 삭제할까요?\n이 작업은 되돌릴 수 없어요. 예전 예약 기록에 이 좌석이 표시돼 있었다면, 그 예약에서는 좌석 정보가 빈 값으로 보일 수 있어요.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            if (!adminPassword) return;
            try {
              await deleteAdminRoom(room.id, adminPassword);
              load();
            } catch (e: any) {
              Alert.alert("알림", e.message || "삭제에 실패했습니다.");
            }
          },
        },
      ],
    );
  };

  const isModalOpen = isNew || !!editing;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View>
            <Text style={styles.eyebrow}>SEAT MANAGEMENT</Text>
            <Text style={styles.headerTitle}>좌석 관리</Text>
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
          {[1, 2].map((floor) => (
            <View key={floor}>
              <Text style={styles.floorTitle}>{floor}층</Text>
              {CATEGORY_ORDER.filter((c) => c.floor === floor).map((cat) => {
                const items = rooms.filter((r) => r.category === cat.key);
                return (
                  <View key={cat.key} style={styles.categorySection}>
                    <View style={styles.categoryHeaderRow}>
                      <Text style={styles.categoryTitle}>{cat.label}</Text>
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => openCreate(cat)}
                      >
                        <Ionicons
                          name="add"
                          size={16}
                          color={Palette.amberDeep}
                        />
                        <Text style={styles.addBtnText}>좌석 추가</Text>
                      </TouchableOpacity>
                    </View>

                    {items.length === 0 ? (
                      <Text style={styles.emptyText}>
                        등록된 좌석이 없습니다.
                      </Text>
                    ) : (
                      items.map((room) => (
                        <TouchableOpacity
                          key={room.id}
                          style={[
                            styles.card,
                            !room.active && styles.cardHidden,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => openEdit(room)}
                        >
                          {room.imageUrl && resolvePhotoUrl(room.imageUrl) ? (
                            <Image
                              source={{ uri: resolvePhotoUrl(room.imageUrl)! }}
                              style={styles.thumb}
                            />
                          ) : (
                            <View
                              style={[styles.thumb, styles.thumbPlaceholder]}
                            >
                              <Ionicons
                                name={
                                  room.isRoom ? "home-outline" : "grid-outline"
                                }
                                size={20}
                                color={Palette.amberDeep}
                              />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemName}>{room.number}번</Text>
                            <Text style={styles.itemCapacity}>
                              {room.capacity}
                            </Text>
                            {!room.active && (
                              <Text style={styles.hiddenLabel}>
                                숨김 처리됨
                              </Text>
                            )}
                          </View>
                          <Switch
                            value={room.active}
                            onValueChange={() => handleToggleActive(room)}
                            trackColor={{
                              false: Palette.line,
                              true: Palette.amberDeep,
                            }}
                          />
                          <TouchableOpacity
                            onPress={() => handleDelete(room)}
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
            </View>
          ))}
          <View style={{ height: 100 }} />
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
                  {isNew ? "좌석 추가" : "좌석 수정"}
                </Text>
                <TouchableOpacity onPress={closeModal} hitSlop={10}>
                  <Ionicons name="close" size={22} color={Palette.inkFaint} />
                </TouchableOpacity>
              </View>

              <Text style={styles.categoryStaticLabel}>
                {draft.categoryLabel} · {draft.floor}층
              </Text>

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

              <Text style={styles.fieldLabel}>번호</Text>
              <TextInput
                style={styles.input}
                value={draft.number}
                onChangeText={(v) => setDraft((p) => ({ ...p, number: v }))}
                placeholder="예: 1"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>인원수 (화면에 보일 문구)</Text>
              <TextInput
                style={styles.input}
                value={draft.capacity}
                onChangeText={(v) => setDraft((p) => ({ ...p, capacity: v }))}
                placeholder="예: 4명 ~ 8명"
                placeholderTextColor={Palette.inkFaint}
              />

              <Text style={styles.fieldLabel}>비고 (선택사항)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={draft.note}
                onChangeText={(v) => setDraft((p) => ({ ...p, note: v }))}
                placeholder="예: 신발을 벗고 들어가는 룸입니다."
                placeholderTextColor={Palette.inkFaint}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>독립된 룸이에요</Text>
                <Switch
                  value={draft.isRoom}
                  onValueChange={(v) => setDraft((p) => ({ ...p, isRoom: v }))}
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
                    {isNew ? "좌석 추가하기" : "저장하기"}
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
  floorTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Palette.gold,
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  categorySection: { marginBottom: Spacing.lg },
  categoryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  categoryTitle: { fontSize: 15, fontWeight: "800", color: Palette.ink },
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
  itemName: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  itemCapacity: { fontSize: 13, color: Palette.amberDeep, marginTop: 2 },
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
    marginBottom: Spacing.sm,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: Palette.ink },
  categoryStaticLabel: {
    fontSize: 12,
    color: Palette.inkFaint,
    marginBottom: Spacing.md,
  },
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
