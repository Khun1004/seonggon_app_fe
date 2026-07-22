// app/admin/login.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) {
      Alert.alert("알림", "비밀번호를 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const ok = await login(password.trim());
      if (ok) {
        router.replace("/admin" as any);
      } else {
        Alert.alert("알림", "비밀번호가 올바르지 않습니다.");
      }
    } catch (e: any) {
      Alert.alert("알림", `로그인 중 문제가 발생했습니다.\n${e?.message ?? e}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={32} color={Palette.gold} />
          </View>
          <Text style={styles.eyebrow}>OWNER ACCESS</Text>
          <Text style={styles.title}>사장님 전용</Text>
          <Text style={styles.subtitle}>비밀번호를 입력해 주세요.</Text>

          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor={Palette.inkFaint}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.loginBtn, submitting && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Palette.charcoal} />
            ) : (
              <Text style={styles.loginBtnText}>로그인</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.charcoal },
  backBtn: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: "rgba(182,138,78,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    color: Palette.gold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Palette.cream,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(251,246,238,0.6)",
    marginBottom: Spacing.xl,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Palette.cream,
    marginBottom: Spacing.lg,
  },
  loginBtn: {
    backgroundColor: Palette.gold,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    ...Shadow.card,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: Palette.charcoal,
  },
});
