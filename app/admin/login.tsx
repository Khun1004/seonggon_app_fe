// app/admin/login.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdminContext } from "@/components/contexts/AdminContext";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

export default function AdminLogin() {
  const router = useRouter();
  const { login } = useContext(AdminContext);
  const [businessNumber, setBusinessNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!businessNumber.trim() || !phone.trim() || !password.trim()) {
      Alert.alert(
        "알림",
        "사업자등록번호, 전화번호, 비밀번호를 모두 입력해 주세요.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const ok = await login(
        businessNumber.trim(),
        phone.trim(),
        password.trim(),
      );
      if (ok) {
        router.replace("/admin" as any);
      } else {
        Alert.alert(
          "알림",
          "사업자등록번호, 전화번호, 비밀번호를 다시 확인해 주세요.",
        );
      }
    } catch (e: any) {
      Alert.alert("알림", `로그인 중 문제가 발생했습니다.\n${e?.message ?? e}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={["#1C1712", Palette.charcoal, "#0F0C09"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={22} color={Palette.cream} />
          </TouchableOpacity>

          <View style={styles.content}>
            {/* 로고 */}
            <View style={styles.logoWrap}>
              <View style={styles.logoRing}>
                <Image
                  source={require("@/assets/images/sglogo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Ionicons name="diamond-outline" size={11} color={Palette.gold} />
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.eyebrow}>OWNER ACCESS</Text>
            <Text style={styles.title}>사장님 전용</Text>
            <Text style={styles.subtitle}>
              팔공산 성공식당 관리자 화면에{"\n"}오신 것을 환영합니다
            </Text>

            <View style={styles.inputWrap}>
              <Ionicons
                name="business-outline"
                size={17}
                color={Palette.gold}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="사업자등록번호"
                placeholderTextColor="rgba(251,246,238,0.35)"
                value={businessNumber}
                onChangeText={setBusinessNumber}
                keyboardType="number-pad"
                autoFocus
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons
                name="call-outline"
                size={17}
                color={Palette.gold}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="전화번호"
                placeholderTextColor="rgba(251,246,238,0.35)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons
                name="lock-closed-outline"
                size={17}
                color={Palette.gold}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                placeholderTextColor="rgba(251,246,238,0.35)"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={10}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={19}
                  color="rgba(251,246,238,0.5)"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, submitting && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={submitting}
            >
              <LinearGradient
                colors={[Palette.gold, "#B8923A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginBtnGradient}
              >
                {submitting ? (
                  <ActivityIndicator color={Palette.charcoal} />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>로그인</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={Palette.charcoal}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={12}
                color="rgba(251,246,238,0.35)"
              />
              <Text style={styles.footerText}>
                사장님만 접근 가능한 화면이에요
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  logoWrap: { marginBottom: Spacing.lg },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(212,175,55,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(212,175,55,0.35)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Palette.gold,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  logoImage: { width: 62, height: 62 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    width: 28,
    height: 1,
    backgroundColor: "rgba(212,175,55,0.4)",
  },
  eyebrow: {
    color: Palette.gold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Palette.cream,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(251,246,238,0.5)",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: Spacing.xl + Spacing.md,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Palette.cream,
  },
  eyeBtn: { padding: 4 },
  loginBtn: {
    width: "100%",
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadow.card,
  },
  loginBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: Spacing.md,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: Palette.charcoal,
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: 11,
    color: "rgba(251,246,238,0.35)",
  },
});
