// app/admin/components/reservation-times/reservation-times.tsx
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
  getAdminReservationTimeConfig,
  ReservationTimeConfig,
  updateAdminReservationTimeConfig,
  UpsertReservationTimeConfigPayload,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

type ConfigType = "dine-in" | "takeout";

function ConfigSection({
  title,
  type,
  adminPassword,
}: {
  title: string;
  type: ConfigType;
  adminPassword: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<UpsertReservationTimeConfigPayload>({
    startTime: "11:00",
    endTime: "20:00",
    intervalMinutes: 30,
  });
  const [preview, setPreview] = useState<string[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    getAdminReservationTimeConfig(type, adminPassword)
      .then((config: ReservationTimeConfig) => {
        setDraft({
          startTime: config.startTime,
          endTime: config.endTime,
          intervalMinutes: config.intervalMinutes,
        });
        setPreview(config.slots);
      })
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [type, adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSave = async () => {
    if (!draft.startTime || !draft.endTime || !draft.intervalMinutes) {
      Alert.alert("알림", "시작 시간, 종료 시간, 간격을 모두 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      const result = await updateAdminReservationTimeConfig(
        type,
        draft,
        adminPassword,
      );
      setPreview(result.slots);
      Alert.alert("알림", "저장되었습니다.");
    } catch (e: any) {
      Alert.alert("알림", e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={Palette.amberDeep} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <Text style={styles.fieldLabel}>시작 시간</Text>
      <TextInput
        style={styles.input}
        value={draft.startTime}
        onChangeText={(v) => setDraft((p) => ({ ...p, startTime: v }))}
        placeholder="11:00"
        placeholderTextColor={Palette.inkFaint}
      />

      <Text style={styles.fieldLabel}>종료 시간</Text>
      <TextInput
        style={styles.input}
        value={draft.endTime}
        onChangeText={(v) => setDraft((p) => ({ ...p, endTime: v }))}
        placeholder="20:00"
        placeholderTextColor={Palette.inkFaint}
      />

      <Text style={styles.fieldLabel}>간격 (분)</Text>
      <TextInput
        style={[styles.input, { marginBottom: 0 }]}
        value={draft.intervalMinutes ? String(draft.intervalMinutes) : ""}
        onChangeText={(v) =>
          setDraft((p) => ({
            ...p,
            intervalMinutes: Number(v.replace(/[^0-9]/g, "")) || 0,
          }))
        }
        placeholder="30"
        placeholderTextColor={Palette.inkFaint}
        keyboardType="number-pad"
      />

      {preview.length > 0 && (
        <View style={styles.previewBox}>
          <Text style={styles.previewLabel}>
            지금 저장된 시간표 ({preview.length}개)
          </Text>
          <View style={styles.previewChipRow}>
            {preview.map((t) => (
              <View key={t} style={styles.previewChip}>
                <Text style={styles.previewChipText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={Palette.white} />
        ) : (
          <Text style={styles.saveBtnText}>{title} 저장</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function AdminReservationTimes() {
  const { adminPassword } = useContext(AdminContext);

  if (!adminPassword) {
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
            name="information-circle-outline"
            size={16}
            color={Palette.amberDeep}
          />
          <Text style={styles.hintText}>
            시작~종료 시간과 간격만 입력하면, 손님이 예약할 때 고를 수 있는 시간
            목록이 자동으로 만들어져요. 매장 예약과 포장은 서로 다른 시간표를 쓸
            수 있어요.
          </Text>
        </View>

        <ConfigSection
          title="매장 예약 시간"
          type="dine-in"
          adminPassword={adminPassword}
        />
        <View style={{ height: Spacing.lg }} />
        <ConfigSection
          title="포장 시간"
          type="takeout"
          adminPassword={adminPassword}
        />

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
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Palette.ink,
    marginBottom: Spacing.md,
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
  previewBox: { marginTop: Spacing.sm, marginBottom: Spacing.md },
  previewLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: Palette.inkFaint,
    marginBottom: Spacing.sm,
  },
  previewChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  previewChip: {
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  previewChipText: { fontSize: 11.5, fontWeight: "600", color: Palette.ink },
  saveBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: Palette.cream },
});
