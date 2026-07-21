// components/Drinks/Drinks.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

type DrinkItem = {
  id: string;
  name: string;
  price: string;
  icon?: keyof typeof Ionicons.glyphMap;
  image?: any; // require()된 로컬 이미지
};

const DRINKS_DATA: Record<string, DrinkItem[]> = {
  음료: [
    { id: "d1", name: "Tams (탐스)", price: "2,000원", icon: "wine-outline" },
    { id: "d2", name: "Pepsi Cola", price: "2,000원", icon: "wine-outline" },
    {
      id: "d3",
      name: "Pepsi Cola Zero",
      price: "2,000원",
      icon: "wine-outline",
    },
    {
      id: "d4",
      name: "Chilsung Cider",
      price: "2,000원",
      icon: "wine-outline",
    },
    {
      id: "d5",
      name: "Chilsung Cider Zero",
      price: "2,000원",
      icon: "wine-outline",
    },
  ],
  주류: [
    {
      id: "a1",
      name: "참이슬 (Chamisul)",
      price: "5,000원",
      icon: "beer-outline",
    },
    { id: "a2", name: "참 (Cham)", price: "5,000원", icon: "beer-outline" },
    { id: "a3", name: "제로 (Zero)", price: "5,000원", icon: "beer-outline" },
    { id: "a4", name: "Cass (카스)", price: "5,000원", icon: "beer-outline" },
    { id: "a5", name: "Cass Zero", price: "5,000원", icon: "beer-outline" },
    {
      id: "a6",
      name: "복분자 (Bokbunjaju)",
      price: "5,000원",
      icon: "wine-outline",
    },
    {
      id: "a7",
      name: "동동주 (Dongdongju)",
      price: "5,000원",
      image: require("../../assets/images/찹쌀동동주.jpeg"),
    },
    {
      id: "a8",
      name: "막걸리 (Makgeolli)",
      price: "5,000원",
      icon: "beer-outline",
    },
  ],
};

export default function Drinks() {
  const [activeTab, setActiveTab] = useState<"음료" | "주류">("음료");

  const DrinkRow = ({ item }: { item: DrinkItem }) => (
    <View style={styles.drinkItem}>
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image source={item.image} style={styles.drinkImage} />
        ) : (
          <View style={styles.placeholderIcon}>
            <Ionicons
              name={item.icon ?? "beaker-outline"}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DRINKS_DATA[activeTab].map((item) => (
          <DrinkRow key={item.id} item={item} />
        ))}
        <View style={{ height: 100 }} />
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
