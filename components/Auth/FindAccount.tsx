// components/Auth/FindAccount.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  findId,
  resetPassword,
  sendPhoneCode,
  verifyPhoneCode,
} from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

type Mode = "find-id" | "reset-password";

export default function FindAccount() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("find-id");

  // 공통 — 전화번호 인증
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  // 아이디 찾기 결과
  const [foundLoginId, setFoundLoginId] = useState<string | null>(null);

  // 비밀번호 재설정
  const [loginId, setLoginId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [resetDone, setResetDone] = useState(false);

  const resetAllState = () => {
    setPhone("");
    setPhoneCode("");
    setIssuedCode(null);
    setPhoneVerified(false);
    setFoundLoginId(null);
    setLoginId("");
    setNewPassword("");
    setNewPasswordConfirm("");
    setResetDone(false);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    resetAllState();
  };

  const handleSendCode = async (isResend: boolean = false) => {
    if (!phone.trim()) {
      Alert.alert("알림", "전화번호를 입력해 주세요.");
      return;
    }
    setSendingCode(true);
    try {
      const code = await sendPhoneCode(phone.trim());
      setIssuedCode(code);
      setPhoneCode("");
      setSendingCode(false);
      Alert.alert(
        isResend ? "인증번호 재발급" : "인증번호 발급",
        `인증번호: ${code}\n(테스트용으로 화면에 표시됩니다)`,
      );
    } catch {
      setSendingCode(false);
      Alert.alert(
        "에러",
        "서버와 통신할 수 없습니다. 서버 주소를 확인해 주세요.",
      );
    }
  };

  const handleVerifyCode = async () => {
    if (!phoneCode.trim()) {
      Alert.alert("알림", "인증번호를 입력해 주세요.");
      return;
    }
    try {
      const ok = await verifyPhoneCode(phone.trim(), phoneCode.trim());
      setPhoneVerified(ok);
      Alert.alert(
        ok ? "인증 완료" : "인증 실패",
        ok
          ? "전화번호 인증이 완료되었습니다."
          : "인증번호가 일치하지 않습니다.",
      );
    } catch {
      Alert.alert("에러", "서버와 통신할 수 없습니다.");
    }
  };

  const handleFindId = async () => {
    try {
      const result = await findId(phone.trim());
      setFoundLoginId(result);
    } catch (e: any) {
      Alert.alert("오류", e.message || "아이디를 찾을 수 없습니다.");
    }
  };

  const handleResetPassword = async () => {
    if (!loginId.trim()) {
      Alert.alert("알림", "아이디를 입력해 주세요.");
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
    try {
      await resetPassword(loginId.trim(), phone.trim(), newPassword);
      setResetDone(true);
    } catch (e: any) {
      Alert.alert("오류", e.message || "비밀번호 변경에 실패했습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 탭 전환 */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, mode === "find-id" && styles.tabBtnActive]}
            onPress={() => switchMode("find-id")}
          >
            <Text
              style={[
                styles.tabBtnText,
                mode === "find-id" && styles.tabBtnTextActive,
              ]}
            >
              아이디 찾기
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              mode === "reset-password" && styles.tabBtnActive,
            ]}
            onPress={() => switchMode("reset-password")}
          >
            <Text
              style={[
                styles.tabBtnText,
                mode === "reset-password" && styles.tabBtnTextActive,
              ]}
            >
              비밀번호 찾기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 비밀번호 찾기일 때만 아이디 입력 필요 */}
        {mode === "reset-password" && (
          <View style={styles.card}>
            <Text style={styles.label}>아이디</Text>
            <TextInput
              style={styles.input}
              placeholder="아이디를 입력해 주세요"
              placeholderTextColor={Palette.inkFaint}
              value={loginId}
              onChangeText={setLoginId}
              autoCapitalize="none"
            />
          </View>
        )}

        {/* 전화번호 인증 카드 */}
        <View style={styles.card}>
          <Text style={styles.label}>전화번호</Text>
          <View style={styles.rowWithBtn}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="010-1234-5678"
              placeholderTextColor={Palette.inkFaint}
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                setPhoneVerified(false);
                setIssuedCode(null);
                setFoundLoginId(null);
                setResetDone(false);
              }}
              keyboardType="phone-pad"
              editable={!phoneVerified}
            />
            {!phoneVerified && !issuedCode && (
              <TouchableOpacity
                style={[
                  styles.smallBtn,
                  sendingCode && styles.smallBtnDisabled,
                ]}
                onPress={() => handleSendCode(false)}
                disabled={sendingCode}
              >
                <Text style={styles.smallBtnText}>
                  {sendingCode ? "발급 중" : "인증요청"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {issuedCode && !phoneVerified && (
            <View style={styles.codeSection}>
              <Text style={styles.label}>인증번호</Text>
              <View style={styles.rowWithBtn}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="인증번호 6자리"
                  placeholderTextColor={Palette.inkFaint}
                  value={phoneCode}
                  onChangeText={setPhoneCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={handleVerifyCode}
                >
                  <Text style={styles.smallBtnText}>확인</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => handleSendCode(true)}
                disabled={sendingCode}
              >
                <Ionicons name="refresh" size={13} color={Palette.amberDeep} />
                <Text style={styles.resendBtnText}>
                  {sendingCode ? "재발급 중..." : "인증번호 재요청"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {phoneVerified && (
            <View style={styles.verifiedBox}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={Palette.success}
              />
              <Text style={styles.verifiedBoxText}>
                전화번호 인증이 완료되었습니다.
              </Text>
            </View>
          )}
        </View>

        {/* 아이디 찾기 결과 */}
        {mode === "find-id" && phoneVerified && !foundLoginId && (
          <TouchableOpacity style={styles.submitBtn} onPress={handleFindId}>
            <Text style={styles.submitBtnText}>아이디 찾기</Text>
          </TouchableOpacity>
        )}

        {mode === "find-id" && foundLoginId && (
          <View style={styles.resultCard}>
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={Palette.success}
            />
            <Text style={styles.resultLabel}>회원님의 아이디는</Text>
            <Text style={styles.resultValue}>{foundLoginId}</Text>
            <TouchableOpacity
              style={styles.resultLoginBtn}
              onPress={() => router.replace("/login" as any)}
            >
              <Text style={styles.resultLoginBtnText}>로그인하러 가기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 비밀번호 재설정 */}
        {mode === "reset-password" && phoneVerified && !resetDone && (
          <View style={styles.card}>
            <Text style={styles.label}>새 비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="새 비밀번호 (6자 이상)"
              placeholderTextColor={Palette.inkFaint}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <Text style={[styles.label, { marginTop: Spacing.md }]}>
              새 비밀번호 확인
            </Text>
            <TextInput
              style={styles.input}
              placeholder="새 비밀번호 확인"
              placeholderTextColor={Palette.inkFaint}
              value={newPasswordConfirm}
              onChangeText={setNewPasswordConfirm}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.submitBtn, { marginTop: Spacing.lg }]}
              onPress={handleResetPassword}
            >
              <Text style={styles.submitBtnText}>비밀번호 변경</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === "reset-password" && resetDone && (
          <View style={styles.resultCard}>
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={Palette.success}
            />
            <Text style={styles.resultLabel}>비밀번호가 변경되었습니다.</Text>
            <TouchableOpacity
              style={styles.resultLoginBtn}
              onPress={() => router.replace("/login" as any)}
            >
              <Text style={styles.resultLoginBtnText}>로그인하러 가기</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },

  header: {
    backgroundColor: Palette.charcoal,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: { fontSize: 19, fontWeight: "700", color: Palette.cream },

  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  tabRow: {
    flexDirection: "row",
    backgroundColor: Palette.white,
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.pill,
  },
  tabBtnActive: {
    backgroundColor: Palette.charcoal,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.inkSoft,
  },
  tabBtnTextActive: {
    color: Palette.cream,
  },

  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkSoft,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: 14,
    color: Palette.ink,
  },
  rowWithBtn: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  smallBtn: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
    borderRadius: Radius.md,
  },
  smallBtnDisabled: {
    opacity: 0.5,
  },
  smallBtnText: {
    color: Palette.cream,
    fontSize: 12,
    fontWeight: "700",
  },

  codeSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: Spacing.sm + 4,
    paddingVertical: Spacing.sm,
  },
  resendBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.amberDeep,
  },

  verifiedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(91,123,90,0.1)",
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  verifiedBoxText: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.ink,
    flexShrink: 1,
  },

  submitBtn: {
    backgroundColor: Palette.charcoal,
    height: 54,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.card,
  },
  submitBtnText: { color: Palette.cream, fontSize: 15, fontWeight: "700" },

  resultCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadow.card,
  },
  resultLabel: {
    fontSize: 13,
    color: Palette.inkSoft,
    marginTop: Spacing.sm,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Palette.ink,
    marginBottom: Spacing.sm,
  },
  resultLoginBtn: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.pill,
    marginTop: Spacing.sm,
  },
  resultLoginBtnText: {
    color: Palette.cream,
    fontWeight: "700",
    fontSize: 13,
  },
});
