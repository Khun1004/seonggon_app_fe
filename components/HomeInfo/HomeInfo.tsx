// components/HomeInfo/HomeInfo.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  ClosedDate,
  getReviewStats,
  getStoreProfile,
  getUpcomingClosedDates,
  ReviewStats,
  StoreProfile,
} from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// 시:분 문자열("11:00")과 지금 시각을 비교하기 위해, 오늘 날짜 기준
// Date 객체로 바꿔줍니다.
function timeStrToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function HomeInfo() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StoreProfile | null>(null);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getStoreProfile(), getUpcomingClosedDates(), getReviewStats()])
      .then(([p, closures, stats]) => {
        setProfile(p);
        setClosedDates(closures);
        setReviewStats(stats);
      })
      .catch(() => {
        // 못 불러와도 화면이 죽지 않도록 조용히 무시 (아래에서 로딩만 풀어줌)
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const closedDateSet = new Set(closedDates.map((c) => c.date));

  // 오늘부터 6일 뒤까지, 실제 날짜와 요일을 계산해서 영업시간표를 만듭니다.
  // 관리자가 등록한 휴무일이면 그 요일 칸에 "휴무"로 표시돼요.
  const today = new Date();
  const weekRows = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = toDateStr(d);
    return {
      dateStr,
      day: WEEKDAY_LABELS[d.getDay()],
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      isToday: i === 0,
      isClosed: closedDateSet.has(dateStr),
    };
  });

  const getStatus = () => {
    const todayStr = toDateStr(today);
    if (closedDateSet.has(todayStr)) {
      return { text: "휴무", color: Palette.error, bg: "rgba(162,62,62,0.1)" };
    }
    if (!profile) {
      return {
        text: "영업 중",
        color: Palette.success,
        bg: "rgba(91,123,90,0.12)",
      };
    }
    const nowMin = today.getHours() * 60 + today.getMinutes();
    const openMin = timeStrToMinutes(profile.openTime);
    const closeMin = timeStrToMinutes(profile.closeTime);
    if (nowMin >= openMin && nowMin < closeMin) {
      return {
        text: "영업 중",
        color: Palette.success,
        bg: "rgba(91,123,90,0.12)",
      };
    }
    return {
      text: "영업 종료",
      color: Palette.error,
      bg: "rgba(162,62,62,0.1)",
    };
  };

  const status = getStatus();

  const makeCall = () => {
    if (!profile) return;
    Linking.openURL(`tel:${profile.phone}`).catch(() => {
      Alert.alert("에러", "전화 걸기 기능을 실행할 수 없습니다.");
    });
  };

  const copyAddress = async () => {
    if (!profile) return;
    await Clipboard.setStringAsync(profile.address);
    Alert.alert("알림", "주소가 클립보드에 복사되었습니다.");
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingBox]}>
        <ActivityIndicator color={Palette.amberDeep} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Business Hours */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="time-outline"
                size={18}
                color={Palette.amberDeep}
              />
              <Text style={styles.sectionTitle}>영업시간</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.text}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            {weekRows.map((item, index) => (
              <View
                key={item.dateStr}
                style={[
                  styles.hourRow,
                  index === weekRows.length - 1 && { borderBottomWidth: 0 },
                  item.isToday && styles.todayRow,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    item.isToday && { color: Palette.amberDeep },
                  ]}
                >
                  {item.day}
                </Text>
                <View style={styles.timeInfo}>
                  {item.isClosed ? (
                    <Text
                      style={[
                        styles.timeText,
                        { color: Palette.error, fontWeight: "700" },
                      ]}
                    >
                      휴무
                    </Text>
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.timeText,
                          item.isToday && { fontWeight: "700" },
                        ]}
                      >
                        {profile
                          ? `${profile.openTime} - ${profile.closeTime}`
                          : "-"}
                      </Text>
                      <Text style={styles.lastOrderText}>
                        {profile ? `${profile.lastOrderTime} 라스트오더` : ""}
                      </Text>
                    </>
                  )}
                </View>
                {item.isToday && (
                  <View style={styles.todayIndicator}>
                    <Text style={styles.todayBadgeText}>오늘</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Directions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="map-outline" size={18} color={Palette.amberDeep} />
            <Text style={styles.sectionTitle}>찾아오는 길</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.directionItem}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>자차 / 네비</Text>
              </View>
              <Text style={styles.directionText}>
                '성공식당' 검색 또는 '대구 동구 팔공산로 199길 12 (39-9)'
                검색하시고 오시면 됩니다.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.directionItem}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>버스</Text>
              </View>
              <Text style={styles.directionText}>
                '급행 1번' 버스를 타고 '동화사 입구' 정류장에서 하차 후, 공원을
                가로질러 분수대 방향으로 약 50m 정도 내려오시면 있습니다.
              </Text>
            </View>
          </View>
        </View>

        {/* Reviews summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="star" size={18} color={Palette.gold} />
            <Text style={styles.sectionTitle}>리뷰 및 별점</Text>
          </View>
          <View style={styles.card}>
            {/* 앱 방문자 리뷰 — 실제 앱 안에서 쓴 리뷰 데이터 */}
            <View style={styles.reviewSourceRow}>
              <View style={[styles.sourceBadge, styles.appBadge]}>
                <Ionicons name="restaurant" size={12} color={Palette.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sourceLabel}>앱 방문자 리뷰</Text>
                <View style={styles.ratingSummary}>
                  <Text style={styles.totalRating}>
                    {reviewStats ? reviewStats.averageRating.toFixed(2) : "-"}
                  </Text>
                  <View style={{ marginLeft: Spacing.sm }}>
                    <View style={{ flexDirection: "row", gap: 1 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name="star"
                          size={12}
                          color={Palette.gold}
                        />
                      ))}
                    </View>
                    <Text style={styles.ratingCount}>
                      리뷰 {reviewStats ? reviewStats.totalCount : 0}개
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 네이버 방문자 리뷰 — 사장님이 직접 입력한 값 */}
            {profile?.naverRating != null && (
              <>
                <View style={styles.divider} />
                <View style={styles.reviewSourceRow}>
                  <View style={[styles.sourceBadge, styles.naverBadge]}>
                    <Text style={styles.naverBadgeText}>N</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sourceLabel}>네이버 방문자 리뷰</Text>
                    <Text style={styles.sourceValueText}>
                      {profile.naverRating.toFixed(2)}점
                      {profile.naverReviewCount != null &&
                        ` · 리뷰 ${profile.naverReviewCount.toLocaleString()}개`}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* 블로그 리뷰 — 사장님이 직접 입력한 값 */}
            {profile?.blogReviewCount != null && (
              <>
                <View style={styles.divider} />
                <View style={styles.reviewSourceRow}>
                  <View style={[styles.sourceBadge, styles.blogBadge]}>
                    <Ionicons
                      name="document-text"
                      size={12}
                      color={Palette.white}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sourceLabel}>블로그 리뷰</Text>
                    <Text style={styles.sourceValueText}>
                      {profile.blogReviewCount.toLocaleString()}개
                    </Text>
                  </View>
                </View>
              </>
            )}

            {reviewStats && reviewStats.highlightQuotes.length > 0 && (
              <>
                <View style={styles.divider} />
                {reviewStats.highlightQuotes.map((q, idx) => (
                  <Text key={idx} style={styles.reviewQuote}>
                    "{q}"
                  </Text>
                ))}
              </>
            )}
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.contactRow} onPress={copyAddress}>
            <View style={styles.contactIcon}>
              <Ionicons name="location" size={18} color={Palette.amberDeep} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm + 4 }}>
              <Text style={styles.contactLabel}>주소</Text>
              <Text style={styles.contactValue}>{profile?.address ?? "-"}</Text>
            </View>
            <Text style={styles.actionBadge}>복사</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactRow, { marginTop: Spacing.sm + 4 }]}
            onPress={makeCall}
          >
            <View style={styles.contactIcon}>
              <Ionicons name="call" size={18} color={Palette.amberDeep} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm + 4 }}>
              <Text style={styles.contactLabel}>안내 및 예약</Text>
              <Text style={styles.contactValue}>{profile?.phone ?? "-"}</Text>
            </View>
            <Text style={styles.actionBadge}>전화</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  loadingBox: { justifyContent: "center", alignItems: "center" },
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
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm + 4,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm + 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.ink,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  hourRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  todayRow: {
    backgroundColor: "rgba(201,98,46,0.04)",
  },
  todayIndicator: {
    backgroundColor: Palette.amber,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 10,
    color: Palette.white,
    fontWeight: "700",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
    width: 30,
  },
  timeInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  timeText: {
    fontSize: 14,
    color: Palette.ink,
    fontWeight: "500",
  },
  lastOrderText: {
    fontSize: 12,
    color: Palette.amberDeep,
    marginTop: 2,
  },
  directionItem: {
    paddingVertical: 5,
  },
  tag: {
    backgroundColor: Palette.creamDim,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.inkSoft,
  },
  directionText: {
    fontSize: 13,
    lineHeight: 21,
    color: Palette.inkSoft,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.line,
    marginVertical: Spacing.md,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.white,
    padding: Spacing.md,
    borderRadius: Radius.md,
    ...Shadow.card,
  },
  contactIcon: {
    width: 38,
    height: 38,
    backgroundColor: Palette.amberSoft,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  contactLabel: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  actionBadge: {
    backgroundColor: Palette.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    fontSize: 12,
    fontWeight: "700",
    color: Palette.amberDeep,
    borderWidth: 1,
    borderColor: Palette.amber,
    overflow: "hidden",
  },
  ratingSummary: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  reviewSourceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm + 2,
    paddingVertical: 2,
  },
  sourceBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  appBadge: { backgroundColor: Palette.amberDeep },
  naverBadge: { backgroundColor: "#03C75A" },
  blogBadge: { backgroundColor: "#8B7CDB" },
  naverBadgeText: { fontSize: 12, fontWeight: "800", color: Palette.white },
  sourceLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkFaint,
    marginBottom: 2,
  },
  sourceValueText: { fontSize: 14, fontWeight: "700", color: Palette.ink },
  totalRating: {
    fontSize: 30,
    fontWeight: "700",
    color: Palette.ink,
  },
  ratingCount: {
    fontSize: 11,
    color: Palette.inkFaint,
    marginTop: 4,
  },
  reviewQuote: {
    fontSize: 13,
    color: Palette.ink,
    lineHeight: 20,
    fontStyle: "italic",
    marginBottom: 10,
    paddingLeft: Spacing.sm + 2,
    borderLeftWidth: 2,
    borderLeftColor: Palette.gold,
  },
});
