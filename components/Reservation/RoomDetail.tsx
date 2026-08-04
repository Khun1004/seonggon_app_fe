// components/Reservation/RoomDetail.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RoomCategory, RoomsContext } from "@/components/contexts/RoomsContext";
import {
  getReservationAvailability,
  getReservationTimeConfig,
  TakenSlot,
} from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

export default function RoomDetail() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const { rooms, groupRoomsByCategory, loading, refreshRooms } =
    useContext(RoomsContext);

  useFocusEffect(
    useCallback(() => {
      refreshRooms();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // 예약 가능 시간 — 관리자가 "예약 시간 설정"에서 정한 시간표를 그대로
  // 가져와요. 예약 화면(Reservation.tsx)이랑 항상 같은 시간이 보이도록,
  // 같은 서버 설정을 씁니다.
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [closeTime, setCloseTime] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      getReservationTimeConfig("dine-in")
        .then((config) => {
          setTimeSlots(config.slots);
          setCloseTime(config.endTime);
        })
        .catch(() => setTimeSlots([]));
    }, []),
  );

  // 이 화면은 날짜를 따로 고르지 않고 "오늘 기준"으로 보여주기 때문에,
  // 오늘 이미 찬 자리를 확인해서 예약 화면이랑 똑같이 회색 처리해요.
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const [takenSlots, setTakenSlots] = useState<TakenSlot[]>([]);
  useFocusEffect(
    useCallback(() => {
      getReservationAvailability(todayStr)
        .then(setTakenSlots)
        .catch(() => setTakenSlots([]));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const group = groupRoomsByCategory(rooms).find(
    (g) => g.category === (category as RoomCategory),
  );

  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(
    group?.rooms[0]?.id,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.notFound}>
        <ActivityIndicator color={Palette.amberDeep} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>좌석 정보를 찾을 수 없습니다.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.notFoundLink}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedRoom =
    group.rooms.find((r) => r.id === selectedRoomId) ?? group.rooms[0];

  // 오늘 이미 지난 시간인지 확인해요 — 예약 화면과 같은 기준이에요.
  const isTimePast = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const slotMinutes = h * 60 + m;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes <= nowMinutes;
  };

  // 지금 고른 방/좌석 기준으로, 오늘 이미 다른 손님(또는 관리자가 등록한
  // 예약)에게 찬 시간인지 확인해요.
  const isTimeTaken = (time: string) =>
    takenSlots.some(
      (slot) => slot.roomId === selectedRoom.id && slot.time === time,
    );

  const handleReserve = () => {
    if (!selectedTime) {
      Alert.alert("알림", "먼저 원하시는 시간을 선택해 주세요.");
      return;
    }
    if (isTimePast(selectedTime)) {
      Alert.alert("알림", "이미 지난 시간이에요. 다른 시간을 선택해 주세요.");
      setSelectedTime(null);
      return;
    }
    if (isTimeTaken(selectedTime)) {
      Alert.alert(
        "알림",
        "죄송합니다, 그 시간은 이미 다른 손님에게 예약되었어요. 다른 시간을 선택해 주세요.",
      );
      setSelectedTime(null);
      return;
    }
    router.push({
      pathname: "/reservation" as any,
      params: {
        presetRoomId: selectedRoom.id,
        presetTime: selectedTime,
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero photo */}
        <View style={styles.imageContainer}>
          {selectedRoom.image ? (
            <Image
              source={selectedRoom.image}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="image-outline"
                size={32}
                color={Palette.inkFaint}
              />
              <Text style={styles.imagePlaceholderText}>사진 준비중입니다</Text>
            </View>
          )}

          <SafeAreaView style={styles.headerOverlay} edges={["top"]}>
            <TouchableOpacity
              style={styles.roundBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={20} color={Palette.ink} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.eyebrow}>
            {group.isRoom ? "PRIVATE ROOM" : "HALL SEATING"}
          </Text>
          <Text style={styles.title}>{group.categoryLabel}</Text>

          <View style={styles.specRow}>
            <Ionicons name="people-outline" size={15} color={Palette.inkSoft} />
            <Text style={styles.specText}>
              권장 인원 {selectedRoom.capacity}
            </Text>
          </View>
          <View style={styles.specRow}>
            <Ionicons
              name="location-outline"
              size={15}
              color={Palette.inkSoft}
            />
            <Text style={styles.specText}>
              {group.isRoom ? "독립된 프라이빗 룸" : "넓고 탁 트인 홀 좌석"}
            </Text>
          </View>

          {group.note && (
            <View style={styles.noteBox}>
              <Ionicons
                name="information-circle"
                size={16}
                color={Palette.gold}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.noteText}>{group.note}</Text>
            </View>
          )}

          {/* 룸 번호가 여러 개면 선택해서 사진을 바꿔볼 수 있어요 */}
          {group.rooms.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>번호 선택</Text>
              <View style={styles.chipRow}>
                {group.rooms.map((room) => {
                  const active = room.id === selectedRoom.id;
                  return (
                    <TouchableOpacity
                      key={room.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => {
                        setSelectedRoomId(room.id);
                        setSelectedTime(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {room.number}번
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>오늘 예약 가능 시간</Text>
            <Text style={styles.sectionSubText}>
              1회 이용은 1시간이며, 매장 마감은 {closeTime ?? "..."}입니다.
            </Text>
            <View style={styles.chipRow}>
              {timeSlots.map((time) => {
                const active = time === selectedTime;
                const past = isTimePast(time);
                const taken = !past && isTimeTaken(time);
                const disabled = past || taken;
                return (
                  <TouchableOpacity
                    key={time}
                    disabled={disabled}
                    style={[
                      styles.timeChip,
                      active && styles.chipActive,
                      disabled && styles.timeChipDisabled,
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                        disabled && styles.chipTextDisabled,
                      ]}
                    >
                      {time}
                    </Text>
                    {disabled && (
                      <Text style={styles.timeChipDisabledLabel}>
                        {past ? "지난 시간" : "예약마감"}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      <View style={styles.fixedFooter}>
        <TouchableOpacity style={styles.reserveBtn} onPress={handleReserve}>
          <Ionicons name="calendar" size={16} color={Palette.white} />
          <Text style={styles.reserveBtnText}>
            {selectedRoom.categoryLabel} {selectedRoom.number}번으로 예약하기
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerHint}>
          선택하신 좌석/시간은 사장님 확인 후 최종 확정됩니다.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { paddingBottom: 20 },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Palette.cream,
  },
  notFoundText: { fontSize: 14, color: Palette.inkFaint },
  notFoundLink: {
    fontSize: 14,
    color: Palette.amberDeep,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  imageContainer: {
    width: "100%",
    height: 280,
    backgroundColor: Palette.creamDim,
  },
  mainImage: { width: "100%", height: "100%" },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePlaceholderText: { fontSize: 13, color: Palette.inkFaint },
  galleryCaptionWrap: {
    position: "absolute",
    left: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  galleryCaptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.white,
  },
  dotsRow: {
    position: "absolute",
    bottom: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    backgroundColor: Palette.white,
    width: 16,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.white,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.card,
  },

  contentContainer: { padding: Spacing.lg },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.md,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 6,
  },
  specText: { fontSize: 13, color: Palette.inkSoft },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(182,138,78,0.12)",
    padding: Spacing.sm + 4,
    borderRadius: Radius.sm,
    marginTop: Spacing.md,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: Palette.amberDeep,
    fontWeight: "600",
    lineHeight: 17,
  },

  section: { marginTop: Spacing.xl },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: 6,
  },
  sectionSubText: {
    fontSize: 12,
    color: Palette.inkFaint,
    marginBottom: Spacing.sm + 4,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
    backgroundColor: Palette.creamDim,
  },
  timeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm,
    backgroundColor: Palette.creamDim,
    minWidth: 64,
    alignItems: "center",
  },
  timeChipDisabled: {
    backgroundColor: Palette.line,
    opacity: 0.6,
  },
  timeChipDisabledLabel: {
    fontSize: 9,
    color: Palette.inkFaint,
    marginTop: 2,
  },
  chipActive: {
    backgroundColor: Palette.amberSoft,
    borderWidth: 1,
    borderColor: Palette.amber,
  },
  chipText: { fontSize: 13, color: Palette.ink, fontWeight: "600" },
  chipTextDisabled: {
    color: Palette.inkFaint,
    textDecorationLine: "line-through",
  },
  chipTextActive: { color: Palette.amberDeep, fontWeight: "700" },

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
  reserveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Palette.amberDeep,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  reserveBtnText: { color: Palette.white, fontSize: 15, fontWeight: "700" },
  footerHint: {
    fontSize: 11,
    color: Palette.inkFaint,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
