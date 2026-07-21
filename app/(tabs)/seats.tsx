// app/(tabs)/seats.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getGroupCapacityRange,
  RoomsContext,
} from "@/components/contexts/RoomsContext";
import { getStoreInfo, StoreInfoSection } from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const TAB_OPTIONS = ["1층 자리", "2층 자리", "주차"] as const;
type TabOption = (typeof TAB_OPTIONS)[number];

function SeatCard({
  title,
  count,
  capacity,
  icon,
  isRoom = true,
  note = "",
  seatNumbers,
  onDetailPress,
}: {
  title: string;
  count?: number | null;
  capacity: string;
  icon: keyof typeof Ionicons.glyphMap;
  isRoom?: boolean;
  note?: string;
  seatNumbers?: string[];
  onDetailPress?: () => void;
}) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        disabled={!onDetailPress}
        onPress={onDetailPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardTitleRow}>
          <View style={styles.cardIconCircle}>
            <Ionicons name={icon} size={18} color={Palette.amberDeep} />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
          {count != null && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{count}개</Text>
            </View>
          )}
        </View>
        {onDetailPress && (
          <Ionicons name="chevron-forward" size={20} color={Palette.inkFaint} />
        )}
      </TouchableOpacity>

      {seatNumbers && seatNumbers.length > 0 && (
        <View style={styles.seatNumberRow}>
          {seatNumbers.map((n) => (
            <View key={n} style={styles.seatNumberChip}>
              <Text style={styles.seatNumberText}>{n}번</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.specRow}>
          <Ionicons name="people-outline" size={15} color={Palette.inkFaint} />
          <Text style={styles.specText}>권장 인원: {capacity}</Text>
        </View>
        <View style={styles.specRow}>
          <Ionicons
            name="location-outline"
            size={15}
            color={Palette.inkFaint}
          />
          <Text style={styles.specText}>
            {isRoom ? "독립된 프라이빗 룸" : "넓고 탁 트인 홀 좌석"}
          </Text>
        </View>
      </View>

      {note ? (
        <View style={styles.noteBox}>
          <Ionicons
            name="information-circle"
            size={16}
            color={Palette.gold}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.noteText}>{note}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function Seats() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabOption>("1층 자리");
  const { rooms, refreshRooms } = useContext(RoomsContext);
  const [directionsInfo, setDirectionsInfo] = useState<StoreInfoSection[]>([]);

  // 이 화면에 들어올 때마다 좌석 정보와 "오시는 길·주차" 안내 문구를 새로
  // 불러와요 — 관리자가 방금 좌석을 추가하거나 사진·안내 문구를 바꿨어도
  // 앱을 껐다 켜지 않고 바로 반영돼요.
  useFocusEffect(
    useCallback(() => {
      refreshRooms();
      getStoreInfo()
        .then((all) =>
          setDirectionsInfo(
            all
              .filter((s) => s.group === "directions" && s.active)
              .sort((a, b) => a.displayOrder - b.displayOrder),
          ),
        )
        .catch(() => {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // 카테고리별로 지금 실제 등록된 좌석 개수·번호·인원수 범위를 계산합니다.
  // 관리자가 좌석을 추가/삭제/수정하면 이 화면에도 바로 반영돼요.
  const byCategory = (category: string) => {
    const items = rooms.filter((r) => r.category === category);
    return {
      count: items.length,
      seatNumbers: items.map((r) => r.number),
      capacity: getGroupCapacityRange(items) || "-",
    };
  };

  const renderContent = () => {
    switch (activeTab) {
      case "1층 자리":
        return (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.sectionIntro}>
              <Text style={styles.sectionTitle}>1층 좌석 안내</Text>
              <Text style={styles.sectionSub}>
                아늑한 룸과 접근성이 좋은 1층입니다.
              </Text>
            </View>

            <SeatCard
              title="일반 홀 좌석"
              count={byCategory("hall").count}
              capacity={`${byCategory("hall").capacity} (테이블당 다름)`}
              icon="restaurant-outline"
              isRoom={false}
              seatNumbers={byCategory("hall").seatNumbers}
              onDetailPress={() =>
                router.push("/room-detail?category=hall" as any)
              }
            />
            <SeatCard
              title="프라이빗 룸 (소형)"
              count={byCategory("small").count}
              capacity={byCategory("small").capacity}
              icon="home-outline"
              note="신발을 벗고 들어가는 룸입니다."
              seatNumbers={byCategory("small").seatNumbers}
              onDetailPress={() =>
                router.push("/room-detail?category=small" as any)
              }
            />
            <SeatCard
              title="프라이빗 룸 (중형)"
              count={byCategory("medium").count}
              capacity={byCategory("medium").capacity}
              icon="home-outline"
              note="신발을 벗고 들어가는 룸입니다."
              seatNumbers={byCategory("medium").seatNumbers}
              onDetailPress={() =>
                router.push("/room-detail?category=medium" as any)
              }
            />
            <SeatCard
              title="프라이빗 룸 (대형)"
              count={byCategory("large").count}
              capacity={byCategory("large").capacity}
              icon="home-outline"
              note="대형 룸은 신발을 신고 편하게 이용하실 수 있습니다. 예약 상황에 따라 7번 · 8번 · 9번 룸이 함께 배정될 수 있습니다."
              seatNumbers={byCategory("large").seatNumbers}
              onDetailPress={() =>
                router.push("/room-detail?category=large" as any)
              }
            />

            <TouchableOpacity
              style={styles.reserveBtn}
              onPress={() => router.push("/reservation" as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar" size={16} color={Palette.white} />
              <Text style={styles.reserveBtnText}>원하는 자리로 예약하기</Text>
            </TouchableOpacity>
            <Text style={styles.reserveHint}>
              1회 이용 시간은 1시간이며, 좌석은 예약 화면에서 직접 선택하실 수
              있어요. 최종 확정은 사장님이 전화로 안내드립니다.
            </Text>

            <View style={{ height: 120 }} />
          </ScrollView>
        );

      case "2층 자리":
        return (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.sectionIntro}>
              <Text style={styles.sectionTitle}>2층 단체 좌석 안내</Text>
              <Text style={styles.sectionSub}>
                회식 및 단체 모임에 최적화된 공간입니다.
              </Text>
            </View>

            <SeatCard
              title="단체 룸 (소형)"
              count={byCategory("group_room").count}
              capacity={byCategory("group_room").capacity}
              icon="home-outline"
              note="회식 및 소모임에 알맞은 룸입니다."
              seatNumbers={byCategory("group_room").seatNumbers}
              onDetailPress={() =>
                router.push("/room-detail?category=group_room" as any)
              }
            />
            <SeatCard
              title="단체 룸 (대형)"
              count={byCategory("group_large").count}
              capacity={byCategory("group_large").capacity}
              icon="home-outline"
              note="단체 회식, 모임에 적합한 넓은 룸입니다."
              seatNumbers={byCategory("group_large").seatNumbers}
              onDetailPress={() =>
                router.push("/room-detail?category=group_large" as any)
              }
            />
            <SeatCard
              title="대형 홀 (단체석)"
              count={byCategory("group_hall").count}
              capacity={`${byCategory("group_hall").capacity} (전체 대관 가능)`}
              icon="restaurant-outline"
              isRoom={false}
              note="기업 회식, 대가족 모임 등 단체 예약시 홀 전체를 사용하실 수 있습니다."
              seatNumbers={byCategory("group_hall").seatNumbers}
              onDetailPress={() =>
                router.push("/room-detail?category=group_hall" as any)
              }
            />

            <View style={{ height: 120 }} />
          </ScrollView>
        );

      case "주차":
        return (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.sectionIntro}>
              <Text style={styles.sectionTitle}>주차장 안내</Text>
              <Text style={styles.sectionSub}>
                방문객 여러분을 위한 주차 정보를 안내해 드립니다.
              </Text>
            </View>

            <Image
              source={require("@/assets/seat_images/CarParking.jpg")}
              style={styles.parkingImage}
              resizeMode="cover"
            />

            <View style={styles.parkingCard}>
              <View style={styles.parkingIconCircle}>
                <Ionicons name="car" size={28} color={Palette.amberDeep} />
              </View>
              <Text style={styles.parkingTitle}>매장 전용 주차장 보유</Text>

              {directionsInfo.length === 0 ? (
                <Text style={styles.parkingListText}>
                  안내 문구를 불러오는 중이에요...
                </Text>
              ) : (
                <View style={styles.parkingList}>
                  {directionsInfo.map((section) => (
                    <View key={section.id} style={styles.parkingListItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={Palette.amber}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.parkingSubTitle}>
                          {section.title}
                        </Text>
                        <Text style={styles.parkingListText}>
                          {section.content}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Dark header — MyPage 스타일과 통일 */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <Text style={styles.eyebrow}>FLOOR & PARKING</Text>
          <Text style={styles.headerTitle}>좌석 및 주차</Text>

          <View style={styles.tabContainer}>
            {TAB_OPTIONS.map((tab) => (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                style={[
                  styles.tabButton,
                  activeTab === tab && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === tab && styles.tabButtonTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.contentArea}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  header: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Palette.cream,
    marginBottom: Spacing.lg,
  },
  tabContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  tabButtonActive: {
    backgroundColor: Palette.amber,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#C9BFAE",
  },
  tabButtonTextActive: {
    color: Palette.white,
    fontWeight: "700",
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionIntro: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: Palette.inkFaint,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  cardIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.amberSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
    flexShrink: 1,
  },
  countBadge: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginLeft: Spacing.sm,
  },
  countText: {
    color: Palette.cream,
    fontSize: 11,
    fontWeight: "700",
  },
  seatNumberRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: Spacing.md,
  },
  seatNumberChip: {
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.amber,
  },
  seatNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  reserveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Palette.amberDeep,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
    ...Shadow.card,
  },
  reserveBtnText: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: "700",
  },
  reserveHint: {
    fontSize: 11,
    color: Palette.inkFaint,
    textAlign: "center",
    marginTop: Spacing.sm + 4,
    lineHeight: 16,
  },
  cardBody: {
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    padding: Spacing.sm + 4,
    gap: 6,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  specText: {
    fontSize: 13,
    color: Palette.inkSoft,
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(182,138,78,0.12)",
    padding: Spacing.sm + 4,
    borderRadius: Radius.sm,
    marginTop: Spacing.md,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: Palette.amberDeep,
    fontWeight: "600",
    lineHeight: 17,
  },
  parkingImage: {
    width: "100%",
    height: 180,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  parkingCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    alignItems: "center",
    padding: Spacing.xl,
    ...Shadow.card,
  },
  parkingIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.amberSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  parkingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.lg,
  },
  parkingList: {
    width: "100%",
    gap: Spacing.sm + 4,
  },
  parkingListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Palette.creamDim,
    padding: Spacing.sm + 4,
    borderRadius: Radius.md,
    gap: Spacing.sm + 2,
  },
  parkingSubTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: 2,
  },
  parkingListText: {
    flex: 1,
    fontSize: 13,
    color: Palette.inkSoft,
    lineHeight: 19,
  },
});
