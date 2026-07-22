// components/Home/BeforeYouVisit.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getStoreInfo, StoreInfoSection } from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

// 관리자 "정보 관리" 화면에서 "방문 전 알아두세요" 그룹으로 등록한 내용을
// 그대로 보여줍니다. 아이콘 이름이 없거나 잘못된 값이면 기본 아이콘으로 대체해요.
function resolveIcon(icon?: string): keyof typeof Ionicons.glyphMap {
  const fallback: keyof typeof Ionicons.glyphMap = "information-circle-outline";
  if (!icon) return fallback;
  return icon as keyof typeof Ionicons.glyphMap;
}

export default function BeforeYouVisit() {
  const [items, setItems] = useState<StoreInfoSection[]>([]);

  useFocusEffect(
    useCallback(() => {
      getStoreInfo()
        .then((all) =>
          setItems(
            all
              .filter((s) => s.group === "before_visit" && s.active)
              .sort((a, b) => a.displayOrder - b.displayOrder),
          ),
        )
        .catch(() => {});
    }, []),
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>BEFORE YOU VISIT</Text>
      <Text style={styles.sectionTitle}>방문 전 알아두세요</Text>
      <Text style={styles.intro}>
        처음 오시는 분들이 자주 물어보시는 내용을 미리 모아봤어요.
      </Text>

      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons
                name={resolveIcon(item.icon)}
                size={18}
                color={Palette.amberDeep}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.content}</Text>
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
