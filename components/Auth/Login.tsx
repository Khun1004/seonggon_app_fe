// components/Auth/Login.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/components/contexts/AuthContext";
import { useProfile } from "@/components/contexts/ProfileContext";
import { login } from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { profile, saveProfile } = useProfile();

  const [loginId, setLoginId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    loginId.trim().length > 0 &&
    phone.trim().length > 0 &&
    password.trim().length > 0;

  const handleLogin = async () => {
    if (!canSubmit) {
      Alert.alert("알림", "아이디, 전화번호, 비밀번호를 모두 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const result = await login({
        loginId: loginId.trim(),
        phone: phone.trim(),
        password,
      });
      await signIn({
        nickname: result.nickname,
        loginId: result.loginId,
        avatarUrl: result.avatarUrl || undefined,
      });
      // 로그인 시 서버에 저장된 전화번호 + (없으면 닉네임으로) 성함을 이 기기에도
      // 동기화해둡니다. 예약 화면의 "예약자 연락처/성함"이 로그인만 해도 바로
      // 채워지고, 전화번호 기준으로 동작하는 방문 도장도 새 기기에서 바로 보여요.
      await saveProfile({
        name: profile?.name || result.nickname,
        phone: result.phone || profile?.phone || "",
      });
      Alert.alert("로그인 성공", `${result.nickname}님, 환영합니다!`, [
        {
          text: "확인",
          onPress: () => router.replace("/(tabs)" as any),
        },
      ]);
    } catch (e: any) {
      Alert.alert(
        "로그인 실패",
        e.message || "아이디 또는 비밀번호를 확인해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={20} color={Palette.cream} />
          </TouchableOpacity>
          <View>
            <Text style={styles.eyebrow}>WELCOME BACK</Text>
            <Text style={styles.headerTitle}>로그인</Text>
          </View>
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 브랜드 아이콘 */}
          <View style={styles.brandWrap}>
            <View style={styles.brandIconCircle}>
              <Ionicons name="restaurant" size={26} color={Palette.amberDeep} />
            </View>
            <Text style={styles.brandText}>
              성공식당에 다시 오신 걸 환영해요
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>아이디</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={Palette.inkFaint}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="아이디를 입력해 주세요"
                  placeholderTextColor={Palette.inkFaint}
                  value={loginId}
                  onChangeText={setLoginId}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>전화번호</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="call-outline"
                  size={16}
                  color={Palette.inkFaint}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="010-1234-5678"
                  placeholderTextColor={Palette.inkFaint}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>비밀번호</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={Palette.inkFaint}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="비밀번호를 입력해 주세요"
                  placeholderTextColor={Palette.inkFaint}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={17}
                    color={Palette.inkFaint}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={loading || !canSubmit}
            >
              {loading ? (
                <Text style={styles.submitBtnText}>로그인 중...</Text>
              ) : (
                <>
                  <Ionicons
                    name="log-in-outline"
                    size={17}
                    color={Palette.cream}
                  />
                  <Text style={styles.submitBtnText}>로그인</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.findAccountLink}
              onPress={() => router.push("/find-account" as any)}
            >
              <Text style={styles.findAccountLinkText}>
                아이디 찾기 · 비밀번호 찾기
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => router.push("/signup" as any)}
          >
            <Text style={styles.signupLinkText}>아직 계정이 없으신가요?</Text>
            <Text style={styles.signupLinkHighlight}> 회원가입</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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

  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },

  brandWrap: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.sm + 4,
  },
  brandIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.amberSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  brandText: {
    fontSize: 13,
    color: Palette.inkSoft,
    fontWeight: "600",
    textAlign: "center",
  },

  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  fieldWrap: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkSoft,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    fontSize: 14,
    color: Palette.ink,
  },

  submitBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: Palette.charcoal,
    height: 54,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
    ...Shadow.card,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: Palette.cream, fontSize: 16, fontWeight: "700" },

  findAccountLink: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  findAccountLinkText: {
    fontSize: 12,
    color: Palette.inkFaint,
    fontWeight: "600",
  },

  signupLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
  signupLinkText: {
    fontSize: 13,
    color: Palette.inkFaint,
  },
  signupLinkHighlight: {
    fontSize: 13,
    color: Palette.amberDeep,
    fontWeight: "700",
  },
});
