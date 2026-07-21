// components/Auth/MyInfo.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

import { useAuth } from "@/components/contexts/AuthContext";
import { useProfile } from "@/components/contexts/ProfileContext";
import { BASE_URL, changePassword, updateNickname } from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const DEFAULT_AVATAR =
  "https://icons.veryicon.com/png/o/miscellaneous/user-avatar/user-avatar-male-5.png";

export default function MyInfo() {
  const router = useRouter();
  const { user, signOut, updateNicknameLocal } = useAuth();
  const { profile } = useProfile();

  const avatarUri = user?.avatarUrl
    ? `${BASE_URL}${user.avatarUrl}`
    : profile?.avatarUri || DEFAULT_AVATAR;

  // 닉네임 수정 모달
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [newNickname, setNewNickname] = useState(user?.nickname ?? "");
  const [savingNickname, setSavingNickname] = useState(false);

  // 비밀번호 수정 모달
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleLogout = () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.back();
        },
      },
    ]);
  };

  const openNicknameModal = () => {
    setNewNickname(user?.nickname ?? "");
    setNicknameModalVisible(true);
  };

  const handleSaveNickname = async () => {
    if (!user) return;
    if (!newNickname.trim()) {
      Alert.alert("알림", "닉네임을 입력해 주세요.");
      return;
    }
    setSavingNickname(true);
    try {
      const result = await updateNickname(user.loginId, newNickname.trim());
      updateNicknameLocal(result.nickname);
      setSavingNickname(false);
      setNicknameModalVisible(false);
      Alert.alert("변경 완료", "닉네임이 변경되었습니다.");
    } catch (e: any) {
      setSavingNickname(false);
      Alert.alert("오류", e.message || "닉네임 변경에 실패했습니다.");
    }
  };

  const openPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");
    setPasswordModalVisible(true);
  };

  const handleSavePassword = async () => {
    if (!user) return;
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      Alert.alert("알림", "모든 항목을 입력해 주세요.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("알림", "새 비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      Alert.alert("알림", "새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(user.loginId, currentPassword, newPassword);
      setSavingPassword(false);
      setPasswordModalVisible(false);
      Alert.alert("변경 완료", "비밀번호가 변경되었습니다.");
    } catch (e: any) {
      setSavingPassword(false);
      Alert.alert("오류", e.message || "비밀번호 변경에 실패했습니다.");
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="person-circle-outline"
            size={48}
            color={Palette.line}
          />
          <Text style={styles.emptyText}>로그인이 필요한 화면입니다.</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/login" as any)}
          >
            <Text style={styles.loginBtnText}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileCard}>
          {/* 마이페이지에서 변경한 프로필 이미지가 그대로 반영됩니다. */}
          <Image source={{ uri: avatarUri }} style={styles.profileImage} />
          <Text style={styles.profileNickname}>{user.nickname} 님</Text>
          <Text style={styles.profileSub}>성공식당의 소중한 회원이에요</Text>
        </View>

        <Text style={styles.sectionTitle}>가입 정보</Text>
        <View style={styles.infoCard}>
          <TouchableOpacity
            style={[styles.infoRow, styles.infoRowBorder]}
            onPress={openNicknameModal}
            activeOpacity={0.6}
          >
            <View style={styles.infoLeft}>
              <Ionicons
                name="happy-outline"
                size={18}
                color={Palette.inkSoft}
              />
              <Text style={styles.infoLabel}>닉네임</Text>
            </View>
            <View style={styles.infoRight}>
              <Text style={styles.infoValue}>{user.nickname}</Text>
              <Ionicons
                name="chevron-forward"
                size={15}
                color={Palette.inkFaint}
              />
            </View>
          </TouchableOpacity>

          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <View style={styles.infoLeft}>
              <Ionicons name="at-outline" size={18} color={Palette.inkSoft} />
              <Text style={styles.infoLabel}>아이디</Text>
            </View>
            <View style={styles.infoRight}>
              <Text style={styles.infoValue}>{user.loginId}</Text>
              <View style={styles.lockedChip}>
                <Text style={styles.lockedChipText}>변경불가</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="call-outline" size={18} color={Palette.inkSoft} />
              <Text style={styles.infoLabel}>전화번호</Text>
            </View>
            <View style={styles.infoRight}>
              <Text style={styles.infoValue}>{profile?.phone || "-"}</Text>
              <View style={styles.lockedChip}>
                <Text style={styles.lockedChipText}>변경불가</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>보안</Text>
        <View style={styles.infoCard}>
          <TouchableOpacity
            style={styles.infoRow}
            onPress={openPasswordModal}
            activeOpacity={0.6}
          >
            <View style={styles.infoLeft}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={Palette.inkSoft}
              />
              <Text style={styles.infoLabel}>비밀번호 변경</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={15}
              color={Palette.inkFaint}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color={Palette.error} />
          <Text style={styles.logoutBtnText}>로그아웃</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 닉네임 변경 모달 */}
      <Modal
        visible={nicknameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNicknameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>닉네임 변경</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="새 닉네임을 입력해 주세요"
              placeholderTextColor={Palette.inkFaint}
              value={newNickname}
              onChangeText={setNewNickname}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnGhost}
                onPress={() => setNicknameModalVisible(false)}
              >
                <Text style={styles.modalBtnGhostText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnFilled}
                onPress={handleSaveNickname}
                disabled={savingNickname}
              >
                <Text style={styles.modalBtnFilledText}>
                  {savingNickname ? "저장 중..." : "저장"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 비밀번호 변경 모달 */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>비밀번호 변경</Text>

            <Text style={styles.modalLabel}>현재 비밀번호</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="현재 비밀번호"
              placeholderTextColor={Palette.inkFaint}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <Text style={styles.modalLabel}>새 비밀번호</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="새 비밀번호 (6자 이상)"
              placeholderTextColor={Palette.inkFaint}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Text style={styles.modalLabel}>새 비밀번호 확인</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="새 비밀번호 확인"
              placeholderTextColor={Palette.inkFaint}
              value={newPasswordConfirm}
              onChangeText={setNewPasswordConfirm}
              secureTextEntry
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalBtnGhost}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.modalBtnGhostText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnFilled}
                onPress={handleSavePassword}
                disabled={savingPassword}
              >
                <Text style={styles.modalBtnFilledText}>
                  {savingPassword ? "저장 중..." : "저장"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.card,
  },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Palette.ink },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: { color: Palette.inkFaint, fontSize: 14 },
  loginBtn: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.pill,
  },
  loginBtnText: { color: Palette.cream, fontWeight: "700", fontSize: 14 },

  scrollContent: { paddingHorizontal: Spacing.lg },

  profileCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Palette.gold,
    marginBottom: Spacing.sm + 4,
  },
  profileNickname: {
    fontSize: 17,
    fontWeight: "700",
    color: Palette.ink,
  },
  profileSub: {
    fontSize: 12,
    color: Palette.inkFaint,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.inkSoft,
    marginBottom: Spacing.sm + 4,
    marginTop: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 4,
  },
  infoRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoLabel: {
    fontSize: 13,
    color: Palette.inkSoft,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  lockedChip: {
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  lockedChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: Palette.inkFaint,
  },

  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: "rgba(162,62,62,0.08)",
    marginTop: Spacing.xl,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.error,
  },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.lg,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkSoft,
    marginBottom: Spacing.sm,
  },
  modalInput: {
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: 14,
    color: Palette.ink,
    marginBottom: Spacing.md,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalBtnGhost: {
    flex: 1,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.md,
    alignItems: "center",
    backgroundColor: Palette.creamDim,
  },
  modalBtnGhostText: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.inkSoft,
  },
  modalBtnFilled: {
    flex: 1,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.md,
    alignItems: "center",
    backgroundColor: Palette.charcoal,
  },
  modalBtnFilledText: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.cream,
  },
});
