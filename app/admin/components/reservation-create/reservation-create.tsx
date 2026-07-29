// app/admin/components/reservation-create/reservation-create.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
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
  createReservationAsAdmin,
  getAdminReservations,
  getAdminReservationTimeConfig,
  updateReservationAsAdmin,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";
import {
  BASE_URL,
  ClosedDate,
  getReservationAvailability,
  getUpcomingClosedDates,
  TakenSlot,
} from "@/constants/api";
import { RESERVATION_MENU_DATA } from "@/constants/reservation-menu-data";

type AdminRoomOption = {
  id: string; // 실제 예약에 쓰이는 진짜 식별자 (예: "hall-3")
  dbId: number; // DB의 원래 숫자 id — 참고용, 예약에는 안 씁니다
  category: string;
  categoryLabel: string;
  number: number;
  capacity: string;
  floor: 1 | 2;
  isRoom: boolean;
};

type RawRoomApiItem = {
  id: number;
  category: string;
  categoryLabel: string;
  number: number;
  capacity: string;
  floor: number;
  isRoom: boolean;
};

// 손님 앱은 "카테고리-번호"(예: "hall-3") 형식을 방 식별자(roomId)로 써요.
// DB의 원래 숫자 id를 그대로 쓰면 안 돼요 — 그러면 손님 화면의 예약 가능
// 여부 확인이 이 방을 "다른 방"으로 착각해서, 이중 예약을 못 막게 돼요.
// (실제로 이 버그가 있었어요: 관리자가 등록한 예약은 room_id가 "3"으로
// 저장됐는데, 손님 화면은 "hall-3"을 찾고 있어서 서로 다른 방으로 보였어요.)
async function fetchRooms(): Promise<AdminRoomOption[]> {
  const res = await fetch(`${BASE_URL}/api/rooms`);
  if (!res.ok) throw new Error("좌석 목록을 불러오지 못했습니다.");
  const raw = (await res.json()) as RawRoomApiItem[];
  return raw.map((r) => ({
    id: `${r.category}-${r.number}`,
    dbId: r.id,
    category: r.category,
    categoryLabel: r.categoryLabel,
    number: r.number,
    capacity: r.capacity,
    floor: r.floor === 2 ? 2 : 1,
    isRoom: r.isRoom,
  }));
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateStr(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export default function AdminReservationCreate() {
  const router = useRouter();
  const { type: initialType, editId } = useLocalSearchParams<{
    type?: string;
    editId?: string;
  }>();
  const isEditMode = !!editId;
  const { adminPassword } = useContext(AdminContext);

  const [orderType, setOrderType] = useState<"dine_in" | "takeout">(
    initialType === "takeout" ? "takeout" : "dine_in",
  );

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);

  const [rooms, setRooms] = useState<AdminRoomOption[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<1 | 2>(1);
  const [selectedRoom, setSelectedRoom] = useState<AdminRoomOption | null>(
    null,
  );

  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // 손님 화면과 똑같은 방식으로, 고른 날짜에 이미 찬 (자리, 시간)을
  // 서버에서 받아와서 회색 처리해요. 이 예약이 원래 수정 대상이었던 자리/
  // 시간은 "찬 것"으로 취급하지 않아요 (자기 자신은 자기랑 안 겹치니까요).
  const [takenSlots, setTakenSlots] = useState<TakenSlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  // 수정 모드에서는, 지금 수정 중인 이 예약 자신의 원래 자리/시간은
  // "이미 찬 것"으로 취급하면 안 되니까 따로 기억해둬요.
  const [editingOriginal, setEditingOriginal] = useState<{
    roomId: string;
    time: string;
  } | null>(null);
  useEffect(() => {
    if (!selectedDate) {
      setTakenSlots([]);
      return;
    }
    setLoadingAvailability(true);
    getReservationAvailability(selectedDate)
      .then(setTakenSlots)
      .catch(() => setTakenSlots([]))
      .finally(() => setLoadingAvailability(false));
  }, [selectedDate]);

  const isTimeTaken = (time: string) => {
    if (orderType === "takeout" || !selectedRoom) return false;
    if (
      isEditMode &&
      editingOriginal?.roomId === selectedRoom.id &&
      editingOriginal?.time === time
    ) {
      return false;
    }
    return takenSlots.some(
      (slot) => slot.roomId === selectedRoom.id && slot.time === time,
    );
  };

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [peopleCount, setPeopleCount] = useState(2);
  const [message, setMessage] = useState("");
  const [selectedMenus, setSelectedMenus] = useState<Record<string, number>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(isEditMode);

  useEffect(() => {
    getUpcomingClosedDates()
      .then(setClosedDates)
      .catch(() => {});
    fetchRooms()
      .then(setRooms)
      .catch(() => {})
      .finally(() => setRoomsLoading(false));
  }, []);

  // 수정 모드면, 관리자 예약 전체 목록에서 이 id에 해당하는 예약을 찾아서
  // 폼에 미리 채워 넣습니다. 방(room)은 목록이 다 불러와진 뒤에 매칭해요.
  useEffect(() => {
    if (!isEditMode || !adminPassword || rooms.length === 0) return;
    getAdminReservations(adminPassword)
      .then((all) => {
        const found = all.find((r) => String(r.id) === editId);
        if (!found) return;
        setOrderType(found.type === "TAKEOUT" ? "takeout" : "dine_in");
        setSelectedDate(found.date);
        const [y, m] = found.date.split("-").map(Number);
        setCalYear(y);
        setCalMonth(m - 1);
        setSelectedTime(found.time);
        setName(found.name);
        setPhone(found.phone);
        setPeopleCount(found.peopleCount || 2);
        setMessage(found.message ?? "");
        setSelectedMenus(found.menus ?? {});
        if (found.type !== "TAKEOUT") {
          setEditingOriginal({ roomId: found.roomId, time: found.time });
          const room = rooms.find((r) => r.id === found.roomId);
          if (room) {
            setSelectedRoom(room);
            setSelectedFloor(room.floor);
          }
        }
      })
      .catch(() => {})
      .finally(() => setPrefillLoading(false));
  }, [isEditMode, adminPassword, rooms, editId]);

  useEffect(() => {
    if (!adminPassword) return;
    const type = orderType === "takeout" ? "takeout" : "dine-in";
    getAdminReservationTimeConfig(type, adminPassword)
      .then((config) => setTimeSlots(config.slots))
      .catch(() => setTimeSlots([]));
    // 시간 초기화는 여기서 하지 않아요 — 수정 모드에서 기존 예약 정보를
    // 미리 채울 때도 orderType이 바뀌는데, 여기서 지워버리면 방금 채운
    // 시간이 곧바로 사라져 버려요. 대신 "방문/포장" 탭을 사용자가 직접
    // 누를 때만 아래에서 시간을 지웁니다.
  }, [orderType, adminPassword]);

  const closedDateSet = new Set(closedDates.map((d) => d.date));

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();
  const isPast = (year: number, month: number, day: number) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  };
  const isDisabled = (year: number, month: number, day: number) =>
    isPast(year, month, day) || closedDateSet.has(toDateStr(year, month, day));

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfMonth(calYear, calMonth);
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
            const disabled = isDisabled(calYear, calMonth, day);
            const selected = selectedDate === dateStr;
            const closed = closedDateSet.has(dateStr);
            const dow = (firstDay + day - 1) % 7;

            return (
              <TouchableOpacity
                key={dateStr}
                disabled={disabled}
                style={[
                  styles.dayCell,
                  selected && styles.dayCellSelected,
                  disabled && styles.dayCellDisabled,
                ]}
                onPress={() => setSelectedDate(dateStr)}
              >
                <Text
                  style={[
                    styles.dayText,
                    selected && styles.dayTextSelected,
                    disabled && styles.dayTextDisabled,
                    !disabled && dow === 0 && { color: Palette.error },
                    !disabled && dow === 6 && { color: "#2979FF" },
                    closed && !disabled && { color: Palette.error },
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const handleUpdateMenuQty = (id: string, delta: number) => {
    setSelectedMenus((prev) => {
      const next = { ...prev };
      const qty = Math.max(0, (next[id] ?? 0) + delta);
      if (qty === 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!adminPassword) return;
    if (!name.trim() || !phone.trim()) {
      Alert.alert("알림", "예약자 성함과 연락처를 입력해 주세요.");
      return;
    }
    if (!selectedDate) {
      Alert.alert("알림", "날짜를 선택해 주세요.");
      return;
    }
    if (!selectedTime) {
      Alert.alert("알림", "시간을 선택해 주세요.");
      return;
    }
    if (orderType === "dine_in" && !selectedRoom) {
      Alert.alert("알림", "좌석/룸을 선택해 주세요.");
      return;
    }
    if (isTimeTaken(selectedTime)) {
      Alert.alert(
        "알림",
        "그 자리/시간은 이미 예약이 있어요. 다른 시간이나 자리를 선택해 주세요.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        roomId: orderType === "takeout" ? "takeout" : selectedRoom!.id,
        roomLabel:
          orderType === "takeout"
            ? "포장 주문"
            : `${selectedRoom!.categoryLabel} ${selectedRoom!.number}번`,
        type:
          orderType === "takeout" ? ("TAKEOUT" as const) : ("DINE_IN" as const),
        date: selectedDate,
        time: selectedTime,
        name: name.trim(),
        phone: phone.trim(),
        peopleCount: orderType === "takeout" ? 1 : peopleCount,
        message: message.trim() || undefined,
        menus: selectedMenus,
      };

      if (isEditMode) {
        await updateReservationAsAdmin(Number(editId), payload, adminPassword);
        Alert.alert("알림", "예약이 수정되었습니다.", [
          { text: "확인", onPress: () => router.back() },
        ]);
      } else {
        await createReservationAsAdmin(payload, adminPassword);
        Alert.alert("알림", "예약이 등록되었습니다.", [
          { text: "확인", onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert(
        "알림",
        e.message ||
          (isEditMode
            ? "예약 수정에 실패했습니다."
            : "예약 등록에 실패했습니다."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const floorRooms = rooms.filter((r) => r.floor === selectedFloor);

  if (prefillLoading) {
    return (
      <View style={styles.loadingContainer}>
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
          <Ionicons name="call-outline" size={16} color={Palette.amberDeep} />
          <Text style={styles.hintText}>
            {isEditMode
              ? "손님이 전화로 요청하신 변경 내용을 반영해 주세요. 바뀐 자리·시간도 손님 앱에 자동으로 반영돼요."
              : '전화나 방문으로 예약을 요청하신 손님을 대신 등록해 주세요. 등록한 자리·시간은 손님 앱에서도 자동으로 "이미 찬 자리"로 표시돼요.'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>예약 유형</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[
              styles.typeTab,
              orderType === "dine_in" && styles.typeTabActive,
            ]}
            onPress={() => {
              setOrderType("dine_in");
              setSelectedTime(null);
            }}
          >
            <Text
              style={[
                styles.typeTabText,
                orderType === "dine_in" && styles.typeTabTextActive,
              ]}
            >
              🍽 방문 예약
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeTab,
              orderType === "takeout" && styles.typeTabActive,
            ]}
            onPress={() => {
              setOrderType("takeout");
              setSelectedTime(null);
            }}
          >
            <Text
              style={[
                styles.typeTabText,
                orderType === "takeout" && styles.typeTabTextActive,
              ]}
            >
              🥡 포장 주문
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>날짜 선택</Text>
        {renderCalendar()}
        {selectedDate && (
          <Text style={styles.selectedDateText}>선택: {selectedDate}</Text>
        )}

        {orderType === "dine_in" && (
          <>
            <Text style={styles.sectionTitle}>좌석 / 룸 선택</Text>
            <View style={styles.floorTabRow}>
              {([1, 2] as const).map((floor) => (
                <TouchableOpacity
                  key={floor}
                  style={[
                    styles.floorTab,
                    selectedFloor === floor && styles.floorTabActive,
                  ]}
                  onPress={() => setSelectedFloor(floor)}
                >
                  <Text
                    style={[
                      styles.floorTabText,
                      selectedFloor === floor && styles.floorTabTextActive,
                    ]}
                  >
                    {floor}층
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {roomsLoading ? (
              <ActivityIndicator
                color={Palette.amberDeep}
                style={{ marginVertical: Spacing.lg }}
              />
            ) : (
              <View style={styles.roomChipRow}>
                {floorRooms.map((room) => {
                  const active = selectedRoom?.id === room.id;
                  const roomTakenTimes = new Set(
                    takenSlots
                      .filter(
                        (slot) =>
                          slot.roomId === room.id &&
                          !(
                            isEditMode &&
                            editingOriginal?.roomId === room.id &&
                            editingOriginal?.time === slot.time
                          ),
                      )
                      .map((slot) => slot.time),
                  );
                  const fullyBooked =
                    timeSlots.length > 0 &&
                    timeSlots.every((t) => roomTakenTimes.has(t));
                  return (
                    <TouchableOpacity
                      key={room.id}
                      disabled={fullyBooked}
                      style={[
                        styles.roomChip,
                        active && styles.roomChipActive,
                        fullyBooked && styles.roomChipDisabled,
                      ]}
                      onPress={() => {
                        setSelectedRoom(room);
                        setSelectedTime(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.roomChipText,
                          active && styles.roomChipTextActive,
                          fullyBooked && styles.roomChipTextDisabled,
                        ]}
                      >
                        {room.categoryLabel} {room.number}번
                      </Text>
                      <Text
                        style={[
                          styles.roomChipCapacity,
                          active && styles.roomChipTextActive,
                          fullyBooked && styles.roomChipTextDisabled,
                        ]}
                      >
                        {fullyBooked ? "예약 마감" : room.capacity}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>
          {orderType === "takeout" ? "픽업 시간" : "방문 시간"}
          {loadingAvailability ? " (예약 현황 확인 중...)" : ""}
        </Text>
        <View style={styles.timeGrid}>
          {timeSlots.map((time) => {
            const taken = isTimeTaken(time);
            return (
              <TouchableOpacity
                key={time}
                disabled={taken}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.timeSlotActive,
                  taken && styles.timeSlotTaken,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === time && styles.timeTextActive,
                    taken && styles.timeTextTaken,
                  ]}
                >
                  {time}
                </Text>
                {taken && <Text style={styles.timeTakenLabel}>예약있음</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>메뉴 (선택)</Text>
        <View style={styles.card}>
          {Object.keys(RESERVATION_MENU_DATA).map((category) => (
            <View key={category} style={styles.menuCategory}>
              <Text style={styles.menuCategoryTitle}>{category}</Text>
              {RESERVATION_MENU_DATA[category].map((item) => (
                <View key={item.id} style={styles.menuRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.menuPrice}>{item.price}</Text>
                  </View>
                  <View style={styles.menuStepper}>
                    <TouchableOpacity
                      style={styles.menuStepBtn}
                      onPress={() => handleUpdateMenuQty(item.id, -1)}
                    >
                      <Ionicons
                        name="remove"
                        size={14}
                        color={Palette.inkSoft}
                      />
                    </TouchableOpacity>
                    <Text style={styles.menuQty}>
                      {selectedMenus[item.id] || 0}
                    </Text>
                    <TouchableOpacity
                      style={styles.menuStepBtn}
                      onPress={() => handleUpdateMenuQty(item.id, 1)}
                    >
                      <Ionicons
                        name="add"
                        size={14}
                        color={Palette.amberDeep}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>예약자 정보</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>성함</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="예: 김성공"
            placeholderTextColor={Palette.inkFaint}
          />
          <Text style={styles.fieldLabel}>연락처</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="예: 010-1234-5678"
            placeholderTextColor={Palette.inkFaint}
            keyboardType="phone-pad"
          />
          {orderType === "dine_in" && (
            <>
              <Text style={styles.fieldLabel}>인원</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setPeopleCount((p) => Math.max(1, p - 1))}
                >
                  <Ionicons name="remove" size={18} color={Palette.ink} />
                </TouchableOpacity>
                <Text style={styles.stepValue}>{peopleCount}명</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setPeopleCount((p) => p + 1)}
                >
                  <Ionicons name="add" size={18} color={Palette.ink} />
                </TouchableOpacity>
              </View>
            </>
          )}
          <Text style={styles.fieldLabel}>메모 (선택)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline, { marginBottom: 0 }]}
            value={message}
            onChangeText={setMessage}
            placeholder="예: 전화 예약, 창가 자리 요청"
            placeholderTextColor={Palette.inkFaint}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Palette.white} />
          ) : (
            <Text style={styles.submitBtnText}>
              {isEditMode ? "예약 수정하기" : "예약 등록하기"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  loadingContainer: {
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Palette.ink,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  typeRow: { flexDirection: "row", gap: 8 },
  typeTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.md,
    backgroundColor: Palette.creamDim,
  },
  typeTabActive: { backgroundColor: Palette.charcoal },
  typeTabText: { fontSize: 13, fontWeight: "700", color: Palette.inkSoft },
  typeTabTextActive: { color: Palette.cream },
  calendarCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
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
    width: 32,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: Palette.inkFaint,
  },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCellEmpty: { width: `${100 / 7}%` as any, height: 38 },
  dayCell: {
    width: `${100 / 7}%` as any,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
  },
  dayCellSelected: { backgroundColor: Palette.charcoal },
  dayCellDisabled: { opacity: 0.3 },
  dayText: { fontSize: 13, color: Palette.ink },
  dayTextSelected: { color: Palette.cream, fontWeight: "800" },
  dayTextDisabled: { color: Palette.inkFaint },
  selectedDateText: {
    marginTop: Spacing.sm,
    textAlign: "center",
    fontWeight: "700",
    color: Palette.amberDeep,
    fontSize: 13,
  },
  floorTabRow: { flexDirection: "row", gap: 8, marginBottom: Spacing.md },
  floorTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    backgroundColor: Palette.creamDim,
  },
  floorTabActive: { backgroundColor: Palette.charcoal },
  floorTabText: { fontSize: 13, fontWeight: "700", color: Palette.ink },
  floorTabTextActive: { color: Palette.cream },
  roomChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roomChip: {
    minWidth: 68,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
    backgroundColor: Palette.creamDim,
    alignItems: "center",
  },
  roomChipActive: {
    backgroundColor: Palette.amberSoft,
    borderWidth: 1,
    borderColor: Palette.amber,
  },
  roomChipDisabled: {
    backgroundColor: Palette.line,
    opacity: 0.6,
  },
  roomChipText: { fontSize: 13, fontWeight: "600", color: Palette.ink },
  roomChipTextActive: { color: Palette.amberDeep, fontWeight: "700" },
  roomChipTextDisabled: { color: Palette.inkFaint },
  roomChipCapacity: { fontSize: 9.5, color: Palette.inkFaint, marginTop: 1 },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeSlot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.sm,
    backgroundColor: Palette.creamDim,
    alignItems: "center",
  },
  timeSlotActive: {
    backgroundColor: Palette.amberSoft,
    borderWidth: 1,
    borderColor: Palette.amber,
  },
  timeSlotTaken: {
    backgroundColor: Palette.line,
    opacity: 0.6,
  },
  timeText: { fontSize: 13, color: Palette.ink },
  timeTextActive: { color: Palette.amberDeep, fontWeight: "700" },
  timeTextTaken: {
    color: Palette.inkFaint,
    textDecorationLine: "line-through",
  },
  timeTakenLabel: { fontSize: 9, color: Palette.inkFaint, marginTop: 2 },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  menuCategory: { marginBottom: Spacing.md },
  menuCategoryTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: Palette.amberDeep,
    marginBottom: Spacing.sm,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  menuName: { fontSize: 13.5, fontWeight: "600", color: Palette.ink },
  menuPrice: { fontSize: 11.5, color: Palette.inkFaint, marginTop: 2 },
  menuStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.creamDim,
    padding: 4,
    borderRadius: Radius.sm,
  },
  menuStepBtn: { padding: 6 },
  menuQty: {
    fontSize: 13,
    fontWeight: "700",
    marginHorizontal: 6,
    minWidth: 16,
    textAlign: "center",
    color: Palette.ink,
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
  inputMultiline: { height: 70 },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.creamDim,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  submitBtn: {
    backgroundColor: Palette.charcoal,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: Palette.cream },
});
