// app/admin/components/store-profile/store-profile.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// 화면 좌우 여백(Spacing.lg*2) + 카드 안쪽 여백(Spacing.lg*2) + 달력 카드 여백(Spacing.md*2)
// 을 어림잡아 뺀 뒤 7일로 나눈 값이에요. 정확한 픽셀보다 "칸이 안 잘리는 것"이
// 중요해서 넉넉하게 뺐습니다.
const CALENDAR_CELL_SIZE = (SCREEN_WIDTH - 96) / 7;

import { AdminContext } from "@/components/contexts/AdminContext";
import {
  addAdminClosedDate,
  AdminClosedDate,
  deleteAdminClosedDate,
  getAdminClosedDates,
  getAdminStoreProfile,
  updateAdminStoreProfile,
  UpsertStoreProfilePayload,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

// 오늘 날짜를 YYYY-MM-DD로
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function toDateStr(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function AdminStoreProfileScreen() {
  const { adminPassword } = useContext(AdminContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<UpsertStoreProfilePayload>({
    address: "",
    phone: "",
    openTime: "11:00",
    closeTime: "21:00",
    lastOrderTime: "19:30",
    naverRating: undefined,
    naverReviewCount: undefined,
    blogReviewCount: undefined,
  });
  const [closedDates, setClosedDates] = useState<AdminClosedDate[]>([]);
  const [newDate, setNewDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [newReason, setNewReason] = useState("");
  // 네이버 평점 입력칸은 별도의 "글자 그대로" 상태로 관리해요. draft.naverRating로
  // 바로바로 변환해서 보여주면, "4."까지 입력한 순간 숫자로 바뀌면서 점이
  // 사라지는 버그가 있었어요 (예: "4." → Number("4.") → 4 → 다시 "4"로 표시).
  const [naverRatingText, setNaverRatingText] = useState("");
  const [addingClosure, setAddingClosure] = useState(false);

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    Promise.all([
      getAdminStoreProfile(adminPassword),
      getAdminClosedDates(adminPassword),
    ])
      .then(([profile, dates]) => {
        setDraft(profile);
        setNaverRatingText(
          profile.naverRating != null ? String(profile.naverRating) : "",
        );
        setClosedDates(dates);
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
    if (!draft.address.trim() || !draft.phone.trim()) {
      Alert.alert("알림", "주소와 전화번호를 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      await updateAdminStoreProfile(draft, adminPassword);
      Alert.alert("알림", "저장되었습니다.");
    } catch (e: any) {
      Alert.alert("알림", e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddClosure = async (dateOverride?: string) => {
    if (!adminPassword) return;
    const date = dateOverride ?? newDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("알림", "달력에서 날짜를 선택해 주세요.");
      return;
    }
    setAddingClosure(true);
    try {
      await addAdminClosedDate(
        date,
        newReason.trim() || undefined,
        adminPassword,
      );
      setNewDate("");
      setNewReason("");
      load();
    } catch (e: any) {
      Alert.alert("알림", e.message || "휴무일 등록에 실패했습니다.");
    } finally {
      setAddingClosure(false);
    }
  };

  const handleRemoveClosure = (item: AdminClosedDate) => {
    Alert.alert("휴무일 삭제", `${item.date} 휴무를 취소할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          if (!adminPassword) return;
          try {
            await deleteAdminClosedDate(item.id, adminPassword);
            load();
          } catch (e: any) {
            Alert.alert("알림", e.message || "삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const closedDateSet = new Set(closedDates.map((d) => d.date));

  const renderCalendar = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => {
              if (calMonth === 0) {
                setCalYear(calYear - 1);
                setCalMonth(11);
              } else setCalMonth(calMonth - 1);
            }}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={20} color={Palette.ink} />
          </TouchableOpacity>
          <Text style={styles.calendarMonthTitle}>
            {calYear}년 {calMonth + 1}월
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (calMonth === 11) {
                setCalYear(calYear + 1);
                setCalMonth(0);
              } else setCalMonth(calMonth + 1);
            }}
            hitSlop={8}
          >
            <Ionicons name="chevron-forward" size={20} color={Palette.ink} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((w, i) => (
            <Text
              key={w}
              style={[
                styles.weekdayLabel,
                i === 0 && { color: Palette.error },
                i === 6 && { color: "#2979FF" },
              ]}
            >
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {cells.map((day, idx) => {
            if (!day) {
              return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
            }
            const dateStr = toDateStr(calYear, calMonth, day);
            const isToday = dateStr === todayStr();
            const isSelected = dateStr === newDate;
            const isClosed = closedDateSet.has(dateStr);
            const dow = (firstDay + day - 1) % 7;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isClosed && !isSelected && styles.dayCellClosed,
                ]}
                onPress={() => {
                  setNewDate(dateStr);
                  setShowCalendar(false);
                }}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    !isSelected && dow === 0 && { color: Palette.error },
                    !isSelected && dow === 6 && { color: "#2979FF" },
                    isToday && !isSelected && styles.dayTextToday,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.calendarLegendRow}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: Palette.amberDeep }]}
            />
            <Text style={styles.legendText}>이미 등록된 휴무일</Text>
          </View>
        </View>
      </View>
    );
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
        <Text style={styles.sectionTitle}>기본 정보</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>주소</Text>
          <TextInput
            style={styles.input}
            value={draft.address}
            onChangeText={(v) => setDraft((p) => ({ ...p, address: v }))}
            placeholder="예: 대구 동구 팔공산로199길 12"
            placeholderTextColor={Palette.inkFaint}
          />

          <Text style={styles.fieldLabel}>전화번호</Text>
          <TextInput
            style={styles.input}
            value={draft.phone}
            onChangeText={(v) => setDraft((p) => ({ ...p, phone: v }))}
            placeholder="예: 0507-1410-7634"
            placeholderTextColor={Palette.inkFaint}
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>영업 시작 시간</Text>
          <TextInput
            style={styles.input}
            value={draft.openTime}
            onChangeText={(v) => setDraft((p) => ({ ...p, openTime: v }))}
            placeholder="11:00"
            placeholderTextColor={Palette.inkFaint}
          />

          <Text style={styles.fieldLabel}>영업 종료 시간</Text>
          <TextInput
            style={styles.input}
            value={draft.closeTime}
            onChangeText={(v) => setDraft((p) => ({ ...p, closeTime: v }))}
            placeholder="21:00"
            placeholderTextColor={Palette.inkFaint}
          />

          <Text style={styles.fieldLabel}>라스트 오더 시간</Text>
          <TextInput
            style={styles.input}
            value={draft.lastOrderTime}
            onChangeText={(v) => setDraft((p) => ({ ...p, lastOrderTime: v }))}
            placeholder="19:30"
            placeholderTextColor={Palette.inkFaint}
          />

          <Text style={styles.fieldLabel}>네이버 평점 (선택)</Text>
          <TextInput
            style={styles.input}
            value={naverRatingText}
            onChangeText={(v) => {
              // 숫자와 점만 허용 (한글 자판 등에서 이상한 문자 안 들어오게)
              const cleaned = v.replace(/[^0-9.]/g, "");
              setNaverRatingText(cleaned);
              const parsed = Number(cleaned);
              setDraft((p) => ({
                ...p,
                naverRating:
                  cleaned && !Number.isNaN(parsed) ? parsed : undefined,
              }));
            }}
            placeholder="예: 4.84"
            placeholderTextColor={Palette.inkFaint}
            keyboardType="decimal-pad"
          />

          <Text style={styles.fieldLabel}>네이버 리뷰 수 (선택)</Text>
          <TextInput
            style={styles.input}
            value={
              draft.naverReviewCount != null
                ? String(draft.naverReviewCount)
                : ""
            }
            onChangeText={(v) =>
              setDraft((p) => ({
                ...p,
                naverReviewCount: v
                  ? Number(v.replace(/[^0-9]/g, ""))
                  : undefined,
              }))
            }
            placeholder="예: 3935"
            placeholderTextColor={Palette.inkFaint}
            keyboardType="number-pad"
          />

          <Text style={styles.fieldLabel}>블로그 리뷰 수 (선택)</Text>
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            value={
              draft.blogReviewCount != null ? String(draft.blogReviewCount) : ""
            }
            onChangeText={(v) =>
              setDraft((p) => ({
                ...p,
                blogReviewCount: v
                  ? Number(v.replace(/[^0-9]/g, ""))
                  : undefined,
              }))
            }
            placeholder="예: 1046"
            placeholderTextColor={Palette.inkFaint}
            keyboardType="number-pad"
          />
        </View>
        <Text style={styles.hint}>
          시간은 "11:00"처럼 시:분 형식으로 입력해 주세요. 네이버 평점·리뷰
          수·블로그 리뷰 수는 네이버 플레이스 화면에서 직접 확인해서 입력하시는
          값이에요 (자동으로 갱신되지는 않아요).
        </Text>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Palette.white} />
          ) : (
            <Text style={styles.saveBtnText}>기본 정보 저장</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          휴무일 등록
        </Text>
        <Text style={styles.hint}>
          등록한 날짜는 손님 화면에서 시간과 상관없이 "휴무"로 보여요.
        </Text>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => handleAddClosure(todayStr())}
            disabled={addingClosure}
          >
            <Text style={styles.quickBtnText}>오늘 쉬기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => handleAddClosure(tomorrowStr())}
            disabled={addingClosure}
          >
            <Text style={styles.quickBtnText}>내일 쉬기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>날짜 선택</Text>
          <TouchableOpacity
            style={styles.dateSelectBtn}
            onPress={() => setShowCalendar((v) => !v)}
          >
            <Ionicons
              name="calendar-outline"
              size={17}
              color={Palette.amberDeep}
            />
            <Text style={styles.dateSelectBtnText}>
              {newDate || "날짜를 선택해 주세요"}
            </Text>
            <Ionicons
              name={showCalendar ? "chevron-up" : "chevron-down"}
              size={16}
              color={Palette.inkFaint}
            />
          </TouchableOpacity>

          {showCalendar && renderCalendar()}

          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>
            사유 (선택)
          </Text>
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            value={newReason}
            onChangeText={setNewReason}
            placeholder="예: 명절 휴무"
            placeholderTextColor={Palette.inkFaint}
          />
        </View>
        <TouchableOpacity
          style={[styles.addClosureBtn, addingClosure && { opacity: 0.6 }]}
          onPress={() => handleAddClosure()}
          disabled={addingClosure}
        >
          {addingClosure ? (
            <ActivityIndicator color={Palette.amberDeep} size="small" />
          ) : (
            <>
              <Ionicons name="add" size={16} color={Palette.amberDeep} />
              <Text style={styles.addClosureBtnText}>휴무일 추가</Text>
            </>
          )}
        </TouchableOpacity>

        {closedDates.length > 0 && (
          <View style={{ marginTop: Spacing.lg }}>
            {closedDates.map((item) => (
              <View key={item.id} style={styles.closureRow}>
                <Ionicons name="calendar" size={16} color={Palette.amberDeep} />
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={styles.closureDate}>{item.date}</Text>
                  {item.reason && (
                    <Text style={styles.closureReason}>{item.reason}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveClosure(item)}
                  hitSlop={8}
                >
                  <Ionicons
                    name="trash-outline"
                    size={17}
                    color={Palette.error}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 80 }} />
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Palette.ink,
    marginBottom: Spacing.sm,
  },
  hint: {
    fontSize: 11.5,
    color: Palette.inkFaint,
    marginTop: 4,
    marginBottom: Spacing.md,
    lineHeight: 16,
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
  input: {
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: 14,
    color: Palette.ink,
    marginBottom: Spacing.md,
  },
  saveBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: Palette.cream },
  quickRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md },
  quickBtn: {
    flex: 1,
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm + 4,
    alignItems: "center",
  },
  quickBtnText: { fontSize: 13, fontWeight: "700", color: Palette.amberDeep },
  addClosureBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm + 4,
    marginTop: Spacing.sm,
  },
  addClosureBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  closureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 6,
    ...Shadow.card,
  },
  closureDate: { fontSize: 13.5, fontWeight: "700", color: Palette.ink },
  closureReason: { fontSize: 11.5, color: Palette.inkFaint, marginTop: 2 },
  dateSelectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  dateSelectBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Palette.ink,
  },
  calendarCard: {
    marginTop: Spacing.sm + 4,
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  calendarMonthTitle: { fontSize: 14, fontWeight: "800", color: Palette.ink },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  weekdayLabel: {
    width: CALENDAR_CELL_SIZE,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: Palette.inkFaint,
  },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCellEmpty: { width: CALENDAR_CELL_SIZE, height: 38 },
  dayCell: {
    width: CALENDAR_CELL_SIZE,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
  },
  dayCellSelected: { backgroundColor: Palette.charcoal },
  dayCellClosed: { backgroundColor: Palette.amberSoft },
  dayText: { fontSize: 13, color: Palette.ink },
  dayTextSelected: { color: Palette.cream, fontWeight: "800" },
  dayTextToday: { fontWeight: "800", color: Palette.amberDeep },
  calendarLegendRow: { flexDirection: "row", marginTop: Spacing.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10.5, color: Palette.inkFaint },
});
