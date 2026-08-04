// app/admin/components/user-info/user-info.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { AdminContext } from "@/components/contexts/AdminContext";
import { AdminReservation, getAdminReservations } from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";

type CustomerGroup = {
  phone: string;
  name: string;
  isMember: boolean;
  loginId: string | null;
  reservationCount: number;
  lastDate: string;
};

export default function AdminUserInfo() {
  const router = useRouter();
  const { adminPassword } = useContext(AdminContext);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "member" | "unregistered">(
    "all",
  );

  const load = useCallback(() => {
    if (!adminPassword) return;
    setLoading(true);
    getAdminReservations(adminPassword)
      .then(setReservations)
      .catch((e) => Alert.alert("알림", e.message))
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // 전화번호 기준으로 손님을 묶어요. 그 전화번호로 만들어진 예약 중 하나라도
  // loginId(로그인 아이디)가 있으면 "회원"이에요 — 손님이 앱에서 직접
  // 로그인해서 예약한 적이 있다는 뜻이니까요. 전부 loginId가 없으면, 사장님이
  // 관리자 화면에서 대신 등록해준 것뿐이라 "미등록"으로 표시해요.
  const groupMap = new Map<string, CustomerGroup>();
  for (const r of reservations) {
    const existing = groupMap.get(r.phone);
    const hasLogin = !!r.loginId && r.loginId.trim().length > 0;
    if (!existing) {
      groupMap.set(r.phone, {
        phone: r.phone,
        name: r.name,
        isMember: hasLogin,
        loginId: hasLogin ? r.loginId! : null,
        reservationCount: 1,
        lastDate: r.date,
      });
    } else {
      existing.reservationCount += 1;
      if (hasLogin) {
        existing.isMember = true;
        existing.loginId = r.loginId!;
      }
      if (r.date > existing.lastDate) {
        existing.lastDate = r.date;
        existing.name = r.name;
      }
    }
  }

  let customers = Array.from(groupMap.values()).sort((a, b) =>
    b.lastDate.localeCompare(a.lastDate),
  );

  if (filter === "member") customers = customers.filter((c) => c.isMember);
  if (filter === "unregistered")
    customers = customers.filter((c) => !c.isMember);

  if (search.trim()) {
    const q = search.trim();
    customers = customers.filter(
      (c) => c.name.includes(q) || c.phone.includes(q),
    );
  }

  const memberCount = Array.from(groupMap.values()).filter(
    (c) => c.isMember,
  ).length;
  const unregisteredCount = groupMap.size - memberCount;

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Palette.amberDeep} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 요약 배너 */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNum}>{groupMap.size}</Text>
              <Text style={styles.summaryLabel}>전체 손님</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNum, { color: Palette.success }]}>
                {memberCount}
              </Text>
              <Text style={styles.summaryLabel}>회원</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNum, { color: Palette.inkFaint }]}>
                {unregisteredCount}
              </Text>
              <Text style={styles.summaryLabel}>미등록</Text>
            </View>
          </View>

          {/* 검색 */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={Palette.inkFaint} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="이름 또는 전화번호로 검색"
              placeholderTextColor={Palette.inkFaint}
            />
          </View>

          {/* 필터 탭 */}
          <View style={styles.filterRow}>
            {[
              { key: "all" as const, label: "전체" },
              { key: "member" as const, label: "회원" },
              { key: "unregistered" as const, label: "미등록" },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterTab,
                  filter === f.key && styles.filterTabActive,
                ]}
                onPress={() => setFilter(f.key)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    filter === f.key && styles.filterTabTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {customers.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="people-outline" size={40} color={Palette.line} />
              <Text style={styles.emptyText}>표시할 손님이 없습니다.</Text>
            </View>
          ) : (
            customers.map((c) => (
              <TouchableOpacity
                key={c.phone}
                style={styles.customerCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push(
                    `/admin/user-detail?phone=${encodeURIComponent(c.phone)}&name=${encodeURIComponent(c.name)}&loginId=${encodeURIComponent(c.loginId ?? "")}` as any,
                  )
                }
              >
                <View style={styles.customerAvatar}>
                  <Ionicons
                    name={c.isMember ? "person" : "person-outline"}
                    size={18}
                    color={c.isMember ? Palette.white : Palette.inkFaint}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.customerNameRow}>
                    <Text style={styles.customerName}>{c.name}</Text>
                    <View
                      style={[
                        styles.badge,
                        c.isMember ? styles.badgeMember : styles.badgeGuest,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          c.isMember
                            ? styles.badgeTextMember
                            : styles.badgeTextGuest,
                        ]}
                      >
                        {c.isMember ? "회원" : "미등록"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.customerPhone}>{c.phone}</Text>
                  <Text style={styles.customerMeta}>
                    예약 {c.reservationCount}건 · 최근 {c.lastDate}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Palette.inkFaint}
                />
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { padding: Spacing.lg },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: Spacing.sm,
  },
  emptyText: { color: Palette.inkFaint, fontSize: 13 },

  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    ...Shadow.card,
  },
  summaryNum: { fontSize: 20, fontWeight: "800", color: Palette.ink },
  summaryLabel: { fontSize: 11, color: Palette.inkFaint, marginTop: 2 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.sm + 4,
    ...Shadow.card,
  },
  searchInput: { flex: 1, fontSize: 14, color: Palette.ink },

  filterRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: Spacing.lg,
  },
  filterTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
    backgroundColor: Palette.creamDim,
  },
  filterTabActive: { backgroundColor: Palette.charcoal },
  filterTabText: { fontSize: 12.5, fontWeight: "700", color: Palette.inkSoft },
  filterTabTextActive: { color: Palette.cream },

  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 4,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.amberDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  customerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  customerName: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  badgeMember: { backgroundColor: "rgba(91,123,90,0.14)" },
  badgeGuest: { backgroundColor: Palette.creamDim },
  badgeText: { fontSize: 10, fontWeight: "700" },
  badgeTextMember: { color: Palette.success },
  badgeTextGuest: { color: Palette.inkFaint },
  customerPhone: { fontSize: 12.5, color: Palette.inkSoft, marginTop: 3 },
  customerMeta: { fontSize: 11, color: Palette.inkFaint, marginTop: 2 },
});
