// app/admin/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { getAdminReservations, getAdminReviews } from "@/constants/adminApi";
import {
  AdminNearbySpot,
  createAdminSpot,
  deleteAdminSpot,
  getAdminSpots,
  updateAdminSpot,
  uploadAdminSpotPhoto,
  UpsertSpotPayload,
} from "@/constants/adminSpotApi";
import { resolvePhotoUrl } from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const EMPTY_DRAFT: UpsertSpotPayload = {
  name: "",
  description: "",
  icon: "flower-outline",
  imageUrl: undefined,
  sortOrder: 0,
};

export default function AdminHome() {
  const router = useRouter();
  const { isAdmin, loading, adminPassword, logout } = useContext(AdminContext);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [unrepliedCount, setUnrepliedCount] = useState<number | null>(null);
  const [spots, setSpots] = useState<AdminNearbySpot[]>([]);
  const [spotsLoading, setSpotsLoading] = useState(true);
  const [editing, setEditing] = useState<AdminNearbySpot | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<UpsertSpotPayload>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!loading && !isAdmin) {
        router.replace("/admin/login" as any);
      }
    }, [loading, isAdmin]),
  );

  const loadStats = useCallback(() => {
    if (!adminPassword) return;
    const todayStr = new Date().toISOString().slice(0, 10);

    getAdminReservations(adminPassword)
      .then((list) =>
        setTodayCount(
          list.filter((r) => r.date === todayStr && r.status !== "CANCELLED")
            .length,
        ),
      )
      .catch(() => {});

    getAdminReviews(adminPassword)
      .then((list) =>
        setUnrepliedCount(list.filter((r) => !r.ownerReply).length),
      )
      .catch(() => {});
  }, [adminPassword]);

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
      loadStats();
      loadSpots();
    }, [loadStats, loadSpots]),
  );

  const handleLogout = () => {
    Alert.alert("로그아웃", "관리자 화면에서 로그아웃 하시겠어요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/admin/login" as any);
        },
      },
    ]);
  };

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

  if (!isAdmin) return null;

  const isModalOpen = isNew || !!editing;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>OWNER DASHBOARD</Text>
              <Text style={styles.headerTitle}>사장님 관리자</Text>
            </View>
            <View style={styles.headerBtnRow}>
              <TouchableOpacity onPress={handleLogout} hitSlop={8}>
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color="rgba(251,246,238,0.7)"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)" as any)}
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color={Palette.cream} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statRow}>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => router.push("/admin/reservations" as any)}
          >
            <Ionicons name="calendar" size={18} color={Palette.amberDeep} />
            <Text style={styles.statValue}>{todayCount ?? "-"}</Text>
            <Text style={styles.statLabel}>오늘 예약</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => router.push("/admin/reviews" as any)}
          >
            <Ionicons name="chatbubbles" size={18} color={Palette.gold} />
            <Text style={styles.statValue}>{unrepliedCount ?? "-"}</Text>
            <Text style={styles.statLabel}>답변 대기 리뷰</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => router.push("/admin/menu" as any)}
          >
            <Ionicons name="restaurant" size={18} color="#6B3FA0" />
            <Text style={styles.statValue}>메뉴</Text>
            <Text style={styles.statLabel}>수정하기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
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
          spots.map((spot) => (
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
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: Spacing.sm,
  },
  headerBtnRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: Palette.cream },
  scrollContent: { padding: Spacing.lg },
  statRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    ...Shadow.card,
  },
  statValue: { fontSize: 16, fontWeight: "800", color: Palette.ink },
  statLabel: { fontSize: 10.5, color: Palette.inkFaint, textAlign: "center" },
  sectionHeaderRow: {
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
