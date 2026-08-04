// components/FAQ/FAQ.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import { FaqItem, getFaqItems } from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FaqCategoryGroup = {
  category: string;
  icon: string;
  items: FaqItem[];
};

export default function FAQ() {
  const [openId, setOpenId] = useState<number | null>(null);
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getFaqItems()
        .then(setItems)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []),
  );

  const toggleItem = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  };

  // 카테고리가 같은 항목들끼리 묶어서, 등록된 순서 그대로 보여줘요.
  const groups: FaqCategoryGroup[] = [];
  for (const item of items) {
    let group = groups.find((g) => g.category === item.category);
    if (!group) {
      group = { category: item.category, icon: item.categoryIcon, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <ActivityIndicator
            color={Palette.amberDeep}
            style={{ marginTop: Spacing.xl }}
          />
        ) : groups.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="help-circle-outline"
              size={28}
              color={Palette.inkFaint}
            />
            <Text style={styles.emptyText}>등록된 질문이 없습니다.</Text>
          </View>
        ) : (
          <>
            {groups.map((category) => (
              <View key={category.category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Ionicons
                    name={category.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={Palette.amberDeep}
                  />
                  <Text style={styles.categoryTitle}>{category.category}</Text>
                </View>

                <View style={styles.itemList}>
                  {category.items.map((item, idx) => {
                    const isOpen = openId === item.id;
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.itemWrap,
                          idx !== category.items.length - 1 &&
                            styles.itemBorder,
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.questionRow}
                          onPress={() => toggleItem(item.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.questionMark}>Q</Text>
                          <Text style={styles.questionText}>
                            {item.question}
                          </Text>
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
          </>
        )}

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
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    marginTop: Spacing.xl,
  },
  emptyText: { fontSize: 13, color: Palette.inkFaint },

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
