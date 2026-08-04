// app/admin/(tabs)/mypage.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
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

type SettingItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  onPress: () => void;
};

export default function AdminMyPage() {
  const router = useRouter();
  const { logout } = useContext(AdminContext);

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

  const settingItems: SettingItem[] = [
    {
      icon: "person-circle-outline",
      label: "사장님 정보",
      sub: "전화번호·주소·정산 계좌 정보 관리",
      onPress: () => router.push("/admin/account" as any),
    },
    {
      icon: "people-outline",
      label: "사용자 정보",
      sub: "회원 · 미등록 손님 목록 확인",
      onPress: () => router.push("/admin/user-info" as any),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View>
            <Text style={styles.eyebrow}>OWNER ACCOUNT</Text>
            <Text style={styles.headerTitle}>마이</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="shield-checkmark" size={26} color={Palette.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileTitle}>사장님 계정</Text>
            <Text style={styles.profileSub}>
              팔공산 성공식당 · 관리자로 로그인됨
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>계정 설정</Text>
        {settingItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.settingRow}
            activeOpacity={0.8}
            onPress={item.onPress}
          >
            <View style={styles.settingIconWrap}>
              <Ionicons name={item.icon} size={18} color={Palette.amberDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Text style={styles.settingSub}>{item.sub}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Palette.inkFaint}
            />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>계정</Text>
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Palette.error} />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>성공식당 관리자 · v1.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  scrollContent: { padding: Spacing.lg },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.amberDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  profileTitle: { fontSize: 15, fontWeight: "800", color: Palette.ink },
  profileSub: { fontSize: 12, color: Palette.inkFaint, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Palette.inkSoft,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 4,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Palette.amberSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  settingSub: { fontSize: 11.5, color: Palette.inkFaint, marginTop: 2 },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    ...Shadow.card,
  },
  logoutText: { fontSize: 14, fontWeight: "700", color: Palette.error },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    color: Palette.inkFaint,
    marginTop: Spacing.xl,
  },
});
