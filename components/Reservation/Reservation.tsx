// components/Reservation/Reservation.tsx
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  HeaderBackButton,
  HeaderRightIcons,
  HeaderTitle,
} from "@/components/common/ScreenHeader";
import { useAuth } from "@/components/contexts/AuthContext";
import { useProfile } from "@/components/contexts/ProfileContext";
import { ReservationContext } from "@/components/contexts/ReservationContext";
import {
  getGroupCapacityRange,
  RoomOption,
  RoomsContext,
} from "@/components/contexts/RoomsContext";
import { getReservationAvailability, TakenSlot } from "@/constants/api";
import { findMenuItemById, resolveImageSource } from "@/constants/menu-data";
import {
  getReservationMenuName,
  RESERVATION_MENU_DATA,
} from "@/constants/reservation-menu-data";
import { RESERVATION_TIME_SLOTS } from "@/constants/rooms-data";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const { width } = Dimensions.get("window");

const RESTAURANT_PHONE = "0507-1410-7634";

const HOLIDAYS = new Set([
  "2025-01-01",
  "2025-01-28",
  "2025-01-29",
  "2025-01-30",
  "2025-03-01",
  "2025-05-05",
  "2025-05-06",
  "2025-06-06",
  "2025-08-15",
  "2025-10-03",
  "2025-10-05",
  "2025-10-06",
  "2025-10-07",
  "2025-10-09",
  "2025-12-25",
  "2026-01-01",
  "2026-02-16",
  "2026-02-17",
  "2026-02-18",
  "2026-03-01",
  "2026-05-05",
  "2026-06-06",
  "2026-08-15",
  "2026-10-01",
  "2026-10-02",
  "2026-10-09",
  "2026-12-25",
]);

const HOLIDAY_NAMES: Record<string, string> = {
  "2025-01-01": "신정",
  "2025-01-28": "설날 연휴",
  "2025-01-29": "설날",
  "2025-01-30": "설날 연휴",
  "2025-03-01": "삼일절",
  "2025-05-05": "어린이날",
  "2025-05-06": "대체공휴일",
  "2025-06-06": "현충일",
  "2025-08-15": "광복절",
  "2025-10-03": "개천절",
  "2025-10-05": "추석 연휴",
  "2025-10-06": "추석",
  "2025-10-07": "추석 연휴",
  "2025-10-09": "한글날",
  "2025-12-25": "크리스마스",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 예약 가능 시간(RESERVATION_TIME_SLOTS)은 constants/rooms-data.ts에서 가져옵니다.
// 좌석 안내 화면(RoomDetail)에서도 같은 배열을 참조해서 항상 같은 시간이 보여요.

const toDateStr = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export default function Reservation() {
  const router = useRouter();
  const { cartMenus, editId, presetRoomId, presetTime, mode } =
    useLocalSearchParams<{
      cartMenus?: string;
      editId?: string;
      presetRoomId?: string;
      presetTime?: string;
      mode?: string;
    }>();
  const { addReservation, updateReservation, findReservationById } =
    useContext(ReservationContext);
  const { profile, saveProfile } = useProfile();
  const { user, isLoaded } = useAuth();
  const {
    rooms,
    loading: roomsLoading,
    findRoomById,
    groupFloor1Rooms,
    groupFloor2Rooms,
  } = useContext(RoomsContext);

  const existingReservation = editId ? findReservationById(editId) : undefined;
  const isEditMode = !!existingReservation;

  // 방문 예약 / 포장 주문 탭 — 다른 화면에서 ?mode=takeout으로 넘어오면 바로 포장 탭으로 시작해요.
  const [orderMode, setOrderMode] = useState<"dine_in" | "takeout">(
    existingReservation?.type ?? (mode === "takeout" ? "takeout" : "dine_in"),
  );

  const today = new Date();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState(
    existingReservation?.phone || profile?.phone || "",
  );
  const [name, setName] = useState(
    existingReservation?.name || user?.nickname || profile?.name || "",
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    existingReservation?.date ?? null,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    existingReservation?.time ?? presetTime ?? null,
  );
  // 좌석 안내 화면(RoomDetail)에서 "이 방으로 예약하기"로 넘어온 경우 presetRoomId로 미리 선택돼요.
  const [selectedRoom, setSelectedRoom] = useState<RoomOption | null>(
    () =>
      findRoomById(existingReservation?.roomId ?? presetRoomId ?? "") ?? null,
  );
  const [selectedFloor, setSelectedFloor] = useState<1 | 2>(
    () =>
      findRoomById(existingReservation?.roomId ?? presetRoomId ?? "")?.floor ??
      1,
  );
  const [peopleCount, setPeopleCount] = useState(
    existingReservation?.peopleCount ?? 2,
  );

  // 좌석 목록은 이제 서버에서 비동기로 불러오기 때문에, 화면이 처음 뜰 때는
  // 아직 목록이 비어있어서 위 findRoomById가 못 찾을 수 있어요. 목록을 다
  // 불러오면 이 effect가 한 번 더 시도해서 예약수정/좌석상세에서 넘어온
  // 좌석을 다시 정확히 선택해줍니다.
  useEffect(() => {
    const targetId = existingReservation?.roomId ?? presetRoomId;
    if (!targetId) return;
    const room = findRoomById(targetId);
    if (room) {
      setSelectedRoom(room);
      setSelectedFloor(room.floor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);
  const [selectedMenus, setSelectedMenus] = useState<Record<string, number>>(
    existingReservation?.menus ?? {},
  );
  const [message, setMessage] = useState(existingReservation?.message ?? "");
  const [hasPet, setHasPet] = useState(existingReservation?.hasPet ?? false);
  const [wantsTakeout, setWantsTakeout] = useState(
    existingReservation?.wantsTakeout ?? false,
  );
  const [takeoutMenus, setTakeoutMenus] = useState<Record<string, number>>(
    existingReservation?.takeoutMenus ?? {},
  );
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [submitting, setSubmitting] = useState(false);
  // 반려동물 외 나머지 옵션(포장, 전달 말씀)은 접어둔 상태로 시작해서 화면을 덜 복잡하게 보여줘요.
  const [showMoreOptions, setShowMoreOptions] = useState(
    () => wantsTakeout || !!message,
  );

  // 선택한 날짜에 이미 찬 (자리, 시간) 목록 — 서버에서 받아와 버튼을 회색 처리합니다.
  const [takenSlots, setTakenSlots] = useState<TakenSlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    if (!selectedDate) {
      setTakenSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingAvailability(true);
    getReservationAvailability(selectedDate)
      .then((slots) => {
        if (!cancelled) setTakenSlots(slots);
      })
      .catch(() => {
        if (!cancelled) setTakenSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  // 지금 고른 자리 기준으로, 이미 찬 시간인지 확인
  const isTimeTaken = (time: string) => {
    if (!selectedRoom) return false;
    // 수정 모드에서 내가 원래 갖고 있던 바로 그 자리/시간은 "찬 것"으로 취급하지 않음
    if (
      isEditMode &&
      existingReservation?.roomId === selectedRoom.id &&
      existingReservation?.time === time
    ) {
      return false;
    }
    return takenSlots.some(
      (slot) => slot.roomId === selectedRoom.id && slot.time === time,
    );
  };

  // 오늘 날짜를 골랐다면, 이미 지나간 시간은 예약할 수 없게 막습니다.
  const isTimePast = (time: string) => {
    if (!selectedDate) return false;
    const now = new Date();
    const todayStr = toDateStr(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    if (selectedDate !== todayStr) return false;
    const [h, m] = time.split(":").map(Number);
    const slotMinutes = h * 60 + m;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes <= nowMinutes;
  };

  // 저장된 프로필(또는 로그인 닉네임)이 늦게 로드되는 경우를 대비해, 값이 들어오면 한 번 더 반영
  useEffect(() => {
    if (!isEditMode) {
      if (profile) {
        setPhone((prev) => prev || profile.phone);
      }
      // 로그인 상태면 닉네임을 우선으로, 아니면 저장된 프로필 이름을 씁니다.
      if (user?.nickname) {
        setName((prev) => prev || user.nickname);
      } else if (profile?.name) {
        setName((prev) => prev || profile.name);
      }
    }
  }, [profile, user, isEditMode]);

  // 장바구니에서 넘어온 메뉴를 selectedMenus 초기값으로 반영 (수정 모드가 아닐 때만)
  useEffect(() => {
    if (cartMenus && !isEditMode) {
      try {
        const parsed = JSON.parse(cartMenus) as Record<string, number>;
        setSelectedMenus((prev) => ({ ...prev, ...parsed }));
      } catch {
        // 파싱 실패 시 무시
      }
    }
  }, [cartMenus, isEditMode]);

  const cameFromCart = !!cartMenus && !isEditMode;

  const makeCall = () => {
    Linking.openURL(`tel:${RESTAURANT_PHONE}`).catch(() =>
      Alert.alert("에러", "전화 걸기 기능을 실행할 수 없습니다."),
    );
  };

  const handleUpdateQuantity = (item: { id: string }, delta: number) => {
    const currentQty = selectedMenus[item.id] || 0;
    const newQty = Math.max(0, currentQty + delta);
    const newSelected = { ...selectedMenus };
    if (newQty === 0) delete newSelected[item.id];
    else newSelected[item.id] = newQty;
    setSelectedMenus(newSelected);
  };

  // "나가실 때 포장해서 가시나요?"에서 "네"를 골랐을 때, 어떤 메뉴를 포장해 갈지
  const handleUpdateTakeoutQuantity = (item: { id: string }, delta: number) => {
    const currentQty = takeoutMenus[item.id] || 0;
    const newQty = Math.max(0, currentQty + delta);
    const newSelected = { ...takeoutMenus };
    if (newQty === 0) delete newSelected[item.id];
    else newSelected[item.id] = newQty;
    setTakeoutMenus(newSelected);
  };

  const finalizeBooking = async () => {
    // ── 포장 주문 ──────────────────────────────────────────────
    if (orderMode === "takeout") {
      if (!selectedDate || !selectedTime) {
        Alert.alert("알림", "픽업 날짜와 시간을 선택해 주세요.");
        return;
      }
      if (Object.values(selectedMenus).every((qty) => !qty)) {
        Alert.alert("알림", "포장하실 메뉴를 하나 이상 선택해 주세요.");
        return;
      }
      if (!name.trim() || !phone.trim()) {
        Alert.alert("알림", "성함과 연락처를 입력해 주세요.");
        return;
      }

      setSubmitting(true);
      try {
        const takeoutPayload = {
          name,
          loginId: user?.loginId,
          phone,
          date: selectedDate,
          time: selectedTime,
          peopleCount: 1,
          roomId: "takeout",
          roomLabel: "포장 주문",
          type: "takeout" as const,
          menus: selectedMenus,
          message,
        };

        if (isEditMode && existingReservation) {
          await updateReservation(existingReservation.id, takeoutPayload);
          saveProfile({ name, phone });
          Alert.alert(
            "포장 주문이 수정되었습니다",
            "변경된 내용으로 업데이트되었습니다.",
            [{ text: "확인", onPress: () => router.back() }],
          );
          return;
        }

        await addReservation(takeoutPayload);
        saveProfile({ name, phone });

        Alert.alert(
          "포장 주문이 접수되었습니다",
          "선택하신 픽업 시간에 맞춰 준비해 드릴게요! 주문 내역은 마이페이지에서 확인 가능합니다.",
          [{ text: "확인", onPress: () => router.back() }],
        );
      } catch (e: any) {
        Alert.alert("포장 주문 실패", e.message || "포장 주문에 실패했습니다.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ── 방문 예약 ──────────────────────────────────────────────
    if (!selectedDate || !selectedTime || !selectedRoom) {
      Alert.alert(
        "알림",
        "날짜 · 시간 · 좌석을 모두 선택해야 예약을 완료할 수 있어요.",
      );
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode && existingReservation) {
        await updateReservation(existingReservation.id, {
          name,
          loginId: user?.loginId,
          phone,
          date: selectedDate,
          time: selectedTime,
          peopleCount,
          roomId: selectedRoom.id,
          roomLabel: `${selectedRoom.categoryLabel} ${selectedRoom.number}번`,
          type: "dine_in" as const,
          menus: selectedMenus,
          message,
          hasPet,
          wantsTakeout,
          takeoutMenus: wantsTakeout ? takeoutMenus : {},
        });

        saveProfile({ name, phone });

        Alert.alert(
          "예약이 수정되었습니다",
          "변경된 내용으로 예약이 업데이트되었습니다.",
          [{ text: "확인", onPress: () => router.back() }],
        );
        return;
      }

      await addReservation({
        name,
        loginId: user?.loginId,
        phone,
        date: selectedDate,
        time: selectedTime,
        peopleCount,
        roomId: selectedRoom.id,
        roomLabel: `${selectedRoom.categoryLabel} ${selectedRoom.number}번`,
        type: "dine_in" as const,
        menus: selectedMenus,
        message,
        hasPet,
        wantsTakeout,
        takeoutMenus: wantsTakeout ? takeoutMenus : {},
      });

      saveProfile({ name, phone });

      Alert.alert(
        "예약이 최종 완료되었습니다",
        "성공식당 방문을 환영합니다! 예약 내역은 마이페이지에서 확인 가능합니다.",
        [{ text: "확인", onPress: () => router.back() }],
      );
    } catch (e: any) {
      // 자리/시간이 방금 다른 손님에게 선점된 경우 등, 서버가 마지막에 거절한 경우
      Alert.alert("예약 실패", e.message || "예약에 실패했습니다.");
      if (selectedDate) {
        getReservationAvailability(selectedDate)
          .then(setTakenSlots)
          .catch(() => {});
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Calendar helpers ──────────────────────────────────────────────
  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const isWeekend = (year: number, month: number, day: number) => {
    const dow = new Date(year, month, day).getDay();
    return dow === 0 || dow === 6;
  };
  const isHoliday = (year: number, month: number, day: number) =>
    HOLIDAYS.has(toDateStr(year, month, day));
  const isPast = (year: number, month: number, day: number) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  };
  const isDisabled = (year: number, month: number, day: number) =>
    isPast(year, month, day) ||
    isWeekend(year, month, day) ||
    isHoliday(year, month, day);

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfMonth(calYear, calMonth);
    const cells: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const CELL_SIZE = (width - Spacing.lg * 2 - 12) / 7;

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => {
              if (calMonth === 0) {
                setCalYear(calYear - 1);
                setCalMonth(11);
              } else setCalMonth(calMonth - 1);
            }}
          >
            <Ionicons name="chevron-back" size={20} color={Palette.ink} />
          </TouchableOpacity>
          <Text style={styles.calendarMonthTitle}>
            {calYear}년 {calMonth + 1}월
          </Text>
          <TouchableOpacity
            style={styles.monthNavBtn}
            onPress={() => {
              if (calMonth === 11) {
                setCalYear(calYear + 1);
                setCalMonth(0);
              } else setCalMonth(calMonth + 1);
            }}
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
                { width: CELL_SIZE },
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
            if (!day)
              return (
                <View
                  key={`empty-${idx}`}
                  style={{ width: CELL_SIZE, height: 44 }}
                />
              );
            const dateStr = toDateStr(calYear, calMonth, day);
            const disabled = isDisabled(calYear, calMonth, day);
            const selected = selectedDate === dateStr;
            const dow = (firstDay + day - 1) % 7;
            const isSun = dow === 0;
            const isSat = dow === 6;
            const holiday = HOLIDAY_NAMES[dateStr];

            return (
              <TouchableOpacity
                key={dateStr}
                disabled={disabled}
                onPress={() => setSelectedDate(dateStr)}
                style={[
                  styles.dayCell,
                  { width: CELL_SIZE, height: 50 },
                  selected && styles.selectedDayCell,
                  disabled && styles.disabledDayCell,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    selected && styles.selectedDayText,
                    disabled && styles.disabledDayText,
                    !disabled && isSun && styles.sundayText,
                    !disabled && isSat && styles.saturdayText,
                  ]}
                >
                  {day}
                </Text>
                {holiday && (
                  <Text style={styles.holidayLabel} numberOfLines={1}>
                    {holiday.slice(0, 2)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: Palette.error }]}
            />
            <Text style={styles.legendText}>일/공휴일 - 전화 예약만</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#2979FF" }]} />
            <Text style={styles.legendText}>토요일 - 전화 예약만</Text>
          </View>
        </View>
      </View>
    );
  };

  // ── Step renderers ────────────────────────────────────────────────
  const renderStep1 = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.infoBanner}>
        <Ionicons name="time-outline" size={16} color={Palette.cream} />
        <Text style={styles.infoBannerText}>
          백숙 메뉴는 조리 시간이 40~60분 소요됩니다.
        </Text>
      </View>

      {isEditMode && (
        <View style={styles.editNoticeBanner}>
          <Ionicons name="create-outline" size={16} color={Palette.amberDeep} />
          <Text style={styles.editNoticeText}>
            기존 예약 내용을 수정하고 있습니다. 변경 후 완료를 눌러주세요.
          </Text>
        </View>
      )}

      {cameFromCart && (
        <View style={styles.cartNoticeBanner}>
          <Ionicons name="cart" size={16} color={Palette.amberDeep} />
          <Text style={styles.cartNoticeText}>
            장바구니에 담아두신 메뉴가 예약에 자동으로 반영되었습니다.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>방문 날짜 선택</Text>
        {renderCalendar()}
        {selectedDate && (
          <Text style={styles.selectedDateDisplay}>선택: {selectedDate}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>예약자 연락처</Text>
        <TextInput
          style={[styles.input, { marginBottom: Spacing.md }]}
          placeholder="전화번호를 입력해 주세요 (예: 010-1234-5678)"
          placeholderTextColor={Palette.inkFaint}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Text style={styles.sectionTitle}>예약자 성함</Text>
        <TextInput
          style={styles.input}
          placeholder="성함을 입력해 주세요"
          placeholderTextColor={Palette.inkFaint}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.rowTitle}>
          <Text style={styles.sectionTitle}>방문 인원</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setPeopleCount(Math.max(1, peopleCount - 1))}
            >
              <Ionicons name="remove" size={18} color={Palette.ink} />
            </TouchableOpacity>
            <Text style={styles.stepValue}>{peopleCount}명</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setPeopleCount(peopleCount + 1)}
            >
              <Ionicons name="add" size={18} color={Palette.ink} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>좌석 / 룸 선택</Text>
        <Text style={styles.sectionSubText}>
          원하시는 층과 자리를 먼저 골라주세요.
        </Text>

        <View style={styles.petToggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.petToggleTitle}>반려동물과 함께 오시나요?</Text>
            <Text style={styles.petToggleSubText}>
              반려동물 동반 시 홀이 아닌 룸으로만 예약하실 수 있어요.
            </Text>
          </View>
          <View style={styles.petToggleBtnRow}>
            <TouchableOpacity
              style={[
                styles.petToggleBtn,
                !hasPet && styles.petToggleBtnActive,
              ]}
              onPress={() => setHasPet(false)}
            >
              <Text
                style={[
                  styles.petToggleBtnText,
                  !hasPet && styles.petToggleBtnTextActive,
                ]}
              >
                아니요
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.petToggleBtn, hasPet && styles.petToggleBtnActive]}
              onPress={() => {
                setHasPet(true);
                // 지금 고른 자리가 홀(룸이 아님)이면 선택을 풀어 다시 고르게 합니다.
                if (selectedRoom && !selectedRoom.isRoom) {
                  setSelectedRoom(null);
                  setSelectedTime(null);
                }
              }}
            >
              <Text
                style={[
                  styles.petToggleBtnText,
                  hasPet && styles.petToggleBtnTextActive,
                ]}
              >
                네 🐾
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.floorTabRow}>
          {([1, 2] as const).map((floor) => {
            const active = selectedFloor === floor;
            return (
              <TouchableOpacity
                key={floor}
                style={[styles.floorTab, active && styles.floorTabActive]}
                onPress={() => setSelectedFloor(floor)}
              >
                <Text
                  style={[
                    styles.floorTabText,
                    active && styles.floorTabTextActive,
                  ]}
                >
                  {floor}층
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {roomsLoading ? (
          <ActivityIndicator
            color={Palette.amberDeep}
            style={{ marginVertical: Spacing.lg }}
          />
        ) : (
          (selectedFloor === 1 ? groupFloor1Rooms() : groupFloor2Rooms()).map(
            (group) => (
              <View key={group.category} style={styles.roomGroup}>
                <Text style={styles.roomGroupTitle}>
                  {group.categoryLabel}
                  <Text style={styles.roomGroupCapacity}>
                    {"  ·  "}
                    {getGroupCapacityRange(group.rooms)}
                  </Text>
                </Text>
                <View style={styles.roomChipRow}>
                  {group.rooms.map((room) => {
                    const active = selectedRoom?.id === room.id;
                    const blockedForPet = hasPet && !room.isRoom;
                    return (
                      <TouchableOpacity
                        key={room.id}
                        disabled={blockedForPet}
                        style={[
                          styles.roomChip,
                          active && styles.activeBtn,
                          blockedForPet && styles.timeSlotTaken,
                        ]}
                        onPress={() => {
                          setSelectedRoom(room);
                          // 좌석이 바뀌면 이전에 고른 시간은 다시 선택하도록 초기화
                          setSelectedTime(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.roomChipText,
                            active && styles.activeBtnText,
                            blockedForPet && styles.timeTextTaken,
                          ]}
                        >
                          {room.number}번
                        </Text>
                        <Text
                          style={[
                            styles.roomChipCapacity,
                            active && styles.activeBtnText,
                            blockedForPet && styles.timeTextTaken,
                          ]}
                        >
                          {room.capacity}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {hasPet && !group.isRoom && (
                  <Text style={styles.roomGroupNote}>
                    🐾 반려동물 동반 시에는 이 자리를 선택할 수 없어요. 룸을
                    선택해 주세요.
                  </Text>
                )}
                {group.note && (
                  <Text style={styles.roomGroupNote}>{group.note}</Text>
                )}
              </View>
            ),
          )
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>방문 시간</Text>
        {selectedRoom ? (
          <>
            <Text style={styles.sectionSubText}>
              {selectedRoom.categoryLabel} {selectedRoom.number}번 · 1회 이용
              시간은 1시간입니다.
              {loadingAvailability ? " (예약 현황 확인 중...)" : ""}
            </Text>
            <View style={styles.timeGrid}>
              {RESERVATION_TIME_SLOTS.map((time) => {
                const past = isTimePast(time);
                const bookedByOther = !past && isTimeTaken(time);
                const disabled = past || bookedByOther;
                return (
                  <TouchableOpacity
                    key={time}
                    disabled={disabled}
                    style={[
                      styles.timeSlot,
                      selectedTime === time && styles.activeBtn,
                      disabled && styles.timeSlotTaken,
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        selectedTime === time && styles.activeBtnText,
                        disabled && styles.timeTextTaken,
                      ]}
                    >
                      {time}
                    </Text>
                    {disabled && (
                      <Text style={styles.timeTakenLabel}>
                        {past ? "지난 시간" : "예약마감"}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.timeLockedBox}>
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={Palette.inkFaint}
            />
            <Text style={styles.timeLockedText}>
              좌석을 먼저 선택하시면 예약 가능한 시간이 나타나요.
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.moreOptionsToggle}
        onPress={() => setShowMoreOptions((prev) => !prev)}
      >
        <View style={styles.moreOptionsToggleLeft}>
          <Ionicons name="options-outline" size={16} color={Palette.inkSoft} />
          <Text style={styles.moreOptionsToggleText}>
            추가 옵션 (포장, 전달 말씀)
          </Text>
          {(wantsTakeout || !!message) && (
            <View style={styles.moreOptionsBadge}>
              <Text style={styles.moreOptionsBadgeText}>설정됨</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={showMoreOptions ? "chevron-up" : "chevron-down"}
          size={18}
          color={Palette.inkFaint}
        />
      </TouchableOpacity>

      {showMoreOptions && (
        <>
          <View style={styles.section}>
            <View style={styles.petToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.petToggleTitle}>
                  나가실 때 포장해서 가시나요?
                </Text>
                <Text style={styles.petToggleSubText}>
                  남은 음식을 포장해 가실 계획이면 미리 알려주세요.
                </Text>
              </View>
              <View style={styles.petToggleBtnRow}>
                <TouchableOpacity
                  style={[
                    styles.petToggleBtn,
                    !wantsTakeout && styles.petToggleBtnActive,
                  ]}
                  onPress={() => setWantsTakeout(false)}
                >
                  <Text
                    style={[
                      styles.petToggleBtnText,
                      !wantsTakeout && styles.petToggleBtnTextActive,
                    ]}
                  >
                    아니요
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.petToggleBtn,
                    wantsTakeout && styles.petToggleBtnActive,
                  ]}
                  onPress={() => setWantsTakeout(true)}
                >
                  <Text
                    style={[
                      styles.petToggleBtnText,
                      wantsTakeout && styles.petToggleBtnTextActive,
                    ]}
                  >
                    네 🥡
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {wantsTakeout && (
              <View style={styles.takeoutMenuBox}>
                <Text style={styles.takeoutMenuTitle}>
                  🥡 포장해 가실 메뉴를 선택해 주세요
                </Text>
                {Object.keys(RESERVATION_MENU_DATA).map((category) => (
                  <View key={category} style={styles.takeoutMenuCategory}>
                    <Text style={styles.takeoutMenuCategoryTitle}>
                      {category}
                    </Text>
                    {RESERVATION_MENU_DATA[category].map((item) => (
                      <View key={item.id} style={styles.takeoutMenuRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.takeoutMenuName}>
                            {item.name}
                          </Text>
                          <Text style={styles.takeoutMenuPrice}>
                            {item.price}
                          </Text>
                        </View>
                        <View style={styles.menuStepper}>
                          <TouchableOpacity
                            style={styles.menuStepBtn}
                            onPress={() =>
                              handleUpdateTakeoutQuantity(item, -1)
                            }
                          >
                            <Ionicons
                              name="remove"
                              size={14}
                              color={Palette.inkSoft}
                            />
                          </TouchableOpacity>
                          <Text style={styles.menuQty}>
                            {takeoutMenus[item.id] || 0}
                          </Text>
                          <TouchableOpacity
                            style={styles.menuStepBtn}
                            onPress={() => handleUpdateTakeoutQuantity(item, 1)}
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
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>사장님께 전달하고 싶은 말씀</Text>
            <Text style={styles.sectionSubText}>
              알레르기, 아이 의자 필요 여부 등 미리 알려주시면 준비하겠습니다.
              (선택)
            </Text>
            <TextInput
              style={styles.messageInput}
              placeholder="예: 아이 의자 1개 부탁드려요"
              placeholderTextColor={Palette.inkFaint}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={200}
            />
          </View>
        </>
      )}

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>안내사항</Text>
        <Text style={styles.noticeBodyText}>
          • 1회 예약은 1시간만 이용 가능합니다. 더 길게 이용하고 싶으시면 전화로
          문의해 주세요.
        </Text>
        <Text style={styles.noticeBodyText}>
          • 이용 시간을 초과하시면 추가 요금이 발생할 수 있습니다. 특히
          주말·공휴일은 방문 고객이 많아 시간 준수에 양해 부탁드립니다.
        </Text>
        <Text style={styles.noticeBodyText}>
          • 주말 및 공휴일은 온라인 예약이 불가합니다. 전화로 문의 주세요.
        </Text>
        <Text style={styles.noticeBodyText}>
          • 선택하신 좌석/룸은 사장님 확인 후 최종 확정됩니다. 매장 상황에 따라
          다른 자리로 안내될 수 있는 점 양해 부탁드립니다.
        </Text>
        <Text style={styles.noticeBodyText}>
          • 당일 예약은 매장 상황에 따라 변동될 수 있습니다.
        </Text>
        <Text style={styles.noticeBodyText}>
          • 단체 예약(10인 이상)은 꼭 전화로 문의주세요.
        </Text>
      </View>

      <View style={{ height: 130 }} />
    </ScrollView>
  );

  const renderStep2 = () => (
    <View style={styles.confirmContainer}>
      <View style={styles.confirmCard}>
        <Ionicons
          name="checkmark-circle"
          size={52}
          color={Palette.amber}
          style={{ alignSelf: "center" }}
        />
        <Text style={styles.confirmHeading}>
          {isEditMode
            ? "수정 내용을 확인해 주세요"
            : "예약 내용을 확인해 주세요"}
        </Text>
        <View style={styles.confirmDetails}>
          {[
            ["성함", name],
            ["연락처", phone],
            ["날짜", selectedDate],
            ["인원", `${peopleCount}명`],
            ["시간", selectedTime],
            [
              "좌석/룸",
              selectedRoom
                ? `${selectedRoom.categoryLabel} ${selectedRoom.number}번`
                : null,
            ],
            ...(message.trim() ? [["전달 말씀", message.trim()]] : []),
            ["반려동물 동반", hasPet ? "네 🐾" : "아니요"],
            ["포장", wantsTakeout ? "네 🥡" : "아니요"],
          ].map(([label, value]) => (
            <View key={label} style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>{label}</Text>
              <Text style={styles.confirmValue}>{value}</Text>
            </View>
          ))}
        </View>
        {wantsTakeout &&
          Object.entries(takeoutMenus).some(([, qty]) => qty > 0) && (
            <View style={styles.confirmCard}>
              <Text style={styles.confirmCardTitle}>🥡 포장해 가실 메뉴</Text>
              {Object.entries(takeoutMenus)
                .filter(([, qty]) => qty > 0)
                .map(([id, qty]) => (
                  <Text key={id} style={styles.confirmValue}>
                    {getReservationMenuName(id)} × {qty}
                  </Text>
                ))}
            </View>
          )}
        <Text style={styles.confirmQuestion}>
          {isEditMode
            ? "이 내용으로 예약을 수정하시겠습니까?"
            : "이 내용으로 예약을 진행하시겠습니까?"}
        </Text>
        <View style={styles.confirmActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep(1)}>
            <Text style={styles.cancelBtnText}>수정하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => setStep(3)}
          >
            <Text style={styles.confirmBtnText}>
              {isEditMode ? "네, 수정합니다" : "네, 예약합니다"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => {
    const totalCount = Object.values(selectedMenus).reduce((a, b) => a + b, 0);

    // 선택된 메뉴들의 상세 정보 모으기 (이름, 가격, 수량, 이미지)
    const selectedItems = Object.entries(selectedMenus)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        let menuInfo: { name: string; price: string } | undefined;
        for (const category of Object.values(RESERVATION_MENU_DATA)) {
          const found = category.find((item) => item.id === id);
          if (found) {
            menuInfo = found;
            break;
          }
        }

        const fullMenuItem = findMenuItemById(id);

        return {
          id,
          name: menuInfo?.name ?? id,
          price: menuInfo?.price ?? "",
          priceNum: menuInfo
            ? parseInt(menuInfo.price.replace(/[^0-9]/g, ""), 10) || 0
            : 0,
          quantity: qty,
          image: fullMenuItem?.image,
        };
      });

    const totalPrice = selectedItems.reduce(
      (sum, item) => sum + item.priceNum * item.quantity,
      0,
    );

    return (
      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.menuIntro}>
            <Text style={styles.menuIntroTitle}>
              방문 즉시 식사하실 수 있게
            </Text>
            <Text style={styles.menuIntroSub}>
              {cameFromCart
                ? "장바구니 메뉴가 반영되었습니다. 필요하면 수정해 주세요."
                : isEditMode
                  ? "기존에 선택하신 메뉴입니다. 필요하면 수정해 주세요."
                  : "미리 메뉴를 선택해 주세요 (권장)"}
            </Text>
          </View>
          {Object.keys(RESERVATION_MENU_DATA).map((category) => (
            <View key={category} style={styles.menuSection}>
              <Text style={styles.menuSectionHeader}>{category}</Text>
              {RESERVATION_MENU_DATA[category].map((item) => {
                const fullItem = findMenuItemById(item.id);
                return (
                  <View key={item.id} style={styles.menuItemRow}>
                    <View style={styles.menuItemImageWrap}>
                      {fullItem?.image ? (
                        <Image
                          source={
                            resolveImageSource(fullItem.image) ?? undefined
                          }
                          style={styles.menuItemImage}
                        />
                      ) : (
                        <View style={styles.menuItemImagePlaceholder}>
                          <Ionicons
                            name="restaurant-outline"
                            size={18}
                            color={Palette.amberDeep}
                          />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      <Text style={styles.menuItemPrice}>{item.price}</Text>
                    </View>
                    <View style={styles.menuStepper}>
                      <TouchableOpacity
                        style={styles.menuStepBtn}
                        onPress={() => handleUpdateQuantity(item, -1)}
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
                        onPress={() => handleUpdateQuantity(item, 1)}
                      >
                        <Ionicons
                          name="add"
                          size={14}
                          color={Palette.amberDeep}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* 선택된 메뉴 요약 — 버튼 바로 위 */}
        {selectedItems.length > 0 && (
          <View style={styles.summaryWrap}>
            <Text style={styles.summaryTitle}>선택한 메뉴</Text>
            <ScrollView style={styles.summaryList} nestedScrollEnabled>
              {selectedItems.map((item) => (
                <View key={item.id} style={styles.summaryRow}>
                  <View style={styles.summaryImageWrap}>
                    {item.image ? (
                      <Image
                        source={resolveImageSource(item.image) ?? undefined}
                        style={styles.summaryImage}
                      />
                    ) : (
                      <View style={styles.summaryImagePlaceholder}>
                        <Ionicons
                          name="restaurant-outline"
                          size={16}
                          color={Palette.amberDeep}
                        />
                      </View>
                    )}
                  </View>
                  <Text style={styles.summaryName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.summaryPrice}>{item.price}</Text>
                  <Text style={styles.summaryQty}>x{item.quantity}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>합계</Text>
              <Text style={styles.summaryTotalValue}>
                {totalPrice.toLocaleString()}원
              </Text>
            </View>
          </View>
        )}

        <View style={styles.menuFooter}>
          <Text style={styles.totalText}>선택된 메뉴: {totalCount}개</Text>
          <TouchableOpacity
            style={[styles.finalSubmitBtn, submitting && { opacity: 0.6 }]}
            onPress={finalizeBooking}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Palette.white} />
            ) : (
              <Text style={styles.finalSubmitBtnText}>
                {isEditMode ? "수정 완료" : "예약 최종 완료"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── 포장 주문 화면 (좌석 선택 없이, 메뉴+픽업 시간만) ──────────────
  const renderTakeoutForm = () => {
    const totalCount = Object.values(selectedMenus).reduce((a, b) => a + b, 0);

    return (
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.infoBanner}>
            <Ionicons name="bag-handle" size={16} color={Palette.cream} />
            <Text style={styles.infoBannerText}>
              포장 주문은 매장에서 픽업하시는 방식이에요. 배달은 지원하지
              않아요.
            </Text>
          </View>

          {isEditMode && (
            <View style={styles.editNoticeBanner}>
              <Ionicons
                name="create-outline"
                size={16}
                color={Palette.amberDeep}
              />
              <Text style={styles.editNoticeText}>
                기존 포장 주문 내용을 수정하고 있습니다.
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>픽업 날짜 선택</Text>
            {renderCalendar()}
            {selectedDate && (
              <Text style={styles.selectedDateDisplay}>
                선택: {selectedDate}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>픽업 시간</Text>
            {loadingAvailability && (
              <Text style={styles.sectionSubText}>예약 현황 확인 중...</Text>
            )}
            <View style={styles.timeGrid}>
              {RESERVATION_TIME_SLOTS.map((time) => {
                const past = isTimePast(time);
                return (
                  <TouchableOpacity
                    key={time}
                    disabled={past}
                    style={[
                      styles.timeSlot,
                      selectedTime === time && styles.activeBtn,
                      past && styles.timeSlotTaken,
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        selectedTime === time && styles.activeBtnText,
                        past && styles.timeTextTaken,
                      ]}
                    >
                      {time}
                    </Text>
                    {past && (
                      <Text style={styles.timeTakenLabel}>지난 시간</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>주문자 연락처</Text>
            <TextInput
              style={[styles.input, { marginBottom: Spacing.md }]}
              placeholder="전화번호를 입력해 주세요 (예: 010-1234-5678)"
              placeholderTextColor={Palette.inkFaint}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <Text style={styles.sectionTitle}>주문자 성함</Text>
            <TextInput
              style={styles.input}
              placeholder="성함을 입력해 주세요"
              placeholderTextColor={Palette.inkFaint}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>포장하실 메뉴 선택</Text>
            <Text style={styles.sectionSubText}>
              최소 1개 이상 선택해 주세요.
            </Text>
            {Object.keys(RESERVATION_MENU_DATA).map((category) => (
              <View key={category} style={styles.menuSection}>
                <Text style={styles.menuSectionHeader}>{category}</Text>
                {RESERVATION_MENU_DATA[category].map((item) => {
                  const fullItem = findMenuItemById(item.id);
                  return (
                    <View key={item.id} style={styles.menuItemRow}>
                      <View style={styles.menuItemImageWrap}>
                        {fullItem?.image ? (
                          <Image
                            source={
                              resolveImageSource(fullItem.image) ?? undefined
                            }
                            style={styles.menuItemImage}
                          />
                        ) : (
                          <View style={styles.menuItemImagePlaceholder}>
                            <Ionicons
                              name="restaurant-outline"
                              size={18}
                              color={Palette.amberDeep}
                            />
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.menuItemName}>{item.name}</Text>
                        <Text style={styles.menuItemPrice}>{item.price}</Text>
                      </View>
                      <View style={styles.menuStepper}>
                        <TouchableOpacity
                          style={styles.menuStepBtn}
                          onPress={() => handleUpdateQuantity(item, -1)}
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
                          onPress={() => handleUpdateQuantity(item, 1)}
                        >
                          <Ionicons
                            name="add"
                            size={14}
                            color={Palette.amberDeep}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>사장님께 전달하고 싶은 말씀</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="예: 매운 정도 약하게 해주세요"
              placeholderTextColor={Palette.inkFaint}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={200}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.menuFooter}>
          <Text style={styles.totalText}>선택된 메뉴: {totalCount}개</Text>
          <TouchableOpacity
            style={[styles.finalSubmitBtn, submitting && { opacity: 0.6 }]}
            onPress={finalizeBooking}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Palette.white} />
            ) : (
              <Text style={styles.finalSubmitBtnText}>
                {isEditMode ? "포장 주문 수정" : "포장 주문하기"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 로그인 상태를 아직 불러오는 중이면 잠시 대기
  if (!isLoaded) {
    return (
      <View style={[styles.container, styles.loginGateContainer]}>
        <ActivityIndicator color={Palette.amberDeep} />
      </View>
    );
  }

  // 예약도 리뷰처럼 로그인한 회원만 할 수 있게 합니다 (네이버 예약과 동일한 방식).
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loginGateContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={40}
            color={Palette.amberDeep}
          />
          <Text style={styles.loginGateTitle}>로그인이 필요해요</Text>
          <Text style={styles.loginGateDesc}>
            앱으로 방문 예약 · 포장 주문을 하시려면 로그인이 필요해요.{"\n"}
            로그인하면 방문 도장 적립, 리뷰 작성도 함께 이용하실 수 있어요.
          </Text>
          <TouchableOpacity
            style={styles.loginGateBtn}
            onPress={() => router.push("/login" as any)}
          >
            <Text style={styles.loginGateBtnText}>로그인하러 가기</Text>
          </TouchableOpacity>

          <View style={styles.loginGateDivider}>
            <View style={styles.loginGateDividerLine} />
            <Text style={styles.loginGateDividerText}>또는</Text>
            <View style={styles.loginGateDividerLine} />
          </View>

          <Text style={styles.loginGateCallDesc}>
            회원가입 없이 전화로도 예약 · 포장 주문 가능해요.
          </Text>
          <TouchableOpacity style={styles.loginGateCallBtn} onPress={makeCall}>
            <Ionicons name="call" size={16} color={Palette.amberDeep} />
            <Text style={styles.loginGateCallBtnText}>
              전화로 문의하기 ({RESTAURANT_PHONE})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <HeaderTitle
              eyebrow={
                orderMode === "takeout" ? "TAKEOUT ORDER" : "VISIT RESERVATION"
              }
              title={
                orderMode === "takeout"
                  ? isEditMode
                    ? "포장 주문 수정"
                    : "포장 주문"
                  : step === 3
                    ? "메뉴 선택"
                    : isEditMode
                      ? "예약 수정"
                      : "방문 예약"
              }
            />
          ),
          // 1단계에서는 화면 밖으로 나가고, 2·3단계에서는 이전 단계로만 돌아갑니다.
          headerLeft: () => (
            <HeaderBackButton
              onPress={() =>
                orderMode === "takeout" || step === 1
                  ? router.back()
                  : setStep(step - 1)
              }
            />
          ),
          headerRight: () => <HeaderRightIcons />,
        }}
      />

      {!isEditMode && (
        <View style={styles.modeTabRow}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              orderMode === "dine_in" && styles.modeTabActive,
            ]}
            onPress={() => {
              setOrderMode("dine_in");
              setSelectedTime(null);
            }}
          >
            <Ionicons
              name="restaurant-outline"
              size={15}
              color={orderMode === "dine_in" ? Palette.cream : Palette.inkSoft}
            />
            <Text
              style={[
                styles.modeTabText,
                orderMode === "dine_in" && styles.modeTabTextActive,
              ]}
            >
              방문 예약
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeTab,
              orderMode === "takeout" && styles.modeTabActive,
            ]}
            onPress={() => {
              setOrderMode("takeout");
              setSelectedTime(null);
            }}
          >
            <Ionicons
              name="bag-handle-outline"
              size={15}
              color={orderMode === "takeout" ? Palette.cream : Palette.inkSoft}
            />
            <Text
              style={[
                styles.modeTabText,
                orderMode === "takeout" && styles.modeTabTextActive,
              ]}
            >
              포장 주문
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {orderMode === "takeout" ? (
        renderTakeoutForm()
      ) : (
        <>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </>
      )}

      {orderMode === "dine_in" && step === 1 && (
        <View style={styles.fixedFooter}>
          <View style={styles.footerButtonRow}>
            <TouchableOpacity style={styles.callBtn} onPress={makeCall}>
              <Ionicons name="call" size={16} color={Palette.amberDeep} />
              <Text style={styles.callBtnText}>전화 문의</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mainActionBtn}
              onPress={() => {
                if (!phone.trim()) {
                  Alert.alert("알림", "전화번호를 입력해 주세요.");
                  return;
                }
                if (!name.trim()) {
                  Alert.alert("알림", "성함을 입력해 주세요.");
                  return;
                }
                if (!selectedDate) {
                  Alert.alert("알림", "날짜를 선택해 주세요.");
                  return;
                }
                if (!selectedRoom) {
                  Alert.alert("알림", "좌석 또는 룸을 먼저 선택해 주세요.");
                  return;
                }
                if (hasPet && !selectedRoom.isRoom) {
                  Alert.alert(
                    "알림",
                    "반려동물과 함께 오시는 경우 홀이 아닌 룸을 선택해 주세요.",
                  );
                  return;
                }
                if (
                  wantsTakeout &&
                  Object.values(takeoutMenus).every((qty) => !qty)
                ) {
                  Alert.alert(
                    "알림",
                    "포장해 가실 메뉴를 하나 이상 선택해 주세요.",
                  );
                  return;
                }
                if (!selectedTime) {
                  Alert.alert("알림", "방문 시간을 선택해 주세요.");
                  return;
                }
                if (isTimePast(selectedTime)) {
                  Alert.alert(
                    "알림",
                    "이미 지난 시간이에요. 다른 시간을 선택해 주세요.",
                  );
                  setSelectedTime(null);
                  return;
                }
                if (isTimeTaken(selectedTime)) {
                  Alert.alert(
                    "알림",
                    "죄송합니다, 방금 그 시간이 다른 손님에게 예약되었어요. 다른 시간을 선택해 주세요.",
                  );
                  setSelectedTime(null);
                  return;
                }
                setStep(2);
              }}
            >
              <Text style={styles.mainActionText}>
                {isEditMode ? "수정 내용 확인" : "예약하기"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerHint}>
            식당에 방문하실 때 이 예약자 연락처를 사장님께 알려 주시면 됩니다.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { paddingBottom: 20 },
  modeTabRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm + 4,
    paddingBottom: Spacing.sm,
    backgroundColor: Palette.cream,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.lg,
    backgroundColor: Palette.creamDim,
  },
  modeTabActive: {
    backgroundColor: Palette.charcoal,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.inkSoft,
  },
  modeTabTextActive: {
    color: Palette.cream,
  },
  loginGateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm + 4,
  },
  loginGateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.ink,
    marginTop: Spacing.sm,
  },
  loginGateDesc: {
    fontSize: 13,
    color: Palette.inkFaint,
    textAlign: "center",
    lineHeight: 20,
  },
  loginGateBtn: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  loginGateBtnText: {
    color: Palette.cream,
    fontSize: 15,
    fontWeight: "700",
  },
  loginGateDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    width: "100%",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  loginGateDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.line,
  },
  loginGateDividerText: {
    fontSize: 11,
    color: Palette.inkFaint,
  },
  loginGateCallDesc: {
    fontSize: 12,
    color: Palette.inkFaint,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  loginGateCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: Palette.amberDeep,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.lg,
  },
  loginGateCallBtnText: {
    color: Palette.amberDeep,
    fontSize: 14,
    fontWeight: "700",
  },
  infoBanner: {
    backgroundColor: Palette.charcoal,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoBannerText: { color: Palette.cream, fontSize: 12, fontWeight: "600" },
  editNoticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Palette.amberSoft,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
  },
  editNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: Palette.amberDeep,
  },
  cartNoticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Palette.amberSoft,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
  },
  cartNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: Palette.amberDeep,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.md,
  },

  // Calendar
  calendarContainer: { backgroundColor: Palette.cream },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm + 4,
  },
  calendarMonthTitle: { fontSize: 15, fontWeight: "700", color: Palette.ink },
  monthNavBtn: { padding: 6 },
  weekdayRow: { flexDirection: "row", marginBottom: 4 },
  weekdayLabel: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: Palette.inkFaint,
    paddingVertical: 4,
  },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.sm,
    marginVertical: 2,
  },
  selectedDayCell: { backgroundColor: Palette.amber, borderRadius: 10 },
  disabledDayCell: { opacity: 0.35 },
  dayText: { fontSize: 14, fontWeight: "500", color: Palette.ink },
  selectedDayText: { color: Palette.white, fontWeight: "700" },
  disabledDayText: { color: Palette.inkFaint },
  sundayText: { color: Palette.error },
  saturdayText: { color: "#2979FF" },
  holidayLabel: {
    fontSize: 8,
    color: Palette.error,
    textAlign: "center",
    marginTop: 1,
  },
  legend: { flexDirection: "row", marginTop: Spacing.sm + 4, gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  legendText: { fontSize: 11, color: Palette.inkFaint },
  selectedDateDisplay: {
    marginTop: Spacing.sm + 4,
    textAlign: "center",
    fontWeight: "700",
    color: Palette.amberDeep,
    fontSize: 13,
  },

  fixedFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm + 4,
    paddingBottom: 20,
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  footerButtonRow: {
    flexDirection: "row",
    gap: Spacing.sm + 2,
  },
  footerHint: {
    fontSize: 11,
    color: Palette.inkFaint,
    textAlign: "center",
    marginTop: Spacing.sm + 4,
  },

  // Form
  input: {
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  rowTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.pill,
    padding: 4,
  },
  stepBtn: {
    width: 32,
    height: 32,
    backgroundColor: Palette.white,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.card,
  },
  stepValue: {
    fontSize: 15,
    fontWeight: "700",
    marginHorizontal: Spacing.md,
    color: Palette.ink,
  },
  sectionSubText: {
    fontSize: 12,
    color: Palette.inkFaint,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  timeSlot: {
    width: (width - Spacing.lg * 2 - 32) / 4,
    marginHorizontal: 4,
    marginVertical: 4,
    backgroundColor: Palette.creamDim,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  timeText: { fontSize: 13, color: Palette.ink },
  timeSlotTaken: {
    backgroundColor: Palette.line,
    opacity: 0.6,
  },
  timeTextTaken: {
    color: Palette.inkFaint,
    textDecorationLine: "line-through",
  },
  timeTakenLabel: {
    fontSize: 9,
    color: Palette.inkFaint,
    marginTop: 2,
  },
  messageInput: {
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.line,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: 13,
    color: Palette.ink,
    minHeight: 70,
    textAlignVertical: "top",
  },
  timeLockedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Palette.creamDim,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  timeLockedText: {
    flex: 1,
    fontSize: 12,
    color: Palette.inkFaint,
    lineHeight: 17,
  },
  petToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  petToggleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: 2,
  },
  petToggleSubText: {
    fontSize: 11,
    color: Palette.inkFaint,
    lineHeight: 15,
  },
  petToggleBtnRow: {
    flexDirection: "row",
    gap: 6,
  },
  petToggleBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  petToggleBtnActive: {
    backgroundColor: Palette.amberDeep,
    borderColor: Palette.amberDeep,
  },
  petToggleBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.ink,
  },
  petToggleBtnTextActive: {
    color: Palette.white,
  },
  takeoutMenuBox: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  takeoutMenuTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm + 4,
  },
  takeoutMenuCategory: { marginBottom: Spacing.sm },
  takeoutMenuCategoryTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.amberDeep,
    marginBottom: 4,
  },
  takeoutMenuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  takeoutMenuName: { fontSize: 13, color: Palette.ink },
  takeoutMenuPrice: { fontSize: 11, color: Palette.inkFaint, marginTop: 2 },
  moreOptionsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  moreOptionsToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  moreOptionsToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.ink,
  },
  moreOptionsBadge: {
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  moreOptionsBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  floorTabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.md,
  },
  floorTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.md,
    backgroundColor: Palette.creamDim,
  },
  floorTabActive: {
    backgroundColor: Palette.charcoal,
  },
  floorTabText: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  floorTabTextActive: {
    color: Palette.cream,
  },
  roomGroup: { marginBottom: Spacing.md },
  roomGroupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm,
  },
  roomGroupCapacity: {
    fontSize: 12,
    fontWeight: "500",
    color: Palette.inkFaint,
  },
  roomChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roomChip: {
    minWidth: 52,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
    backgroundColor: Palette.creamDim,
    alignItems: "center",
  },
  roomChipText: { fontSize: 13, color: Palette.ink, fontWeight: "600" },
  roomChipCapacity: {
    fontSize: 9.5,
    color: Palette.inkFaint,
    marginTop: 1,
  },
  roomGroupNote: {
    fontSize: 11,
    color: Palette.amberDeep,
    marginTop: Spacing.sm,
    lineHeight: 16,
  },
  activeBtn: {
    backgroundColor: Palette.amberSoft,
    borderWidth: 1,
    borderColor: Palette.amber,
  },
  activeBtnText: { color: Palette.amberDeep, fontWeight: "700" },

  noticeBox: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm,
  },
  noticeBodyText: { fontSize: 12, color: Palette.inkSoft, lineHeight: 19 },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.amber,
  },
  callBtnText: { fontSize: 14, fontWeight: "700", color: Palette.amberDeep },
  mainActionBtn: {
    flex: 2,
    backgroundColor: Palette.charcoal,
    justifyContent: "center",
    alignItems: "center",
    height: 52,
    borderRadius: Radius.lg,
  },
  mainActionText: { fontSize: 16, color: Palette.cream, fontWeight: "700" },

  // Step 2
  confirmContainer: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: "center",
    marginBottom: 200,
  },
  confirmCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginTop: Spacing.md,
    ...Shadow.tabBar,
  },
  confirmCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm,
  },
  confirmHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.ink,
    textAlign: "center",
    marginVertical: Spacing.lg,
  },
  confirmDetails: {
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm + 4,
  },
  confirmLabel: { fontSize: 14, color: Palette.inkSoft },
  confirmValue: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  confirmQuestion: {
    fontSize: 13,
    color: Palette.inkFaint,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  confirmActions: { flexDirection: "row", gap: Spacing.sm + 2 },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.line,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtn: {
    flex: 2,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Palette.amber,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: { color: Palette.inkSoft, fontWeight: "600" },
  confirmBtnText: { color: Palette.white, fontWeight: "700" },

  // Step 3
  menuIntro: { padding: Spacing.lg, backgroundColor: Palette.amberSoft },
  menuIntroTitle: { fontSize: 16, fontWeight: "700", color: Palette.ink },
  menuIntroSub: { fontSize: 13, color: Palette.amberDeep, marginTop: 4 },
  menuSection: { paddingHorizontal: Spacing.lg },
  menuSectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.inkFaint,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
    letterSpacing: 0.5,
  },
  menuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
    gap: Spacing.sm + 4,
  },
  menuItemImageWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    overflow: "hidden",
    backgroundColor: Palette.creamDim,
  },
  menuItemImage: { width: "100%", height: "100%" },
  menuItemImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemName: { fontSize: 14, fontWeight: "600", color: Palette.ink },
  menuItemPrice: { fontSize: 12, color: Palette.amberDeep, marginTop: 2 },
  menuStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.creamDim,
    padding: 4,
    borderRadius: Radius.sm,
  },
  menuStepBtn: { padding: 8 },
  menuQty: {
    fontSize: 14,
    fontWeight: "700",
    marginHorizontal: 8,
    minWidth: 18,
    textAlign: "center",
    color: Palette.ink,
  },

  // 선택된 메뉴 요약
  summaryWrap: {
    backgroundColor: Palette.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    maxHeight: 180,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkSoft,
    marginBottom: Spacing.sm,
  },
  summaryList: {
    maxHeight: 120,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  summaryImageWrap: {
    width: 36,
    height: 36,
  },
  summaryImage: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Palette.creamDim,
  },
  summaryImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Palette.amberSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Palette.ink,
  },
  summaryPrice: {
    fontSize: 12,
    color: Palette.amberDeep,
    fontWeight: "700",
  },
  summaryQty: {
    fontSize: 12,
    color: Palette.inkFaint,
    width: 28,
    textAlign: "right",
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.ink,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.amberDeep,
  },

  menuFooter: {
    padding: Spacing.lg,
    paddingBottom: 20,
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  totalText: {
    fontSize: 13,
    color: Palette.inkFaint,
    marginBottom: Spacing.sm + 4,
    textAlign: "center",
  },
  finalSubmitBtn: {
    backgroundColor: Palette.charcoal,
    height: 54,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  finalSubmitBtnText: { color: Palette.cream, fontSize: 16, fontWeight: "700" },
});
