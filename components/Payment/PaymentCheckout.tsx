// components/Payment/PaymentCheckout.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";

import { ReservationContext } from "@/components/contexts/ReservationContext";
import {
  getReservationMenuName,
  getReservationMenuPriceNumber,
} from "@/constants/reservation-menu-data";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

// 토스페이먼츠는 보안 때문에 HTTPS로 서비스되는 페이지에서만 작동해요.
// 로컬 개발 중에는 VS Code Dev Tunnels(또는 ngrok)로 만든 임시 HTTPS 주소를 여기에 넣어주세요.
// 배포 후 백엔드 자체가 https://... 주소가 되면, 이 값을 BASE_URL로 그대로 바꾸면 됩니다.
// 주의: VS Code Dev Tunnels 주소는 다시 켤 때마다 바뀔 수 있어요 — 그때마다 여기를 업데이트해 주세요.
const PAYMENT_TUNNEL_URL = "https://w176h65l-8080.jpe1.devtunnels.ms";

export default function PaymentCheckout() {
  const router = useRouter();
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const { findReservationById, refreshReservations } =
    useContext(ReservationContext);

  const reservation = findReservationById(reservationId);

  const [showWebview, setShowWebview] = useState(false);
  const [webviewLoading, setWebviewLoading] = useState(true);

  const orderLines = useMemo(() => {
    if (!reservation?.menus) return [];
    return Object.entries(reservation.menus)
      .filter(([, qty]) => qty > 0)
      .map(([menuId, qty]) => ({
        id: menuId,
        name: getReservationMenuName(menuId),
        qty,
        price: getReservationMenuPriceNumber(menuId) * qty,
      }));
  }, [reservation]);

  const subtotal = orderLines.reduce((sum, line) => sum + line.price, 0);
  const totalAmount = subtotal; // 지금은 별도 할인 로직이 없어 상품 금액과 동일해요.

  if (!reservation) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notFoundText}>예약 정보를 찾을 수 없습니다.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.notFoundLink}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 토스 결제위젯을 띄운 웹 페이지 주소 — HTTPS 터널(PAYMENT_TUNNEL_URL)을 통해서 열어야
  // 토스 SDK가 정상적으로 로딩돼요. baseUrl도 같이 넘겨서, 결제 완료 후 이동할
  // 성공/실패 페이지 주소도 같은 터널 주소로 정확히 만들어지도록 합니다.
  const checkoutUrl =
    `${PAYMENT_TUNNEL_URL}/payment-widget/checkout` +
    `?reservationId=${reservation.id}` +
    `&amount=${totalAmount}` +
    `&baseUrl=${encodeURIComponent(PAYMENT_TUNNEL_URL)}`;

  // 결제 완료/실패 후 토스가 이동시키는 우리 서버 페이지(success/fail)로 온 걸 감지해서 처리합니다.
  const handleNavigationChange = (navState: WebViewNavigation) => {
    const { url } = navState;
    if (url.includes("/payment-widget/success")) {
      setShowWebview(false);
      refreshReservations(reservation.phone);
      Alert.alert("결제 완료", "결제가 완료되었습니다!", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } else if (url.includes("/payment-widget/fail")) {
      setShowWebview(false);
      Alert.alert("결제 실패", "결제가 취소되었거나 실패했습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.testBadge}>
          <Ionicons name="flask-outline" size={14} color={Palette.amberDeep} />
          <Text style={styles.testBadgeText}>
            토스페이먼츠 테스트 결제예요. 실제로 돈이 빠지지 않아요.
          </Text>
        </View>

        {/* 주문 정보 */}
        <Text style={styles.pageTitle}>주문서</Text>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>예약 정보</Text>
          <Text style={styles.resSummary}>
            {reservation.date} {reservation.time} · {reservation.roomLabel}
          </Text>
          <Text style={styles.resSummarySub}>
            {reservation.name} · {reservation.peopleCount}명
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>주문 내역</Text>
          {orderLines.length === 0 ? (
            <Text style={styles.emptyOrderText}>
              예약 시 선택하신 메뉴가 없어요. 매장에서 주문하신 내용으로 결제해
              주세요.
            </Text>
          ) : (
            orderLines.map((line) => (
              <View key={line.id} style={styles.orderRow}>
                <Text style={styles.orderName}>
                  {line.name} × {line.qty}
                </Text>
                <Text style={styles.orderPrice}>
                  {line.price.toLocaleString()}원
                </Text>
              </View>
            ))
          )}
        </View>

        {/* 결제 금액 상세 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>결제 금액</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>상품 금액</Text>
            <Text style={styles.priceValue}>{subtotal.toLocaleString()}원</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>할인 금액</Text>
            <Text style={styles.priceValue}>0원</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>총 결제 금액</Text>
            <Text style={styles.totalValue}>
              {totalAmount.toLocaleString()}원
            </Text>
          </View>
        </View>

        <View style={styles.tossNoticeBox}>
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={Palette.amberDeep}
          />
          <Text style={styles.tossNoticeText}>
            토스페이먼츠 결제창에서 카드, 카카오페이, 네이버페이 등 원하시는
            수단을 직접 고르실 수 있어요.
          </Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => {
            setWebviewLoading(true);
            setShowWebview(true);
          }}
        >
          <Ionicons name="card" size={18} color={Palette.white} />
          <Text style={styles.payBtnText}>
            {totalAmount.toLocaleString()}원 결제하기
          </Text>
        </TouchableOpacity>
      </View>

      {/* 토스페이먼츠 결제위젯 — 실제 웹 결제창을 그대로 띄워줍니다 */}
      <Modal
        visible={showWebview}
        animationType="slide"
        onRequestClose={() => setShowWebview(false)}
      >
        <View style={styles.webviewHeader}>
          <TouchableOpacity
            style={styles.webviewCloseBtn}
            onPress={() => setShowWebview(false)}
          >
            <Ionicons name="close" size={22} color={Palette.ink} />
          </TouchableOpacity>
          <Text style={styles.webviewHeaderTitle}>토스페이먼츠 결제</Text>
          <View style={{ width: 22 }} />
        </View>
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleNavigationChange}
          onLoadEnd={() => setWebviewLoading(false)}
          onError={(e) => {
            setWebviewLoading(false);
            Alert.alert(
              "결제 화면 로딩 실패",
              e.nativeEvent.description || "결제 화면을 불러오지 못했습니다.",
            );
          }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          mixedContentMode="always"
          thirdPartyCookiesEnabled
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator color={Palette.amberDeep} size="large" />
            </View>
          )}
        />
        {webviewLoading && (
          <View style={styles.webviewLoadingOverlay}>
            <ActivityIndicator color={Palette.amberDeep} size="large" />
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { padding: Spacing.lg },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Palette.cream,
  },
  notFoundText: { fontSize: 14, color: Palette.inkFaint },
  notFoundLink: {
    fontSize: 14,
    color: Palette.amberDeep,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  testBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Palette.amberSoft,
    padding: Spacing.sm + 4,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  testBadgeText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: Palette.amberDeep,
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Palette.ink,
    marginBottom: Spacing.md,
  },

  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm + 4,
  },
  resSummary: { fontSize: 14, fontWeight: "600", color: Palette.ink },
  resSummarySub: { fontSize: 12, color: Palette.inkFaint, marginTop: 4 },

  emptyOrderText: {
    fontSize: 12,
    color: Palette.inkFaint,
    lineHeight: 18,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  orderName: { fontSize: 13, color: Palette.inkSoft, flex: 1 },
  orderPrice: { fontSize: 13, color: Palette.ink, fontWeight: "600" },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  priceLabel: { fontSize: 13, color: Palette.inkSoft },
  priceValue: { fontSize: 13, color: Palette.ink, fontWeight: "600" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm + 4,
    paddingTop: Spacing.sm + 4,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  totalLabel: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  totalValue: { fontSize: 16, fontWeight: "800", color: Palette.amberDeep },

  tossNoticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Palette.white,
    padding: Spacing.md,
    borderRadius: Radius.md,
    ...Shadow.card,
  },
  tossNoticeText: {
    flex: 1,
    fontSize: 12,
    color: Palette.inkSoft,
    lineHeight: 17,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm + 4,
    paddingBottom: 20,
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Palette.charcoal,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  payBtnText: { color: Palette.cream, fontSize: 16, fontWeight: "700" },

  webviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
    backgroundColor: Palette.white,
  },
  webviewCloseBtn: { padding: 4 },
  webviewHeaderTitle: { fontSize: 15, fontWeight: "700", color: Palette.ink },
  webviewLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.cream,
  },
  webviewLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.cream,
  },
});
