// components/common/ScreenHeader.tsx
// 공용 네이티브 헤더 구성 요소 — app/_layout.tsx의 기본 헤더와,
// Reservation.tsx처럼 단계별로 제목/뒤로가기 동작이 바뀌는 화면에서 함께 사용합니다.
import { Palette } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CartContext } from "@/components/contexts/CartContext";
import { NotificationContext } from "@/components/contexts/NotificationContext";

// 헤더의 아이콘 버튼 (뒤로가기 / 홈 / 알림 / 장바구니 등 공용) — 배경 없이 아이콘만
export function HeaderIconButton({
  name,
  onPress,
  badge,
  color = Palette.ink,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  badge?: number;
  color?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={6}
      activeOpacity={0.75}
      style={headerStyles.iconBtn}
    >
      <Ionicons name={name} size={18} color={color} />
      {!!badge && badge > 0 && (
        <View style={headerStyles.badge}>
          <Text style={headerStyles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// 왼쪽 뒤로가기 버튼 — OS 기본 화살표 대신 앱 톤에 맞는 아이콘 버튼 사용.
// onPress를 넘기지 않으면 기본값으로 router.back()을 씁니다 (Reservation처럼
// 단계 이동이 필요한 화면은 onPress를 직접 넘겨서 재정의).
export function HeaderBackButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  return (
    <View style={{ marginLeft: 2, marginRight: 6 }}>
      <HeaderIconButton
        name="chevron-back"
        onPress={onPress ?? (() => router.back())}
      />
    </View>
  );
}

// 오른쪽 홈 / 알림 / 장바구니 아이콘 묶음
export function HeaderRightIcons() {
  const router = useRouter();
  const { cartItems } = useContext(CartContext);
  const { unreadCount } = useContext(NotificationContext);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={headerStyles.rightRow}>
      <HeaderIconButton
        name="home-outline"
        onPress={() => router.push("/(tabs)" as any)}
      />
      <HeaderIconButton
        name="notifications-outline"
        onPress={() => router.push("/notification" as any)}
        badge={unreadCount}
      />
      <HeaderIconButton
        name="cart-outline"
        onPress={() => router.push("/cart" as any)}
        badge={cartCount}
      />
    </View>
  );
}

// 왼쪽 "골드 라벨 + 제목" 2단 구성 — 화면마다 있던 eyebrow/title 조합을 헤더에서 재현
export function HeaderTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <View style={headerStyles.titleWrap}>
      <Text style={headerStyles.eyebrow}>{eyebrow}</Text>
      <Text style={headerStyles.title}>{title}</Text>
    </View>
  );
}

export const headerStyles = StyleSheet.create({
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginRight: 6,
  },
  iconBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Palette.amberDeep,
    borderWidth: 1.5,
    borderColor: Palette.cream,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: { fontSize: 9, fontWeight: "700", color: Palette.white },
  titleWrap: { justifyContent: "center" },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Palette.ink,
  },
});

// 헤더 배경/그림자 등 화면 공통 스타일 옵션 (headerLeft/Right/Title은 화면에서 필요에 맞게 조합)
export const baseHeaderScreenOptions = {
  headerShown: true,
  headerTitleAlign: "left" as const,
  // 헤더 배경을 본문(cream)보다 살짝 톤을 낮춰 시각적으로 분리되게 하고,
  // 아래로 은은한 그림자를 넣어 붕 뜬 듯한 느낌을 줍니다.
  headerStyle: {
    backgroundColor: Palette.creamDim,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  headerShadowVisible: true,
  headerTintColor: Palette.ink,
};

// 왼쪽 "< 골드라벨 + 제목" / 오른쪽 홈·알림·장바구니 아이콘이 있는 기본 공용 헤더 옵션.
// 화면마다 제목/뒤로가기/우측 버튼이 고정인 경우 이걸 그대로 씁니다.
export function screenHeaderOptions(eyebrow: string, title: string) {
  return {
    ...baseHeaderScreenOptions,
    headerTitle: () => <HeaderTitle eyebrow={eyebrow} title={title} />,
    headerLeft: () => <HeaderBackButton />,
    headerRight: () => <HeaderRightIcons />,
  };
}
