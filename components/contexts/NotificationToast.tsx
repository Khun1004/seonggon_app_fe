// components/contexts/NotificationToast.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppNotification,
  NotificationContext,
} from "@/components/contexts/NotificationContext";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const AUTO_DISMISS_MS = 3200;

// 알림 목록에 "새로 생긴" 항목이 있으면, 화면 맨 위에 잠깐 배너로 보여줍니다.
// 어느 화면에 있든 (_layout.tsx에 하나만 둬서) 항상 뜰 수 있게 만들었어요.
export default function NotificationToast() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notifications } = useContext(NotificationContext);

  const [visibleToast, setVisibleToast] = useState<AppNotification | null>(
    null,
  );
  const seenIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoadRef = useRef(true);

  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (notifications.length === 0) return;

    // 처음 목록을 불러올 때(앱을 막 켰을 때)는 전부 "이미 본 것"으로 표시만 하고,
    // 토스트는 안 띄워요 — 안 그러면 로그인하자마자 알림이 우르르 다 떠버려요.
    if (isFirstLoadRef.current) {
      notifications.forEach((n) => seenIdsRef.current.add(n.id));
      isFirstLoadRef.current = false;
      return;
    }

    const newOne = notifications.find((n) => !seenIdsRef.current.has(n.id));
    if (newOne) {
      seenIdsRef.current.add(newOne.id);
      notifications.forEach((n) => seenIdsRef.current.add(n.id));
      setVisibleToast(newOne);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  useEffect(() => {
    if (!visibleToast) return;

    translateY.value = withTiming(0, { duration: 280 });
    opacity.value = withTiming(1, { duration: 280 });

    const timer = setTimeout(() => {
      translateY.value = withTiming(-120, { duration: 220 });
      opacity.value = withTiming(0, { duration: 220 });
      setTimeout(() => setVisibleToast(null), 220);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleToast]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visibleToast) return null;

  const handlePress = () => {
    setVisibleToast(null);
    if (visibleToast.route) router.push(visibleToast.route as any);
  };

  return (
    <Animated.View
      style={[styles.wrap, { top: insets.top + 6 }, animatedStyle]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={handlePress}
      >
        <Ionicons
          name="notifications"
          size={18}
          color={Palette.amberDeep}
          style={{ marginTop: 1 }}
        />
        <Text style={styles.title} numberOfLines={1}>
          {visibleToast.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {visibleToast.message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 999,
    elevation: 999,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.amber,
    paddingVertical: Spacing.sm + 6,
    paddingHorizontal: Spacing.md,
    ...Shadow.card,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: Palette.ink,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: Palette.inkSoft,
    lineHeight: 17,
  },
});
