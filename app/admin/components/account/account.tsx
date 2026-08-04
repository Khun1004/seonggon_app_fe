// app/admin/components/account/account.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AddressSearchModal from "@/components/common/AddressSearchModal";
import { AdminContext } from "@/components/contexts/AdminContext";
import {
  changeAdminPassword,
  getAdminAccount,
  updateAdminAccount,
  UpsertAdminAccountPayload,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

const EMPTY_DRAFT: UpsertAdminAccountPayload = {
  phone: "",
  address: "",
  bankName: "",
  accountNumber: "",
  accountHolder: "",
  businessName: "",
  businessNumber: "",
  representativeName: "",
  businessType: "",
  businessCategory: "",
};

export default function AdminAccountScreen() {
  const { adminPassword } = useContext(AdminContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<UpsertAdminAccountPayload>(EMPTY_DRAFT);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  // 비밀번호 변경 폼
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminAccount(adminPassword)
      .then((a) =>
        setDraft({
          phone: a.phone ?? "",
          address: a.address ?? "",
          bankName: a.bankName ?? "",
          accountNumber: a.accountNumber ?? "",
          accountHolder: a.accountHolder ?? "",
          businessName: a.businessName ?? "",
          businessNumber: a.businessNumber ?? "",
          representativeName: a.representativeName ?? "",
          businessType: a.businessType ?? "",
          businessCategory: a.businessCategory ?? "",
        }),
      )
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSave = async () => {
    if (!adminPassword) return;
    setSaving(true);
    try {
      await updateAdminAccount(draft, adminPassword);
      Alert.alert("알림", "저장되었습니다.");
    } catch (e: any) {
      Alert.alert("알림", e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!adminPassword) return;
    if (!currentPw.trim() || !newPw.trim() || !confirmPw.trim()) {
      Alert.alert("알림", "모든 비밀번호 칸을 입력해 주세요.");
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert("알림", "새 비밀번호가 서로 달라요. 다시 확인해 주세요.");
      return;
    }
    if (newPw.length < 4) {
      Alert.alert("알림", "새 비밀번호는 4자 이상으로 해주세요.");
      return;
    }
    setChangingPw(true);
    try {
      await changeAdminPassword(currentPw, newPw, adminPassword);
      Alert.alert(
        "알림",
        "비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용해 주세요.",
      );
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e: any) {
      Alert.alert("알림", e.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color={Palette.amberDeep} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hintBox}>
          <Ionicons
            name="lock-closed-outline"
            size={15}
            color={Palette.amberDeep}
          />
          <Text style={styles.hintText}>
            이 정보는 사장님만 볼 수 있어요. 손님 화면에는 노출되지 않아요.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>연락처 정보</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>전화번호</Text>
          <TextInput
            style={styles.input}
            value={draft.phone}
            onChangeText={(v) => setDraft((p) => ({ ...p, phone: v }))}
            placeholder="010-1234-5678"
            placeholderTextColor={Palette.inkFaint}
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>주소</Text>
          <TouchableOpacity
            style={styles.addressPicker}
            onPress={() => setAddressModalVisible(true)}
          >
            <Text
              style={[
                styles.addressPickerText,
                !draft.address && styles.addressPickerPlaceholder,
              ]}
              numberOfLines={1}
            >
              {draft.address || "주소를 검색해 주세요"}
            </Text>
            <Ionicons name="search" size={16} color={Palette.amberDeep} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>사업자 등록 정보</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>상호명</Text>
          <TextInput
            style={styles.input}
            value={draft.businessName}
            onChangeText={(v) => setDraft((p) => ({ ...p, businessName: v }))}
            placeholder="예: 성공식당"
            placeholderTextColor={Palette.inkFaint}
          />
          <Text style={styles.fieldLabel}>사업자등록번호</Text>
          <TextInput
            style={styles.input}
            value={draft.businessNumber}
            onChangeText={(v) => setDraft((p) => ({ ...p, businessNumber: v }))}
            placeholder="123-45-67890"
            placeholderTextColor={Palette.inkFaint}
            keyboardType="number-pad"
          />
          <Text style={styles.fieldLabel}>대표자명</Text>
          <TextInput
            style={styles.input}
            value={draft.representativeName}
            onChangeText={(v) =>
              setDraft((p) => ({ ...p, representativeName: v }))
            }
            placeholder="예: 홍길동"
            placeholderTextColor={Palette.inkFaint}
          />
          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>업태</Text>
              <TextInput
                style={styles.input}
                value={draft.businessType}
                onChangeText={(v) =>
                  setDraft((p) => ({ ...p, businessType: v }))
                }
                placeholder="예: 음식점업"
                placeholderTextColor={Palette.inkFaint}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>종목</Text>
              <TextInput
                style={styles.input}
                value={draft.businessCategory}
                onChangeText={(v) =>
                  setDraft((p) => ({ ...p, businessCategory: v }))
                }
                placeholder="예: 한식"
                placeholderTextColor={Palette.inkFaint}
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>정산 계좌 정보</Text>
        <View style={styles.card}>
          <View style={styles.bankIconRow}>
            <View style={styles.bankIconWrap}>
              <Ionicons
                name="business-outline"
                size={18}
                color={Palette.amberDeep}
              />
            </View>
            <Text style={styles.bankIconText}>
              결제 정산금이 들어올 계좌를 등록해 주세요.
            </Text>
          </View>

          <Text style={styles.fieldLabel}>은행명</Text>
          <TextInput
            style={styles.input}
            value={draft.bankName}
            onChangeText={(v) => setDraft((p) => ({ ...p, bankName: v }))}
            placeholder="예: 국민은행"
            placeholderTextColor={Palette.inkFaint}
          />
          <Text style={styles.fieldLabel}>계좌번호</Text>
          <TextInput
            style={styles.input}
            value={draft.accountNumber}
            onChangeText={(v) => setDraft((p) => ({ ...p, accountNumber: v }))}
            placeholder="'-' 없이 숫자만 입력"
            placeholderTextColor={Palette.inkFaint}
            keyboardType="number-pad"
          />
          <Text style={styles.fieldLabel}>예금주</Text>
          <TextInput
            style={styles.input}
            value={draft.accountHolder}
            onChangeText={(v) => setDraft((p) => ({ ...p, accountHolder: v }))}
            placeholder="예: 홍길동"
            placeholderTextColor={Palette.inkFaint}
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

        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>
          비밀번호 변경
        </Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>현재 비밀번호</Text>
          <TextInput
            style={styles.input}
            value={currentPw}
            onChangeText={setCurrentPw}
            placeholder="현재 비밀번호"
            placeholderTextColor={Palette.inkFaint}
            secureTextEntry
          />
          <Text style={styles.fieldLabel}>새 비밀번호</Text>
          <TextInput
            style={styles.input}
            value={newPw}
            onChangeText={setNewPw}
            placeholder="새 비밀번호 (4자 이상)"
            placeholderTextColor={Palette.inkFaint}
            secureTextEntry
          />
          <Text style={styles.fieldLabel}>새 비밀번호 확인</Text>
          <TextInput
            style={styles.input}
            value={confirmPw}
            onChangeText={setConfirmPw}
            placeholder="새 비밀번호 다시 입력"
            placeholderTextColor={Palette.inkFaint}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.changePwBtn, changingPw && { opacity: 0.6 }]}
            onPress={handleChangePassword}
            disabled={changingPw}
          >
            {changingPw ? (
              <ActivityIndicator color={Palette.amberDeep} />
            ) : (
              <Text style={styles.changePwBtnText}>비밀번호 변경</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      <AddressSearchModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onSelect={(address) => setDraft((p) => ({ ...p, address }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.cream,
  },
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: Palette.inkSoft,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  rowFields: { flexDirection: "row", gap: Spacing.sm },
  bankIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  bankIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Palette.amberSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  bankIconText: {
    flex: 1,
    fontSize: 11.5,
    color: Palette.inkFaint,
    lineHeight: 16,
  },
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
  addressPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  addressPickerText: { flex: 1, fontSize: 14, color: Palette.ink },
  addressPickerPlaceholder: { color: Palette.inkFaint },
  saveBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  saveBtnText: { color: Palette.white, fontWeight: "700", fontSize: 15 },
  changePwBtn: {
    backgroundColor: Palette.amberSoft,
    borderWidth: 1,
    borderColor: Palette.amber,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  changePwBtnText: {
    color: Palette.amberDeep,
    fontWeight: "700",
    fontSize: 15,
  },
});
