// components/FloatingActions/FloatingActions.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CartContext } from "@/components/contexts/CartContext";
import { NotificationContext } from "@/components/contexts/NotificationContext";
import { Palette, Shadow, Spacing } from "@/constants/theme";

const RESTAURANT_PHONE = "0507-1410-7634";
const RADIUS = 78;

type ActionItem = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: number;
  angleDeg: number;
};

type ActionItemViewProps = {
  item: ActionItem;
  progress: SharedValue<number>;
  open: boolean;
};

function ActionItemView({ item, progress, open }: ActionItemViewProps) {
  const rad = (item.angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad) * RADIUS;
  const dy = -Math.sin(rad) * RADIUS;

  const itemStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: progress.value * dx },
      { translateY: progress.value * dy },
      { scale: 0.7 + progress.value * 0.3 },
    ],
  }));

  return (
    <Animated.View
      style={[styles.itemWrap, itemStyle]}
      pointerEvents={open ? "auto" : "none"}
    >
      <TouchableOpacity style={styles.itemButton} onPress={item.onPress}>
        <View style={styles.itemIconWrap}>
          <Ionicons name={item.icon} size={17} color="#FFFFFF" />
          {!!item.badge && item.badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.labelWrap}>
        <Text style={styles.itemLabel} numberOfLines={1}>
          {item.label}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function FloatingActions() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { getTotalCount } = useContext(CartContext);
  const { unreadCount } = useContext(NotificationContext);
  const cartCount = getTotalCount();

  // 관리자 화면은 자체 하단 탭바가 따로 있어서, 손님용 플로팅 버튼은 안 보여줍니다.
  const inAdmin = segments[0] === "admin";

  // 첫 세그먼트가 "(tabs)"면 하단 탭 화면(홈/좌석/예약내역/정보/리뷰/마이),
  // 그 외에는 app/_layout.tsx가 헤더를 그려주는 스택 화면(메뉴, 결제, 리뷰작성 등)
  const inTabs = segments[0] === "(tabs)";

  // 탭 화면은 하단 탭바(72px)를 피해 위쪽에 띄우고,
  // 스택 화면은 탭바가 없으니 화면 하단 가까이로 내립니다.
  const bottomOffset = inTabs ? 140 : insets.bottom + 24;

  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: 220 });
  }, [open]);

  // 메뉴가 열려있는 상태에서 다른 탭으로 이동하면, 메뉴는 자동으로 닫아줍니다.
  useEffect(() => {
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.join("/")]);

  const handleCall = () => {
    setOpen(false);
    Linking.openURL(`tel:${RESTAURANT_PHONE}`).catch(() => {
      Alert.alert("에러", "전화 걸기 기능을 실행할 수 없습니다.");
    });
  };

  const handleAIChat = () => {
    setOpen(false);
    router.push("/ai-chat" as any);
  };

  const handleCart = () => {
    setOpen(false);
    router.push("/cart" as any);
  };

  const handleNotifications = () => {
    setOpen(false);
    router.push("/notification" as any);
  };

  // 탭 화면(홈 등)에는 헤더가 없으니 4개 다 보여주고,
  // 스택 화면(메뉴/리뷰작성 등)은 헤더에 이미 홈·알림·장바구니가 있어서 AI Chat/전화만 보여줍니다.
  const items: ActionItem[] = inTabs
    ? [
        {
          key: "aichat",
          icon: "sparkles",
          label: "AI Chat",
          onPress: handleAIChat,
          angleDeg: 90,
        },
        {
          key: "call",
          icon: "call",
          label: "전화",
          onPress: handleCall,
          angleDeg: 140,
        },
        {
          key: "cart",
          icon: "cart",
          label: "장바구니",
          onPress: handleCart,
          badge: cartCount,
          angleDeg: 190,
        },
        {
          key: "notification",
          icon: "notifications",
          label: "알림",
          onPress: handleNotifications,
          badge: unreadCount,
          angleDeg: 240,
        },
      ]
    : [
        {
          key: "aichat",
          icon: "sparkles",
          label: "AI Chat",
          onPress: handleAIChat,
          angleDeg: 150,
        },
        {
          key: "call",
          icon: "call",
          label: "전화",
          onPress: handleCall,
          angleDeg: 90,
        },
      ];

  const toggleIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 90}deg` }],
  }));

  // 관리자 화면은 자체 탭바가 있으니 이 플로팅 버튼 자체를 렌더링하지 않습니다.
  // (모든 훅을 호출한 다음에 판단해야 해서, 조건문은 return 바로 앞에 둡니다.)
  if (inAdmin) return null;

  return (
    <View
      style={[styles.outerContainer, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={styles.container} pointerEvents="box-none">
        {items.map((item) => (
          <ActionItemView
            key={item.key}
            item={item}
            progress={progress}
            open={open}
          />
        ))}

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setOpen((prev) => !prev)}
          activeOpacity={0.85}
        >
          <Animated.View style={toggleIconStyle}>
            <Ionicons
              name={open ? "close" : "grid"}
              size={24}
              color="#FFFFFF"
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: "absolute",
    right: Spacing.md + 4,
    width: 220,
    height: 220,
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  container: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.tabBar,
  },
  itemWrap: {
    position: "absolute",
    alignItems: "center",
    gap: 4,
  },
  itemButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.card,
  },
  itemIconWrap: {
    position: "relative",
  },
  labelWrap: {
    backgroundColor: "#000000",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: Palette.amber,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 3,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#000000",
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
