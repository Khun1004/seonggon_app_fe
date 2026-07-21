// app/(tabs)/_layout.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { HapticTab } from "@/components/haptic-tab";
import { Palette } from "@/constants/theme";

function TabBarBackground() {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.bgOverlay} />
      <Text style={styles.thankYouText}>
        성공식당을 이용해 주셔서 감사합니다.
      </Text>
    </View>
  );
}

type IconName = keyof typeof Ionicons.glyphMap;
type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

const TAB_BAR_HEIGHT = 72;

function RenderIonicon({ name, color }: { name: IconName; color: string }) {
  return <Ionicons name={name} size={20} color={color} />;
}

function RenderMaterialIcon({
  name,
  color,
}: {
  name: MaterialIconName;
  color: string;
}) {
  return <MaterialIcons name={name} size={20} color={color} />;
}

function TabIcon({
  focused,
  renderActive,
  renderInactive,
  label,
}: {
  focused: boolean;
  renderActive: (color: string) => React.ReactNode;
  renderInactive: (color: string) => React.ReactNode;
  label: string;
}) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, {
      damping: 14,
      stiffness: 180,
    });
  }, [focused]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: progress.value * -14 },
      { scale: 0.7 + progress.value * 0.3 },
    ],
    backgroundColor: "#FFFFFF",
    opacity: progress.value,
  }));

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * -14 }],
  }));

  const labelColorStyle = useAnimatedStyle(() => ({
    color: focused ? Palette.gold : "#9C9388",
  }));

  return (
    <View style={styles.iconWrap}>
      {/* 떠오르는 골드 원형 (블랙 테두리) — focused일 때만 보임 */}
      <Animated.View style={[styles.popCircle, circleStyle]}>
        {renderActive(Palette.charcoal)}
      </Animated.View>

      {/* 평소 아이콘 (비활성 상태) */}
      <Animated.View style={[styles.staticIcon, iconWrapStyle]}>
        {!focused && renderInactive("#9C9388")}
      </Animated.View>

      {/* 라벨 — 항상 표시 */}
      <Animated.Text style={[styles.label, labelColorStyle]} numberOfLines={1}>
        {label}
      </Animated.Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Palette.gold,
        tabBarInactiveTintColor: "#9C9388",
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarBackground: () => <TabBarBackground />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              renderActive={(color) => (
                <RenderIonicon name="home" color={color} />
              )}
              renderInactive={(color) => (
                <RenderIonicon name="home-outline" color={color} />
              )}
              label="홈"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="seats"
        options={{
          title: "좌석",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              renderActive={(color) => (
                <RenderMaterialIcon name="event-seat" color={color} />
              )}
              renderInactive={(color) => (
                <RenderMaterialIcon name="event-seat" color={color} />
              )}
              label="좌석"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reservationcheck"
        options={{
          title: "예약내역",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              renderActive={(color) => (
                <RenderIonicon name="calendar" color={color} />
              )}
              renderInactive={(color) => (
                <RenderIonicon name="calendar-outline" color={color} />
              )}
              label="예약내역"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: "정보",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              renderActive={(color) => (
                <RenderIonicon name="book" color={color} />
              )}
              renderInactive={(color) => (
                <RenderIonicon name="book-outline" color={color} />
              )}
              label="정보"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: "리뷰",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              renderActive={(color) => (
                <RenderIonicon name="star" color={color} />
              )}
              renderInactive={(color) => (
                <RenderIonicon name="star-outline" color={color} />
              )}
              label="리뷰"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: "마이",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              renderActive={(color) => (
                <RenderIonicon name="person" color={color} />
              )}
              renderInactive={(color) => (
                <RenderIonicon name="person-outline" color={color} />
              )}
              label="마이"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: TAB_BAR_HEIGHT,
    backgroundColor: "transparent",
    borderTopWidth: 0,
    paddingTop: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 14,
  },
  tabBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Palette.charcoal,
  },
  tabBarItem: {
    justifyContent: "center",
    alignItems: "center",
    height: TAB_BAR_HEIGHT,
  },
  iconWrap: {
    width: 58,
    height: TAB_BAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  popCircle: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    top: (TAB_BAR_HEIGHT - 48) / 2,
    borderWidth: 2,
    borderColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  staticIcon: {
    position: "absolute",
    top: (TAB_BAR_HEIGHT - 20) / 2 - 7,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
    position: "absolute",
    bottom: (TAB_BAR_HEIGHT - 48) / 2 - 2,
  },
  thankYouText: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 8 : 4,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    color: Palette.inkSoft,
    letterSpacing: 0.3,
  },
});
