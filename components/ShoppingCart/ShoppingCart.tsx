// components/ShoppingCart/ShoppingCart.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { CartContext } from "@/components/contexts/CartContext";
import { resolveImageSource } from "@/constants/menu-data";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

export default function ShoppingCart() {
  const router = useRouter();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getTotalCount,
    getTotalPrice,
  } = useContext(CartContext);

  const handleGoToReservation = () => {
    if (cartItems.length === 0) return;

    // 장바구니에 담긴 메뉴를 { id: quantity } 형태로 변환해서 예약 화면에 전달
    const cartMenus: Record<string, number> = {};
    cartItems.forEach((item) => {
      cartMenus[item.id] = (cartMenus[item.id] ?? 0) + item.quantity;
    });

    router.push({
      pathname: "/reservation",
      params: { cartMenus: JSON.stringify(cartMenus) },
    } as any);
  };

  const totalCount = getTotalCount();
  const totalPrice = getTotalPrice();

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={36} color={Palette.amberDeep} />
          </View>
          <Text style={styles.emptyText}>장바구니가 텅 비었습니다.</Text>
          <Text style={styles.emptySubText}>
            맛있는 메뉴를 구경하고 장바구니에 담아보세요!
          </Text>
          <TouchableOpacity
            style={styles.emptyCtaBtn}
            onPress={() => router.push("/menu" as any)}
          >
            <Text style={styles.emptyCtaText}>메뉴 보러 가기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {cartItems.map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.cartItem}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/menu-detail",
                      params: { id: item.id },
                    } as any)
                  }
                >
                  <Image
                    source={resolveImageSource(item.image) ?? undefined}
                    style={styles.itemImage}
                  />
                </TouchableOpacity>

                <View style={styles.itemInfo}>
                  <View style={styles.itemHeader}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() =>
                        router.push({
                          pathname: "/menu-detail",
                          params: { id: item.id },
                        } as any)
                      }
                    >
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeFromCart(index)}>
                      <Ionicons
                        name="close"
                        size={18}
                        color={Palette.inkFaint}
                      />
                    </TouchableOpacity>
                  </View>

                  {item.options && item.options.length > 0 && (
                    <Text style={styles.itemOptions}>
                      {item.options.join(", ")}
                    </Text>
                  )}

                  <View style={styles.itemFooter}>
                    <Text style={styles.itemPrice}>{item.price}</Text>

                    <View style={styles.qtyBox}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(index, -1)}
                      >
                        <Ionicons name="remove" size={14} color={Palette.ink} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(index, 1)}
                      >
                        <Ionicons name="add" size={14} color={Palette.ink} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {/* 합계 카드 */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>메뉴 합계</Text>
                <Text style={styles.summaryTotalValue}>
                  {totalPrice.toLocaleString()}원
                </Text>
              </View>
              <View style={styles.noticeBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={15}
                  color={Palette.amberDeep}
                />
                <Text style={styles.noticeText}>
                  미리 주문은 받지 않으며, 담은 메뉴는 예약 시 함께 전달됩니다.
                </Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* 하단 바 — 예약하기로 이동 */}
          <View style={styles.checkoutBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>총 {totalCount}개 메뉴</Text>
              <Text style={styles.totalPrice}>
                {totalPrice.toLocaleString()}원
              </Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleGoToReservation}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={Palette.cream}
              />
              <Text style={styles.checkoutBtnText}>이 메뉴로 예약하기</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.ink,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.amberSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm,
  },
  emptySubText: {
    fontSize: 13,
    color: Palette.inkFaint,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  emptyCtaBtn: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.pill,
  },
  emptyCtaText: {
    color: Palette.cream,
    fontSize: 14,
    fontWeight: "700",
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 4,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  itemImage: {
    width: 76,
    height: 76,
    borderRadius: Radius.sm,
    backgroundColor: Palette.creamDim,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "space-between",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
    marginRight: Spacing.sm,
  },
  itemOptions: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginTop: 3,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: Spacing.sm,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.sm,
  },
  qtyBtn: {
    padding: 7,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.ink,
    width: 22,
    textAlign: "center",
  },

  summaryCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    ...Shadow.card,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
  },
  summaryTotalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Palette.amberSoft,
    padding: Spacing.sm + 4,
    borderRadius: Radius.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    color: Palette.amberDeep,
    fontWeight: "600",
    lineHeight: 16,
  },

  checkoutBox: {
    backgroundColor: Palette.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm + 4,
  },
  totalLabel: {
    fontSize: 14,
    color: Palette.inkSoft,
    fontWeight: "600",
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: Palette.ink,
  },
  checkoutBtn: {
    backgroundColor: Palette.charcoal,
    height: 54,
    borderRadius: Radius.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  checkoutBtnText: {
    fontSize: 16,
    color: Palette.cream,
    fontWeight: "700",
  },
});
