// components/Notice/Notice.tsx
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

type NoticeItem = {
  id: string;
  date: string;
  title: string;
  content: string;
};

const NOTICE_DATA: NoticeItem[] = [
  {
    id: "n1",
    date: "2026.06.20",
    title: "여름철 영업시간 안내",
    content:
      "무더운 여름철을 맞아 7월 한 달간 영업시간이 11:00~21:30으로 30분 연장됩니다. 라스트오더는 20:00까지이며, 자세한 사항은 매장으로 문의해 주세요.",
  },
  {
    id: "n2",
    date: "2026.06.10",
    title: "능이오리백숙 가격 안내",
    content:
      "원재료 가격 상승으로 능이오리백숙 가격이 65,000원에서 69,000원으로 조정되었습니다. 더 좋은 품질의 식재료로 보답하겠습니다. 양해해 주셔서 감사합니다.",
  },
  {
    id: "n3",
    date: "2026.05.28",
    title: "앱 리뷰 이벤트 진행 안내",
    content:
      "네이버 영수증 리뷰를 작성해 주시면 도토리묵, 음료, 모둠버섯 중 한 가지를 증정해 드립니다. 자세한 내용은 '리뷰' 탭의 쿠폰 안내를 확인해 주세요.",
  },
  {
    id: "n4",
    date: "2026.05.15",
    title: "어린이날 연휴 휴무 안내",
    content:
      "5월 5일(어린이날)과 5월 6일(대체공휴일)은 휴무 없이 정상 영업합니다. 다만 해당 기간 온라인 예약은 받지 않으니 전화로 문의해 주세요.",
  },
  {
    id: "n5",
    date: "2026.04.30",
    title: "주차장 공사 안내",
    content:
      "5월 1일부터 5월 3일까지 매장 앞 주차장 일부 보수 공사가 진행됩니다. 공사 기간 중에는 지하 주차장만 이용 가능하니 참고해 주세요.",
  },
];

export default function Notice() {
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
        <View style={styles.list}>
          {NOTICE_DATA.map((notice, idx) => {
            const isOpen = openId === notice.id;
            return (
              <View
                key={notice.id}
                style={[
                  styles.itemWrap,
                  idx !== NOTICE_DATA.length - 1 && styles.itemBorder,
                ]}
              >
                <TouchableOpacity
                  style={styles.titleRow}
                  onPress={() => toggleItem(notice.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.date}>{notice.date}</Text>
                    <Text style={styles.title}>{notice.title}</Text>
                  </View>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={Palette.inkFaint}
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.contentBox}>
                    <Text style={styles.contentText}>{notice.content}</Text>
                  </View>
                )}
              </View>
            );
          })}
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

  list: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  itemWrap: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  date: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginBottom: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  contentBox: {
    marginTop: Spacing.sm + 4,
    paddingTop: Spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  contentText: {
    fontSize: 13,
    color: Palette.inkSoft,
    lineHeight: 20,
  },
});
