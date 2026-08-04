// components/Auth/Signup.tsx
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

import {
  checkLoginId,
  sendPhoneCode,
  signup,
  verifyPhoneCode,
} from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

// ⚠️ 디버그용: Google 로그인(AuthSession.useAuthRequest)을 완전히 비활성화했습니다.
// 화면 갱신이 늦는 문제의 원인이 useAuthRequest인지 확정하기 위한 임시 버전입니다.
// 원인이 확정되면 다시 살릴 수 있도록 관련 코드는 모두 주석으로 남겨두었습니다.
//
// import * as AuthSession from "expo-auth-session";
// import * as WebBrowser from "expo-web-browser";
// WebBrowser.maybeCompleteAuthSession();
// const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";
// const discovery = {
//   authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
//   tokenEndpoint: "https://oauth2.googleapis.com/token",
//   revocationEndpoint: "https://oauth2.googleapis.com/revoke",
// };

const GOOGLE_LOGIN_SUPPORTED = false; // 디버그 중에는 false로 고정

type PasswordStrength = "weak" | "medium" | "strong" | null;

function getPasswordStrength(pw: string): PasswordStrength {
  if (pw.length === 0) return null;
  if (pw.length < 6) return "weak";

  let score = 0;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (pw.length >= 10 && score >= 3) return "strong";
  if (pw.length >= 8 && score >= 2) return "medium";
  return "weak";
}

const STRENGTH_META: Record<
  "weak" | "medium" | "strong",
  { label: string; color: string }
> = {
  weak: { label: "약함", color: Palette.error },
  medium: { label: "보통", color: Palette.amberDeep },
  strong: { label: "강함", color: Palette.success },
};

type StepKey = "account" | "phone";

export default function Signup() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [idChecked, setIdChecked] = useState<"idle" | "available" | "taken">(
    "idle",
  );
  const [idChecking, setIdChecking] = useState(false);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [nickname, setNickname] = useState("");

  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  // Google 인증 관련 — 디버그 중 비활성화 (더미 값)
  const [googleEmail] = useState<string | null>(null);
  const [googleVerified] = useState(false);
  const request = null;
  const promptAsync = () => {};

  /*
  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ["openid", "profile", "email"],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: false,
      extraParams: {
        nonce: Math.random().toString(36).substring(2),
      },
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        verifyGoogleToken(id_token);
      }
    }
  }, [response]);

  const verifyGoogleToken = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/google/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      setGoogleLoading(false);
      if (res.ok && data.email) {
        setGoogleEmail(data.email);
        setGoogleVerified(true);
        Alert.alert(
          "연동 완료",
          `Google 계정(${data.email}) 인증이 완료되었습니다.`,
        );
      } else {
        Alert.alert("실패", data.message || "Google 인증에 실패했습니다.");
      }
    } catch {
      setGoogleLoading(false);
      Alert.alert(
        "에러",
        "서버와 통신할 수 없습니다. 서버 주소를 확인해 주세요.",
      );
    }
  };
  */

  const strength = getPasswordStrength(password);

  const handleCheckId = async () => {
    if (!loginId.trim()) {
      Alert.alert("알림", "아이디를 입력해 주세요.");
      return;
    }
    setIdChecking(true);
    console.log("[1] 중복확인 버튼 눌림, loginId =", loginId.trim());
    try {
      const available = await checkLoginId(loginId.trim());
      console.log("[2] 응답 받음, available =", available);

      setIdChecked(available ? "available" : "taken");
      setIdChecking(false);
      console.log("[3] setState 호출 완료");

      if (!available) {
        Alert.alert("알림", "이미 사용 중인 아이디입니다.");
      }
    } catch (e) {
      console.log("[ERROR]", e);
      setIdChecking(false);
      Alert.alert(
        "에러",
        "서버와 통신할 수 없습니다. 서버 주소를 확인해 주세요.",
      );
    }
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

  const canSubmit =
    idChecked === "available" &&
    password.length >= 6 &&
    password === passwordConfirm &&
    nickname.trim().length > 0 &&
    phoneVerified;

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert("알림", "모든 항목을 올바르게 입력해 주세요.");
      return;
    }
    try {
      await signup({
        loginId: loginId.trim(),
        password,
        nickname: nickname.trim(),
        phone: phone.trim(),
        email: googleVerified ? (googleEmail ?? undefined) : undefined,
      });
      Alert.alert("가입 완료", "회원가입이 완료되었습니다. 로그인해 주세요.");
      router.replace("/login" as any);
    } catch (e: any) {
      Alert.alert("가입 실패", e.message || "회원가입 중 오류가 발생했습니다.");
    }
  };

  const stepStatus: Record<StepKey, boolean> = {
    account:
      idChecked === "available" &&
      password.length >= 6 &&
      password === passwordConfirm &&
      nickname.trim().length > 0,
    phone: phoneVerified,
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
            <Text style={styles.eyebrow}>JOIN US</Text>
            <Text style={styles.headerTitle}>회원가입</Text>
          </View>
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 진행 단계 인디케이터 */}
          <View style={styles.stepRow}>
            {[
              { key: "account" as StepKey, label: "계정" },
              { key: "phone" as StepKey, label: "전화번호" },
            ].map((step, idx, arr) => (
              <React.Fragment key={step.key}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      stepStatus[step.key] && styles.stepDotDone,
                    ]}
                  >
                    {stepStatus[step.key] ? (
                      <Ionicons
                        name="checkmark"
                        size={12}
                        color={Palette.cream}
                      />
                    ) : (
                      <Text style={styles.stepDotText}>{idx + 1}</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      stepStatus[step.key] && styles.stepLabelDone,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
                {idx !== arr.length - 1 && (
                  <View style={styles.stepConnector} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* 1. 계정 정보 카드 */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconWrap}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={Palette.amberDeep}
                />
              </View>
              <Text style={styles.cardTitle}>계정 정보</Text>
            </View>

            <Text style={styles.label}>아이디</Text>
            <View style={styles.rowWithBtn}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="아이디를 입력해 주세요"
                placeholderTextColor={Palette.inkFaint}
                value={loginId}
                onChangeText={(t) => {
                  setLoginId(t);
                  setIdChecked("idle");
                }}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[
                  styles.smallBtn,
                  idChecking && styles.smallBtnDisabled,
                  idChecked === "available" && styles.smallBtnSuccess,
                ]}
                onPress={handleCheckId}
                disabled={idChecking || idChecked === "available"}
              >
                {idChecked === "available" ? (
                  <View style={styles.smallBtnIconRow}>
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color={Palette.white}
                    />
                    <Text style={styles.smallBtnText}>사용가능</Text>
                  </View>
                ) : (
                  <Text style={styles.smallBtnText}>
                    {idChecking
                      ? "확인 중"
                      : idChecked === "taken"
                        ? "다시 확인"
                        : "중복확인"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            {idChecked === "taken" && (
              <View style={styles.inlineNotice}>
                <Ionicons name="close-circle" size={13} color={Palette.error} />
                <Text style={styles.errorText}>
                  이미 사용 중인 아이디입니다.
                </Text>
              </View>
            )}

            <Text style={styles.label}>비밀번호</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="비밀번호 (6자 이상)"
                placeholderTextColor={Palette.inkFaint}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
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
            {strength && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBarTrack}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      {
                        width:
                          strength === "weak"
                            ? "33%"
                            : strength === "medium"
                              ? "66%"
                              : "100%",
                        backgroundColor: STRENGTH_META[strength].color,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.strengthLabel,
                    { color: STRENGTH_META[strength].color },
                  ]}
                >
                  {STRENGTH_META[strength].label}
                </Text>
              </View>
            )}

            <View style={[styles.passwordRow, { marginTop: Spacing.md }]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="비밀번호 확인"
                placeholderTextColor={Palette.inkFaint}
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                secureTextEntry={!showPasswordConfirm}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPasswordConfirm((prev) => !prev)}
                hitSlop={8}
              >
                <Ionicons
                  name={showPasswordConfirm ? "eye-outline" : "eye-off-outline"}
                  size={17}
                  color={Palette.inkFaint}
                />
              </TouchableOpacity>
            </View>
            {passwordConfirm.length > 0 && password !== passwordConfirm && (
              <View style={styles.inlineNotice}>
                <Ionicons name="alert-circle" size={13} color={Palette.error} />
                <Text style={styles.errorText}>
                  비밀번호가 일치하지 않습니다.
                </Text>
              </View>
            )}

            <Text style={styles.label}>닉네임</Text>
            <TextInput
              style={styles.input}
              placeholder="닉네임을 입력해 주세요"
              placeholderTextColor={Palette.inkFaint}
              value={nickname}
              onChangeText={setNickname}
            />
          </View>

          {/* 2. 전화번호 인증 카드 */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconWrap}>
                <Ionicons
                  name="call-outline"
                  size={16}
                  color={Palette.amberDeep}
                />
              </View>
              <Text style={styles.cardTitle}>전화번호 인증</Text>
            </View>

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
                  setPhoneCode("");
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
                  <Ionicons
                    name="refresh"
                    size={13}
                    color={Palette.amberDeep}
                  />
                  <Text style={styles.resendBtnText}>
                    {sendingCode ? "재발급 중..." : "인증번호 재요청"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {phoneVerified ? (
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
            ) : (
              <Text style={styles.helperText}>
                인증요청을 누르면 발급된 번호가 화면에 바로 표시됩니다.
                (테스트용 인증)
              </Text>
            )}
          </View>

          {/* Google 인증 카드 — 디버그 중 비활성화 */}
          {GOOGLE_LOGIN_SUPPORTED ? (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconWrap}>
                  <Ionicons
                    name="logo-google"
                    size={16}
                    color={Palette.amberDeep}
                  />
                </View>
                <Text style={styles.cardTitle}>Google 이메일 인증</Text>
              </View>
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={() => promptAsync()}
                disabled={!request}
              >
                <Ionicons name="logo-google" size={16} color={Palette.ink} />
                <Text style={styles.googleBtnText}>
                  Google 계정으로 인증하기
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.debugNotice}>
              <Ionicons
                name="construct-outline"
                size={14}
                color={Palette.inkFaint}
              />
              <Text style={styles.debugNoticeText}>
                디버그 모드: Google 로그인이 임시로 비활성화되어 있습니다.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={styles.submitBtnText}>회원가입 완료</Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
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

  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  stepItem: {
    alignItems: "center",
    gap: 6,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.creamDim,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Palette.line,
  },
  stepDotDone: {
    backgroundColor: Palette.success,
    borderColor: Palette.success,
  },
  stepDotText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.inkFaint,
  },
  stepLabel: {
    fontSize: 10,
    color: Palette.inkFaint,
    fontWeight: "600",
  },
  stepLabelDone: {
    color: Palette.success,
  },
  stepConnector: {
    width: 28,
    height: 1,
    backgroundColor: Palette.line,
    marginHorizontal: 6,
    marginBottom: 16,
  },

  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.amberSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
    flex: 1,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkSoft,
    marginTop: Spacing.md,
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
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingRight: Spacing.md,
  },
  eyeBtn: {
    paddingLeft: Spacing.sm,
  },
  smallBtn: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
    borderRadius: Radius.md,
  },
  smallBtnSuccess: {
    backgroundColor: Palette.success,
  },
  smallBtnIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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

  inlineNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: Palette.error,
  },
  helperText: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginTop: Spacing.sm,
    lineHeight: 16,
  },

  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  strengthBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.creamDim,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: 5,
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "700",
    width: 32,
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

  googleBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 6,
  },
  googleBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.ink,
  },

  debugNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  debugNoticeText: {
    fontSize: 11,
    color: Palette.inkFaint,
  },

  submitBtn: {
    backgroundColor: Palette.charcoal,
    height: 56,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
    ...Shadow.card,
  },
  submitBtnDisabled: { opacity: 0.35 },
  submitBtnText: { color: Palette.cream, fontSize: 16, fontWeight: "700" },
});
