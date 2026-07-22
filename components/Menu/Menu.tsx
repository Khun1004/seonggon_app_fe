// components/Menu/Menu.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
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

import { CartContext } from "@/components/contexts/CartContext";
import { MenuContext } from "@/components/contexts/MenuContext";
import { MenuItem, resolveImageSource } from "@/constants/menu-data";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const TABS = ["백숙", "고기", "사이드", "추가 메뉴"];

export default function Menu() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("백숙");
  const { addToCart } = useContext(CartContext);
  const { menuData, extraMenu, loading, refreshMenu } = useContext(MenuContext);

  useFocusEffect(
    useCallback(() => {
      refreshMenu();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const handleQuickAdd = (item: MenuItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      options: [],
    });
    Alert.alert("장바구니", `${item.name}이(가) 장바구니에 담겼습니다!`);
  };

  const goToDetail = (item: MenuItem) => {
    router.push({ pathname: "/menu-detail", params: { id: item.id } } as any);
  };

  const isExtraTab = activeTab === "추가 메뉴";
  const items = !isExtraTab ? (menuData[activeTab] ?? []) : [];
  const featured = items.filter((item) => item.isHot);
  const standard = items.filter((item) => !item.isHot);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingBox]}>
        <ActivityIndicator color={Palette.amberDeep} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category tabs — 원래 보더바텀 스타일 */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
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
        {isExtraTab ? (
          // ───── 추가 메뉴 탭: 담기 기능 없이 가격 안내만 ─────
          <View>
            <View style={styles.extraNoticeBox}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={Palette.amberDeep}
              />
              <Text style={styles.extraNoticeText}>
                추가 메뉴는 장바구니에 담을 수 없으며, 매장 방문 시 직원에게
                직접 요청해 주세요.
              </Text>
            </View>

            <View style={styles.extraList}>
              {extraMenu.map((extra, idx) => (
                <View
                  key={extra.id}
                  style={[
                    styles.extraRow,
                    idx === extraMenu.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.extraName}>{extra.name}</Text>
                    {extra.note && (
                      <Text style={styles.extraNote}>{extra.note}</Text>
                    )}
                  </View>
                  <Text style={styles.extraPrice}>{extra.price}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          // ───── 일반 메뉴 탭 ─────
          <>
            {featured.map((item) => (
              <TouchableOpacity
                key={`featured-${item.id}`}
                style={styles.featuredCard}
                activeOpacity={0.9}
                onPress={() => goToDetail(item)}
              >
                <Image
                  source={resolveImageSource(item.image)}
                  style={styles.featuredImage}
                />
                <View style={styles.featuredOverlay}>
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>대표 메뉴</Text>
                  </View>
                  <Text style={styles.featuredName}>{item.name}</Text>
                  <Text style={styles.featuredPrice}>{item.price}</Text>
                  <Text style={styles.featuredDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>{activeTab} 메뉴</Text>

            {[...standard, ...featured].map((item, idx) => (
              <TouchableOpacity
                key={`${item.id}-${idx}`}
                style={styles.standardCard}
                activeOpacity={0.7}
                onPress={() => goToDetail(item)}
              >
                <Image
                  source={resolveImageSource(item.image)}
                  style={styles.standardImage}
                />
                <View style={styles.standardInfo}>
                  <Text style={styles.standardName}>{item.name}</Text>
                  <Text style={styles.standardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={styles.standardPrice}>{item.price}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleQuickAdd(item)}
                >
                  <Ionicons name="add" size={18} color={Palette.white} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  loadingBox: { justifyContent: "center", alignItems: "center" },
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
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  tab: {
    paddingVertical: Spacing.sm + 4,
    marginRight: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Palette.amber,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Palette.inkFaint,
  },
  activeTabText: {
    color: Palette.amberDeep,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  featuredCard: {
    width: "100%",
    height: 200,
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    ...Shadow.tabBar,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: "rgba(26,22,20,0.55)",
  },
  featuredBadge: {
    backgroundColor: Palette.amber,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  featuredBadgeText: {
    color: Palette.white,
    fontSize: 11,
    fontWeight: "700",
  },
  featuredName: {
    fontSize: 20,
    fontWeight: "700",
    color: Palette.white,
  },
  featuredPrice: {
    fontSize: 16,
    color: Palette.goldLight,
    fontWeight: "700",
    marginTop: 4,
  },
  featuredDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 6,
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.ink,
    marginVertical: Spacing.md,
  },
  standardCard: {
    flexDirection: "row",
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    padding: Spacing.sm + 4,
    marginBottom: Spacing.md,
    alignItems: "center",
    ...Shadow.card,
  },
  standardImage: {
    width: 72,
    height: 72,
    borderRadius: Radius.sm,
  },
  standardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  standardName: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
  },
  standardDesc: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginTop: 3,
    lineHeight: 15,
  },
  standardPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.amberDeep,
    marginTop: 5,
  },
  addBtn: {
    width: 30,
    height: 30,
    backgroundColor: Palette.amber,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },

  // 추가 메뉴 탭
  extraNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Palette.amberSoft,
    padding: Spacing.sm + 4,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  extraNoticeText: {
    flex: 1,
    fontSize: 12,
    color: Palette.amberDeep,
    fontWeight: "600",
    lineHeight: 17,
  },
  extraList: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  extraRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  extraName: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  extraNote: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginTop: 2,
  },
  extraPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
});
