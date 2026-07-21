// components/FAQ/FAQ.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type FaqCategory = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: FaqItem[];
};

const FAQ_DATA: FaqCategory[] = [
  {
    title: "예약",
    icon: "calendar-outline",
    items: [
      {
        id: "res-1",
        question: "예약은 어떻게 하나요?",
        answer:
          "앱의 '예약하기' 화면에서 평일 날짜를 선택해 온라인으로 예약하실 수 있습니다. 주말과 공휴일은 온라인 예약이 불가하니 전화로 문의해 주세요.",
      },
      {
        id: "res-2",
        question: "예약을 취소하거나 수정하고 싶어요.",
        answer:
          "예약 후 30분 이내에는 '예약내역' 탭에서 직접 수정 또는 취소가 가능합니다. 30분이 지난 경우에는 전화로 문의해 주세요.",
      },
    ],
  },
  {
    title: "영업시간",
    icon: "time-outline",
    items: [
      {
        id: "hour-1",
        question: "오늘 영업하나요?",
        answer:
          "매장은 11:00부터 21:00까지 운영하며, 라스트오더는 19:30입니다. '정보' 탭에서 실시간 영업 상태를 확인하실 수 있습니다.",
      },
      {
        id: "hour-2",
        question: "정기 휴무일이 있나요?",
        answer:
          "별도 안내가 없는 한 연중 무휴로 운영합니다. 명절 등 휴무 일정은 공지사항을 확인해 주세요.",
      },
    ],
  },
  {
    title: "주차",
    icon: "car-outline",
    items: [
      {
        id: "park-1",
        question: "주차 공간이 있나요?",
        answer:
          "매장 앞과 지하 주차장에 최대 20대까지 주차 가능합니다. 식사 고객은 2시간 무료 주차가 적용됩니다.",
      },
      {
        id: "park-2",
        question: "단체 손님인데 버스 주차가 가능한가요?",
        answer:
          "대형 차량이나 버스는 방문 전 미리 전화 주시면 가장 편한 자리로 안내해 드립니다.",
      },
    ],
  },
  {
    title: "결제",
    icon: "card-outline",
    items: [
      {
        id: "pay-1",
        question: "어떤 결제 방법을 쓸 수 있나요?",
        answer:
          "신용/체크카드, 지역화폐, 제로페이를 이용하실 수 있습니다. 현재 앱 내 카드 등록 기능은 준비 중입니다.",
      },
      {
        id: "pay-2",
        question: "현금 결제도 가능한가요?",
        answer:
          "네, 현금 결제도 가능합니다. 매장에서 영수증을 요청하시면 리뷰 작성 시 혜택을 받으실 수 있습니다.",
      },
    ],
  },
  {
    title: "단체석",
    icon: "people-outline",
    items: [
      {
        id: "group-1",
        question: "단체 모임도 가능한가요?",
        answer:
          "1층과 2층에 4~16명까지 이용 가능한 프라이빗 룸이 마련되어 있고, 30명 이상 대형 홀 전체 대관도 가능합니다.",
      },
      {
        id: "group-2",
        question: "10인 이상 단체는 어떻게 예약하나요?",
        answer:
          "10인 이상 단체 예약은 온라인 예약이 제한되어 있어, 정확한 인원 안내를 위해 전화로 문의해 주시기 바랍니다.",
      },
    ],
  },
];

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FAQ_DATA.map((category) => (
          <View key={category.title} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Ionicons
                name={category.icon}
                size={16}
                color={Palette.amberDeep}
              />
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </View>

            <View style={styles.itemList}>
              {category.items.map((item, idx) => {
                const isOpen = openId === item.id;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemWrap,
                      idx !== category.items.length - 1 && styles.itemBorder,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.questionRow}
                      onPress={() => toggleItem(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.questionMark}>Q</Text>
                      <Text style={styles.questionText}>{item.question}</Text>
                      <Ionicons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={Palette.inkFaint}
                      />
                    </TouchableOpacity>

                    {isOpen && (
                      <View style={styles.answerRow}>
                        <Text style={styles.answerMark}>A</Text>
                        <Text style={styles.answerText}>{item.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.contactBanner}>
          <Ionicons name="call-outline" size={16} color={Palette.cream} />
          <Text style={styles.contactBannerText}>
            원하는 답변을 찾지 못하셨다면 전화로 문의해 주세요.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: Palette.ink },
  scrollContent: { paddingHorizontal: Spacing.lg },

  categorySection: {
    marginBottom: Spacing.lg,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.sm + 4,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  itemList: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  itemWrap: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  questionMark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Palette.amberSoft,
    color: Palette.amberDeep,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },
  questionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Palette.ink,
  },
  answerRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm + 4,
    paddingLeft: 2,
  },
  answerMark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Palette.charcoal,
    color: Palette.cream,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },
  answerText: {
    flex: 1,
    fontSize: 12,
    color: Palette.inkSoft,
    lineHeight: 19,
  },

  contactBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Palette.charcoal,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  contactBannerText: {
    flex: 1,
    fontSize: 12,
    color: Palette.cream,
    fontWeight: "600",
  },
});
