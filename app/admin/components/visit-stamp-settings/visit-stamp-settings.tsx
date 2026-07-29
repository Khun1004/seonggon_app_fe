// app/admin/components/visit-stamp-settings/visit-stamp-settings.tsx
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

import { AdminContext } from "@/components/contexts/AdminContext";
import {
  getAdminVisitStampSettings,
  updateAdminVisitStampSettings,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

export default function AdminVisitStampSettingsScreen() {
  const { adminPassword } = useContext(AdminContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requiredVisits, setRequiredVisits] = useState("5");
  const [rewardName, setRewardName] = useState("");

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminVisitStampSettings(adminPassword)
      .then((s) => {
        setRequiredVisits(String(s.requiredVisits));
        setRewardName(s.rewardName);
      })
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
    const count = Number(requiredVisits.replace(/[^0-9]/g, ""));
    if (!count || count <= 0) {
      Alert.alert("알림", "몇 번 방문해야 하는지 숫자를 입력해 주세요.");
      return;
    }
    if (!rewardName.trim()) {
      Alert.alert("알림", "무엇을 드릴지 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      await updateAdminVisitStampSettings(
        { requiredVisits: count, rewardName: rewardName.trim() },
        adminPassword,
      );
      Alert.alert("알림", "저장되었습니다.");
    } catch (e: any) {
      Alert.alert("알림", e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
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
          <Ionicons name="gift-outline" size={16} color={Palette.amberDeep} />
          <Text style={styles.hintText}>
            손님이 방문 도장을 몇 개 모으면, 무엇을 받을 수 있는지 정해요.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>몇 번 방문하면 되나요?</Text>
          <View style={styles.countInputRow}>
            <TextInput
              style={styles.countInput}
              value={requiredVisits}
              onChangeText={(v) => setRequiredVisits(v.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor={Palette.inkFaint}
            />
            <Text style={styles.countInputSuffix}>번 방문</Text>
          </View>

          <Text style={styles.fieldLabel}>무엇을 드리나요?</Text>
          <TextInput
            style={styles.input}
            value={rewardName}
            onChangeText={setRewardName}
            placeholder="예: 해물파전"
            placeholderTextColor={Palette.inkFaint}
          />

          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              미리보기: "{requiredVisits || "?"}번 방문 완료 시{" "}
              {rewardName || "..."} 서비스 증정"
            </Text>
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
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
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
    fontSize: 12,
    color: Palette.amberDeep,
    fontWeight: "600",
    lineHeight: 17,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkSoft,
    marginBottom: 6,
  },
  countInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  countInput: {
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: 16,
    fontWeight: "700",
    color: Palette.ink,
    width: 80,
    textAlign: "center",
  },
  countInputSuffix: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  input: {
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: 14,
    color: Palette.ink,
    marginBottom: Spacing.md,
  },
  previewBox: {
    backgroundColor: Palette.creamDim,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  previewText: { fontSize: 12, color: Palette.inkSoft, lineHeight: 18 },
  saveBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  saveBtnText: { color: Palette.white, fontWeight: "700", fontSize: 15 },
});
