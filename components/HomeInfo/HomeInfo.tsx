// components/HomeInfo/HomeInfo.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const RESTAURANT_PHONE = "0507-1410-7634";
const RESTAURANT_ADDRESS = "대구 동구 팔공산로199길 12";

const HOURS_DATA = [
  { day: "목", time: "11:00 - 21:00", last: "19:30 라스트오더", isToday: true },
  { day: "금", time: "11:00 - 21:00", last: "19:30 라스트오더" },
  { day: "토", time: "11:00 - 21:00", last: "19:30 라스트오더" },
  { day: "일", time: "11:00 - 21:00", last: "19:30 라스트오더" },
  { day: "월", time: "11:00 - 21:00", last: "19:30 라스트오더" },
  { day: "화", time: "11:00 - 21:00", last: "19:30 라스트오더" },
  { day: "수", time: "11:00 - 21:00", last: "19:30 라스트오더" },
];

export default function HomeInfo() {
  const getStatus = () => {
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= 11 && currentHour < 21) {
      return {
        text: "영업 중",
        color: Palette.success,
        bg: "rgba(91,123,90,0.12)",
      };
    }
    return {
      text: "영업 종료",
      color: Palette.error,
      bg: "rgba(162,62,62,0.1)",
    };
  };

  const status = getStatus();

  const makeCall = () => {
    Linking.openURL(`tel:${RESTAURANT_PHONE}`).catch(() => {
      Alert.alert("에러", "전화 걸기 기능을 실행할 수 없습니다.");
    });
  };

  const copyAddress = async () => {
    await Clipboard.setStringAsync(RESTAURANT_ADDRESS);
    Alert.alert("알림", "주소가 클립보드에 복사되었습니다.");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Business Hours */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="time-outline"
                size={18}
                color={Palette.amberDeep}
              />
              <Text style={styles.sectionTitle}>영업시간</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.text}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            {HOURS_DATA.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.hourRow,
                  index === HOURS_DATA.length - 1 && { borderBottomWidth: 0 },
                  item.isToday && styles.todayRow,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    item.isToday && { color: Palette.amberDeep },
                  ]}
                >
                  {item.day}
                </Text>
                <View style={styles.timeInfo}>
                  <Text
                    style={[
                      styles.timeText,
                      item.isToday && { fontWeight: "700" },
                    ]}
                  >
                    {item.time}
                  </Text>
                  <Text style={styles.lastOrderText}>{item.last}</Text>
                </View>
                {item.isToday && (
                  <View style={styles.todayIndicator}>
                    <Text style={styles.todayBadgeText}>오늘</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Directions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="map-outline" size={18} color={Palette.amberDeep} />
            <Text style={styles.sectionTitle}>찾아오는 길</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.directionItem}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>자차 / 네비</Text>
              </View>
              <Text style={styles.directionText}>
                '성공식당' 검색 또는 '대구 동구 팔공산로 199길 12 (39-9)'
                검색하시고 오시면 됩니다.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.directionItem}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>버스</Text>
              </View>
              <Text style={styles.directionText}>
                '급행 1번' 버스를 타고 '동화사 입구' 정류장에서 하차 후, 공원을
                가로질러 분수대 방향으로 약 50m 정도 내려오시면 있습니다.
              </Text>
            </View>
          </View>
        </View>

        {/* Reviews summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="star" size={18} color={Palette.gold} />
            <Text style={styles.sectionTitle}>리뷰 및 별점</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.ratingSummary}>
              <Text style={styles.totalRating}>4.73</Text>
              <View style={{ marginLeft: Spacing.md }}>
                <View style={{ flexDirection: "row", gap: 1 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name="star"
                      size={14}
                      color={Palette.gold}
                    />
                  ))}
                </View>
                <Text style={styles.ratingCount}>
                  방문자 리뷰 2,474 · 블로그 리뷰 1,046
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <Text style={styles.reviewQuote}>
              "맑고 깊은 국물 맛이 일품이에요, 부모님 모시고 오기 좋습니다!"
            </Text>
            <Text style={styles.reviewQuote}>
              "능이 향이 은은해서 건강해지는 기분이에요. 재방문 의사 200%!"
            </Text>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.contactRow} onPress={copyAddress}>
            <View style={styles.contactIcon}>
              <Ionicons name="location" size={18} color={Palette.amberDeep} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm + 4 }}>
              <Text style={styles.contactLabel}>주소</Text>
              <Text style={styles.contactValue}>{RESTAURANT_ADDRESS}</Text>
            </View>
            <Text style={styles.actionBadge}>복사</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactRow, { marginTop: Spacing.sm + 4 }]}
            onPress={makeCall}
          >
            <View style={styles.contactIcon}>
              <Ionicons name="call" size={18} color={Palette.amberDeep} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm + 4 }}>
              <Text style={styles.contactLabel}>안내 및 예약</Text>
              <Text style={styles.contactValue}>{RESTAURANT_PHONE}</Text>
            </View>
            <Text style={styles.actionBadge}>전화</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.card,
  },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.ink,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm + 4,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm + 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.ink,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  hourRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  todayRow: {
    backgroundColor: "rgba(201,98,46,0.04)",
  },
  todayIndicator: {
    backgroundColor: Palette.amber,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 10,
    color: Palette.white,
    fontWeight: "700",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
    width: 30,
  },
  timeInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  timeText: {
    fontSize: 14,
    color: Palette.ink,
    fontWeight: "500",
  },
  lastOrderText: {
    fontSize: 12,
    color: Palette.amberDeep,
    marginTop: 2,
  },
  directionItem: {
    paddingVertical: 5,
  },
  tag: {
    backgroundColor: Palette.creamDim,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.inkSoft,
  },
  directionText: {
    fontSize: 13,
    lineHeight: 21,
    color: Palette.inkSoft,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.line,
    marginVertical: Spacing.md,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.white,
    padding: Spacing.md,
    borderRadius: Radius.md,
    ...Shadow.card,
  },
  contactIcon: {
    width: 38,
    height: 38,
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  contactLabel: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  actionBadge: {
    backgroundColor: Palette.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    fontSize: 12,
    fontWeight: "700",
    color: Palette.amberDeep,
    borderWidth: 1,
    borderColor: Palette.amber,
    overflow: "hidden",
  },
  ratingSummary: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalRating: {
    fontSize: 30,
    fontWeight: "700",
    color: Palette.ink,
  },
  ratingCount: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginTop: 4,
  },
  reviewQuote: {
    fontSize: 13,
    color: Palette.ink,
    lineHeight: 20,
    fontStyle: "italic",
    marginBottom: 10,
    paddingLeft: Spacing.sm + 2,
    borderLeftWidth: 2,
    borderLeftColor: Palette.gold,
  },
});
