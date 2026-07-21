// components/Home/BeforeYouVisit.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

type InfoItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

// 처음 방문하시는 손님이 헷갈리지 않도록, 예약/이용 관련 정책을 한 곳에
// 모아서 홈 화면에서 바로 보여드립니다. 문구를 바꾸고 싶으면 이 배열만
// 수정하면 돼요 (다른 화면 코드는 손댈 필요 없어요).
const VISIT_INFO_ITEMS: InfoItem[] = [
  {
    icon: "time-outline",
    title: "영업시간",
    body: "매일 11:00 ~ 21:00",
  },
  {
    icon: "hourglass-outline",
    title: "테이블 이용 시간",
    body: "1회 예약은 1시간 이용이 기본이에요. 더 길게 이용하고 싶으시면 전화로 미리 문의해 주세요. 이용 시간을 초과하시면 추가 요금이 발생할 수 있어요.",
  },
  {
    icon: "restaurant-outline",
    title: "조리 시간 안내",
    body: "백숙류 메뉴는 정성껏 끓여내다 보니 조리에 40~60분 정도 걸려요. 예약하고 오시면 도착 시간에 맞춰 미리 준비해드려요.",
  },
  {
    icon: "calendar-outline",
    title: "주말·공휴일 예약",
    body: "주말과 공휴일은 온라인 예약이 어려워요. 전화로 문의해 주시면 자리를 확인해드릴게요.",
  },
  {
    icon: "car-outline",
    title: "주차",
    body: "매장 앞에 약 30대까지 무료로 주차하실 수 있어요. 만차 시 인근 길가에 주차 가능해요.",
  },
  {
    icon: "paw-outline",
    title: "반려동물 동반",
    body: "신발을 벗고 들어가는 룸 좌석에서만 반려동물과 함께하실 수 있어요.",
  },
  {
    icon: "people-outline",
    title: "단체 예약",
    body: "10인 이상 단체 예약은 앱이 아니라 전화로 문의해 주세요.",
  },
];

export default function BeforeYouVisit() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>BEFORE YOU VISIT</Text>
      <Text style={styles.sectionTitle}>방문 전 알아두세요</Text>
      <Text style={styles.intro}>
        처음 오시는 분들이 자주 물어보시는 내용을 미리 모아봤어요.
      </Text>

      <View style={styles.list}>
        {VISIT_INFO_ITEMS.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={18} color={Palette.amberDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionEyebrow: {
    color: Palette.gold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: Palette.ink,
    marginBottom: 4,
  },
  intro: {
    fontSize: 13,
    color: Palette.inkFaint,
    marginBottom: Spacing.md,
    lineHeight: 19,
  },
  list: {
    gap: Spacing.sm + 4,
  },
  card: {
    flexDirection: "row",
    gap: Spacing.sm + 4,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Palette.amberSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: 3,
  },
  cardBody: {
    fontSize: 12.5,
    color: Palette.inkSoft,
    lineHeight: 18,
  },
});
