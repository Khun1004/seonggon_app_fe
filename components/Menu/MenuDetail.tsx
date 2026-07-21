// components/Menu/MenuDetail.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CartContext } from "@/components/contexts/CartContext";
import {
  EXTRA_MENU,
  findMenuItemById,
  resolveImageSource,
} from "@/constants/menu-data";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const { width } = Dimensions.get("window");

export default function MenuDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = findMenuItemById(id);
  const { addToCart, cartItems } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [infoTab, setInfoTab] = useState<"info" | "ingredients">("info");

  if (!item) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>메뉴를 찾을 수 없습니다.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.notFoundLink}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `[성공식당] ${item.name} - ${item.price}\n지금 바로 확인해보세요!`,
      });
    } catch (error) {
      // no-op
    }
  };

  const totalItemPrice = item.priceVal * quantity;

  const handleAddToCart = () => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity,
      options: [],
    });
    router.push("/cart" as any);
  };

  const hasIngredients = item.mushrooms && item.mushrooms.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero image */}
        <View style={styles.imageContainer}>
          <Image
            source={resolveImageSource(item.image)}
            style={styles.mainImage}
            resizeMode="cover"
          />

          <SafeAreaView style={styles.headerOverlay} edges={["top"]}>
            <TouchableOpacity
              style={styles.roundBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={20} color={Palette.ink} />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={styles.roundBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={18} color={Palette.ink} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.roundBtn}
                onPress={() => router.push("/cart" as any)}
              >
                <Ionicons name="cart-outline" size={18} color={Palette.ink} />
                {cartItems.length > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>정성 가득한 보양식</Text>

          <Text style={styles.itemPrice}>{item.price}</Text>

          <View style={styles.reviewSection}>
            <View style={styles.ratingInfo}>
              <Ionicons name="star" size={16} color={Palette.gold} />
              <Text style={styles.ratingText}>4.8</Text>
              <Text style={styles.reviewCount}>(245+)</Text>
            </View>
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => router.push("/(tabs)/reviews" as any)}
            >
              <Text style={styles.reviewBtnText}>리뷰 보기</Text>
              <Ionicons
                name="chevron-forward"
                size={13}
                color={Palette.amberDeep}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* 정보 / 종류 탭 */}
          <View style={styles.infoTabRow}>
            <TouchableOpacity
              style={[
                styles.infoTab,
                infoTab === "info" && styles.infoTabActive,
              ]}
              onPress={() => setInfoTab("info")}
            >
              <Text
                style={[
                  styles.infoTabText,
                  infoTab === "info" && styles.infoTabTextActive,
                ]}
              >
                메뉴 정보
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.infoTab,
                infoTab === "ingredients" && styles.infoTabActive,
              ]}
              onPress={() => setInfoTab("ingredients")}
            >
              <Text
                style={[
                  styles.infoTabText,
                  infoTab === "ingredients" && styles.infoTabTextActive,
                ]}
              >
                종류
              </Text>
            </TouchableOpacity>
          </View>

          {/* 탭 내용: 메뉴 정보 */}
          {infoTab === "info" && (
            <View style={styles.tabContent}>
              <Text style={styles.descriptionText}>
                {item.description}
                {"\n\n"}성공식당만의 48시간 비법 육수로 깊은 맛을 우려냈습니다.
                신선한 재료와 정통 조법이 만나 완성된 최고의 보양식입니다.
              </Text>
            </View>
          )}

          {/* 탭 내용: 종류 (들어간 재료) */}
          {infoTab === "ingredients" && (
            <View style={styles.tabContent}>
              {hasIngredients ? (
                <View style={styles.ingredientList}>
                  {item.mushrooms!.map((mushroom) => (
                    <View key={mushroom.name} style={styles.ingredientRow}>
                      <Image
                        source={resolveImageSource(mushroom.image)}
                        style={styles.ingredientImage}
                      />
                      <Text style={styles.ingredientName}>{mushroom.name}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noIngredientText}>
                  등록된 재료 정보가 없습니다.
                </Text>
              )}
            </View>
          )}

          {/* 추가 메뉴 안내 — 앱에서 선택/주문은 안 되고, 매장에서만 요청 가능 */}
          <View style={[styles.section, { marginTop: Spacing.xl }]}>
            <Text style={styles.sectionTitle}>추가 메뉴</Text>

            <View style={styles.extraNoticeBox}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={Palette.amberDeep}
              />
              <Text style={styles.extraNoticeText}>
                추가 메뉴는 앱에서 선택할 수 없으며, 매장 방문 시 직원에게 직접
                요청해 주세요.
              </Text>
            </View>

            <View style={styles.extraList}>
              {EXTRA_MENU.map((extra, idx) => (
                <View
                  key={extra.id}
                  style={[
                    styles.extraRow,
                    idx === EXTRA_MENU.length - 1 && { borderBottomWidth: 0 },
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

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Floating footer */}
      <View style={styles.footer}>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.qtyBtnRow}
            onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
          >
            <Ionicons name="remove" size={16} color={Palette.ink} />
          </TouchableOpacity>
          <Text style={styles.qtyTextRow}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtnRow}
            onPress={() => setQuantity((prev) => prev + 1)}
          >
            <Ionicons name="add" size={16} color={Palette.ink} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cartBtn}
          activeOpacity={0.85}
          onPress={handleAddToCart}
        >
          <Text style={styles.cartBtnText}>장바구니 담기</Text>
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>
              {totalItemPrice.toLocaleString()}원
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  notFoundText: { fontSize: 14, color: Palette.inkSoft },
  notFoundLink: { fontSize: 14, color: Palette.amberDeep, fontWeight: "700" },
  scrollContent: { paddingBottom: 20 },
  imageContainer: {
    width,
    height: width * 0.85,
    position: "relative",
  },
  mainImage: { width: "100%", height: "100%" },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  roundBtn: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.card,
  },
  contentContainer: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: Palette.cream,
    marginTop: -28,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  itemName: {
    fontSize: 24,
    fontWeight: "700",
    color: Palette.ink,
  },
  itemCategory: {
    fontSize: 13,
    color: Palette.amberDeep,
    fontWeight: "600",
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: Palette.ink,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  reviewSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  ratingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
  },
  reviewCount: {
    fontSize: 12,
    color: Palette.inkFaint,
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.sm,
  },
  reviewBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.line,
    marginVertical: Spacing.sm,
  },

  // 정보/종류 탭
  infoTabRow: {
    flexDirection: "row",
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.pill,
    padding: 4,
    marginTop: Spacing.md,
  },
  infoTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
  },
  infoTabActive: {
    backgroundColor: Palette.charcoal,
  },
  infoTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.inkSoft,
  },
  infoTabTextActive: {
    color: Palette.cream,
  },
  tabContent: {
    marginTop: Spacing.lg,
  },
  descriptionText: {
    fontSize: 14,
    color: Palette.inkSoft,
    lineHeight: 22,
  },

  // 종류 탭 — 재료 리스트
  ingredientList: {
    gap: Spacing.sm + 4,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    padding: Spacing.sm + 4,
    gap: Spacing.md,
    ...Shadow.card,
  },
  ingredientImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Palette.amberSoft,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
  },
  noIngredientText: {
    fontSize: 13,
    color: Palette.inkFaint,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },

  // 추가 선택
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm + 4,
  },
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

  // 하단 플로팅 바
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.white,
    paddingTop: Spacing.md,
    paddingBottom: 32,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    paddingHorizontal: 5,
    paddingVertical: 5,
    marginRight: Spacing.sm + 4,
  },
  qtyBtnRow: {
    padding: 9,
    backgroundColor: Palette.white,
    borderRadius: Radius.sm,
    ...Shadow.card,
  },
  qtyTextRow: {
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: Spacing.md,
    color: Palette.ink,
  },
  cartBtn: {
    flex: 1,
    backgroundColor: Palette.charcoal,
    height: 56,
    borderRadius: Radius.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  cartBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.cream,
    flex: 1,
    textAlign: "center",
  },
  priceBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
  priceBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.gold,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Palette.amber,
    width: 17,
    height: 17,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Palette.white,
  },
  cartBadgeText: {
    color: Palette.white,
    fontSize: 9,
    fontWeight: "700",
  },
});
