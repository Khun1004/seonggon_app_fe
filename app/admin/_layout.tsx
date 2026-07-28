// app/admin/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

import { AdminPalette } from "@/constants/adminTheme";

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen
        name="menu"
        options={{
          headerShown: true,
          title: "메뉴 관리",
          headerStyle: { backgroundColor: AdminPalette.charcoal },
          headerTintColor: AdminPalette.cream,
          headerTitleStyle: { fontWeight: "700" },
          headerBackTitle: "",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="nearby-spots"
        options={{
          headerShown: true,
          title: "주변 명소 관리",
          headerStyle: { backgroundColor: AdminPalette.charcoal },
          headerTintColor: AdminPalette.cream,
          headerTitleStyle: { fontWeight: "700" },
          headerBackTitle: "",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="menu-popularity"
        options={{
          headerShown: true,
          title: "인기 메뉴 순위",
          headerStyle: { backgroundColor: AdminPalette.charcoal },
          headerTintColor: AdminPalette.cream,
          headerTitleStyle: { fontWeight: "700" },
          headerBackTitle: "",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="store-profile"
        options={{
          headerShown: true,
          title: "성공식당의 상세",
          headerStyle: { backgroundColor: AdminPalette.charcoal },
          headerTintColor: AdminPalette.cream,
          headerTitleStyle: { fontWeight: "700" },
          headerBackTitle: "",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="ingredient-sets"
        options={{
          headerShown: true,
          title: "재료 세트 관리",
          headerStyle: { backgroundColor: AdminPalette.charcoal },
          headerTintColor: AdminPalette.cream,
          headerTitleStyle: { fontWeight: "700" },
          headerBackTitle: "",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="reservation-times"
        options={{
          headerShown: true,
          title: "예약 시간 설정",
          headerStyle: { backgroundColor: AdminPalette.charcoal },
          headerTintColor: AdminPalette.cream,
          headerTitleStyle: { fontWeight: "700" },
          headerBackTitle: "",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
