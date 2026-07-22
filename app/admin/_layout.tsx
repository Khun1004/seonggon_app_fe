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
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
