// components/Drinks/Drinks.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MenuContext } from "@/components/contexts/MenuContext";
import { MenuItem, resolveImageSource } from "@/constants/menu-data";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

export default function Drinks() {
  const [activeTab, setActiveTab] = useState<"음료" | "주류">("음료");
  const { menuData, loading, refreshMenu } = useContext(MenuContext);

  // 이 화면에 들어올 때마다 새로 불러와요 — 관리자가 방금 음료/주류를
  // 추가하거나 수정했어도 앱을 껐다 켜지 않고 바로 반영돼요.
  useFocusEffect(
    useCallback(() => {
      refreshMenu();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const DrinkRow = ({ item }: { item: MenuItem }) => (
    <View style={styles.drinkItem}>
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image
            source={resolveImageSource(item.image)}
            style={styles.drinkImage}
          />
        ) : (
          <View style={styles.placeholderIcon}>
            <Ionicons
              name={activeTab === "음료" ? "wine-outline" : "beer-outline"}
              size={22}
              color={Palette.amberDeep}
            />
          </View>
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.drinkName}>{item.name}</Text>
        <Text style={styles.drinkPrice}>{item.price}</Text>
      </View>
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={20} color={Palette.white} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(["음료", "주류"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Palette.amberDeep} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {(menuData[activeTab] ?? []).length === 0 ? (
            <Text style={styles.emptyText}>
              아직 등록된 {activeTab}가 없습니다.
            </Text>
          ) : (
            (menuData[activeTab] ?? []).map((item) => (
              <DrinkRow key={item.id} item={item} />
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: {
    textAlign: "center",
    fontSize: 13,
    color: Palette.inkFaint,
    marginTop: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
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
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tab: {
    paddingVertical: Spacing.sm + 2,
    marginRight: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Palette.amber,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: Palette.inkFaint,
  },
  activeTabText: {
    color: Palette.amberDeep,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  drinkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.sm + 4,
    marginBottom: Spacing.sm + 2,
    ...Shadow.card,
  },
  imageContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.amberSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  drinkImage: {
    width: "100%",
    height: "100%",
  },
  placeholderIcon: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
  },
  drinkName: {
    fontSize: 14,
    fontWeight: "600",
    color: Palette.ink,
  },
  drinkPrice: {
    fontSize: 13,
    color: Palette.amberDeep,
    fontWeight: "700",
    marginTop: 3,
  },
  addButton: {
    width: 32,
    height: 32,
    backgroundColor: Palette.amber,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
});
