// components/Notification/Notification.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useContext } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/components/contexts/AuthContext";
import {
  AppNotification,
  NotificationContext,
} from "@/components/contexts/NotificationContext";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const TYPE_META: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  RESERVATION_CREATED: { icon: "calendar", color: "#3B6D11", bg: "#EAF3DE" },
  RESERVATION_UPDATED: { icon: "create", color: "#3B6D11", bg: "#EAF3DE" },
  RESERVATION_CANCELLED: {
    icon: "close-circle",
    color: "#B23A2E",
    bg: "#FBEAEA",
  },
  TAKEOUT_CREATED: {
    icon: "bag-check",
    color: "#6B3FA0",
    bg: "rgba(107,63,160,0.14)",
  },
  TAKEOUT_UPDATED: {
    icon: "create",
    color: "#6B3FA0",
    bg: "rgba(107,63,160,0.14)",
  },
  TAKEOUT_CANCELLED: { icon: "close-circle", color: "#B23A2E", bg: "#FBEAEA" },
  PAYMENT_COMPLETED: {
    icon: "card",
    color: Palette.amberDeep,
    bg: Palette.amberSoft,
  },
  SIGNUP_WELCOME: { icon: "sparkles", color: "#993556", bg: "#FBEAF0" },
};

const DEFAULT_META = {
  icon: "notifications" as const,
  color: Palette.inkSoft,
  bg: Palette.creamDim,
};

// epoch ms를 "방금 전 / n분 전 / n시간 전 / n일 전 / 날짜"로 보여줍니다.
function formatRelativeTime(epochMs: number): string {
  const diffMs = Date.now() - epochMs;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "어제";
  if (diffDay < 7) return `${diffDay}일 전`;
  const d = new Date(epochMs);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function Notification() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();
  const {
    notifications,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useContext(NotificationContext);

  useFocusEffect(
    useCallback(() => {
      if (user?.loginId) refreshNotifications(user.loginId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.loginId]),
  );

  const handlePress = (item: AppNotification) => {
    if (!item.isRead) markAsRead(item.id);
    if (item.route) router.push(item.route as any);
  };

  if (!isLoaded) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={Palette.amberDeep} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="notifications-off-outline"
          size={48}
          color={Palette.line}
        />
        <Text style={styles.emptyText}>
          로그인하면 예약·결제·회원가입 등의 알림을 받아보실 수 있어요.
        </Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("/login" as any)}
        >
          <Text style={styles.loginBtnText}>로그인하러 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {hasUnread && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={() => markAllAsRead(user.loginId)}
          >
            <Text style={styles.markAllBtnText}>모두 읽음 처리</Text>
          </TouchableOpacity>
        )}

        {loading && notifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={Palette.amberDeep} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color={Palette.line}
            />
            <Text style={styles.emptyText}>알림이 없습니다.</Text>
          </View>
        ) : (
          notifications.map((item) => {
            const meta = TYPE_META[item.type] ?? DEFAULT_META;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, !item.isRead && styles.itemCardUnread]}
                activeOpacity={0.8}
                onPress={() => handlePress(item)}
              >
                <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.itemBody}>{item.message}</Text>
                  <Text style={styles.itemTime}>
                    {formatRelativeTime(item.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    paddingTop: 100,
  },
  loginBtn: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.lg,
  },
  loginBtnText: { color: Palette.cream, fontSize: 14, fontWeight: "700" },

  markAllBtn: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: Spacing.sm,
  },
  markAllBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.amberDeep,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    gap: Spacing.md,
  },
  emptyText: {
    color: Palette.inkFaint,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  itemCard: {
    flexDirection: "row",
    gap: Spacing.md,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  itemCardUnread: {
    borderWidth: 1,
    borderColor: Palette.amber,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.amber,
  },
  itemBody: {
    fontSize: 12,
    color: Palette.inkSoft,
    marginTop: 4,
    lineHeight: 17,
  },
  itemTime: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginTop: 6,
  },
});
