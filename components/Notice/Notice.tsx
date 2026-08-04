// components/Notice/Notice.tsx
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

import { getNotices, Notice as NoticeItem } from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Notice() {
  const [openId, setOpenId] = useState<number | null>(null);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getNotices()
        .then(setNotices)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []),
  );

  const toggleItem = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  };

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
        ) : notices.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="megaphone-outline"
              size={28}
              color={Palette.inkFaint}
            />
            <Text style={styles.emptyText}>등록된 공지사항이 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notices.map((notice, idx) => {
              const isOpen = openId === notice.id;
              return (
                <View
                  key={notice.id}
                  style={[
                    styles.itemWrap,
                    idx !== notices.length - 1 && styles.itemBorder,
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
