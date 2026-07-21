// components/Search/Search.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CartContext } from "@/components/contexts/CartContext";
import { findMenuItemById, MENU_DATA } from "@/constants/menu-data";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

type SearchItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  tag?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  image?: any; // require()된 로컬 이미지 (number) 또는 URL (string)
};

// 메뉴 데이터 + 음료/주류 데이터를 합쳐서 검색 가능한 전체 목록 구성
const MENU_SEARCH_ITEMS: SearchItem[] = Object.entries(MENU_DATA).flatMap(
  ([category, items]) =>
    items.map((item) => ({
      id: item.id,
      name: item.name,
      category,
      price: item.price,
      tag: item.isHot ? "대표" : undefined,
      image: item.image,
    })),
);

const DRINK_SEARCH_ITEMS: SearchItem[] = [
  {
    id: "d1",
    name: "Tams (탐스)",
    category: "음료",
    price: "2,000원",
    icon: "wine-outline",
  },
  {
    id: "d2",
    name: "Pepsi Cola",
    category: "음료",
    price: "2,000원",
    icon: "wine-outline",
  },
  {
    id: "a1",
    name: "참이슬 (Chamisul)",
    category: "주류",
    price: "5,000원",
    icon: "beer-outline",
  },
  {
    id: "a4",
    name: "Cass (카스)",
    category: "주류",
    price: "5,000원",
    icon: "beer-outline",
  },
  {
    id: "a7",
    name: "동동주 (Dongdongju)",
    category: "주류",
    price: "5,000원",
    image: require("../../assets/images/찹쌀동동주.jpeg"),
  },
  {
    id: "a8",
    name: "막걸리 (Makgeolli)",
    category: "주류",
    price: "5,000원",
    icon: "beer-outline",
  },
];

const ALL_ITEMS: SearchItem[] = [...MENU_SEARCH_ITEMS, ...DRINK_SEARCH_ITEMS];

const POPULAR_KEYWORDS = [
  "능이",
  "오리",
  "백숙",
  "불고기",
  "해물",
  "동동주",
  "막걸리",
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  백숙: { bg: Palette.amberSoft, text: Palette.amberDeep },
  고기: { bg: "rgba(162,62,62,0.1)", text: Palette.error },
  사이드: { bg: "rgba(91,123,90,0.12)", text: Palette.success },
  음료: { bg: Palette.creamDim, text: Palette.inkSoft },
  주류: { bg: "rgba(182,138,78,0.15)", text: Palette.gold },
};

// 로컬 require(number) 인지, 외부 URL(string)인지 구분해서 적절한 source 형태로 변환
function resolveImageSource(image: any) {
  if (!image) return null;
  if (typeof image === "string") return { uri: image };
  return image; // require()는 그대로 number
}

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const { addToCart } = React.useContext(CartContext);
  const inputRef = useRef<TextInput>(null);

  const results =
    query.trim().length === 0
      ? []
      : ALL_ITEMS.filter(
          (item) =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase()),
        );

  const handleAddToCart = (item: SearchItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image ?? "",
      quantity: 1,
      options: [],
    });
    setAdded((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [item.id]: false })), 1500);
  };

  const renderItem = (item: SearchItem) => {
    const catStyle = CATEGORY_COLORS[item.category] ?? {
      bg: Palette.creamDim,
      text: Palette.inkSoft,
    };
    const isAdded = added[item.id];
    const imageSource = resolveImageSource(item.image);
    const isRealMenuItem = !!findMenuItemById(item.id);

    const Thumb = (
      <View style={styles.thumbBox}>
        {imageSource ? (
          <Image source={imageSource} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons
              name={item.icon ?? "restaurant-outline"}
              size={24}
              color={Palette.amberDeep}
            />
          </View>
        )}
      </View>
    );

    return (
      <View key={item.id} style={styles.resultCard}>
        {isRealMenuItem ? (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/menu-detail",
                params: { id: item.id },
              } as any)
            }
          >
            {Thumb}
          </TouchableOpacity>
        ) : (
          Thumb
        )}

        <View style={styles.resultInfo}>
          <View style={styles.badgeRow}>
            <View
              style={[styles.categoryBadge, { backgroundColor: catStyle.bg }]}
            >
              <Text style={[styles.categoryText, { color: catStyle.text }]}>
                {item.category}
              </Text>
            </View>
            {item.tag && <Text style={styles.tagText}>{item.tag}</Text>}
          </View>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.resultPrice}>{item.price}</Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, isAdded && styles.addBtnAdded]}
          onPress={() => handleAddToCart(item)}
        >
          <Ionicons
            name={isAdded ? "checkmark" : "add"}
            size={18}
            color={Palette.white}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Palette.ink} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={16}
            color={Palette.inkFaint}
            style={{ marginRight: 8 }}
          />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="메뉴, 음료 검색..."
            placeholderTextColor={Palette.inkFaint}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons
                name="close-circle"
                size={16}
                color={Palette.inkFaint}
              />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {query.trim().length === 0 ? (
          <View>
            <Text style={styles.sectionLabel}>인기 검색어</Text>
            <View style={styles.keywordRow}>
              {POPULAR_KEYWORDS.map((kw) => (
                <TouchableOpacity
                  key={kw}
                  style={styles.keyword}
                  onPress={() => setQuery(kw)}
                >
                  <Text style={styles.keywordText}>{kw}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>전체 메뉴 보기</Text>
            <View style={styles.allCategoryRow}>
              {Object.keys(CATEGORY_COLORS).map((cat) => {
                const cs = CATEGORY_COLORS[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, { backgroundColor: cs.bg }]}
                    onPress={() => setQuery(cat)}
                  >
                    <Text style={[styles.catChipText, { color: cs.text }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={52} color={Palette.line} />
            <Text style={styles.emptyText}>
              "{query}"에 대한 결과가 없습니다.
            </Text>
            <Text style={styles.emptySubText}>
              다른 검색어로 시도해 보세요.
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionLabel}>
              {results.length}개의 검색 결과
            </Text>
            {results.map(renderItem)}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm + 4,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm + 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginLeft: 4,
    ...Shadow.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Palette.ink,
    padding: 0,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkFaint,
    marginBottom: Spacing.sm + 4,
    marginTop: Spacing.sm,
    letterSpacing: 0.8,
  },
  keywordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm + 2,
    marginBottom: Spacing.xl,
  },
  keyword: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Palette.white,
    borderRadius: Radius.pill,
    ...Shadow.card,
  },
  keywordText: {
    fontSize: 13,
    color: Palette.ink,
    fontWeight: "600",
  },
  allCategoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm + 2,
  },
  catChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  emptyBox: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
    marginTop: Spacing.lg,
  },
  emptySubText: {
    fontSize: 13,
    color: Palette.inkFaint,
    marginTop: Spacing.sm,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 4,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  thumbBox: {
    marginRight: Spacing.md,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
  },
  thumbPlaceholder: {
    backgroundColor: Palette.amberSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  resultInfo: { flex: 1 },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700",
  },
  tagText: {
    fontSize: 10,
    color: Palette.amberDeep,
    fontWeight: "700",
  },
  resultName: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
  },
  resultPrice: {
    fontSize: 13,
    color: Palette.amberDeep,
    fontWeight: "700",
    marginTop: 4,
  },
  addBtn: {
    width: 34,
    height: 34,
    backgroundColor: Palette.amber,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnAdded: {
    backgroundColor: Palette.success,
  },
});
