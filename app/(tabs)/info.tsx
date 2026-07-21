// app/(tabs)/info.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

// 매장 실사 슬라이드 이미지 3장 — 경로는 프로젝트의 실제 assets 폴더 구조에 맞춰 조정해 주세요.
const HEADER_SLIDES = [
  require("@/assets/seat_images/slide_1.png"),
  require("@/assets/seat_images/slide_2.jpg"),
  require("@/assets/seat_images/slide_3.jpg"),
  require("@/assets/seat_images/slide_4.jpg"),
];

const SLIDE_INTERVAL_MS = 4000;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

function HeaderSlider() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // 4초마다 자동으로 다음 슬라이드로 넘어감 (마지막에서 다시 처음으로 순환)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % HEADER_SLIDES.length;
        scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
        return next;
      });
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const handleScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View style={styles.imageContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {HEADER_SLIDES.map((src, idx) => (
          <Image key={idx} source={src} style={styles.mainImage} />
        ))}
      </ScrollView>

      <View style={styles.imageOverlay} pointerEvents="none">
        <SafeAreaView edges={["top"]} />
        <View style={styles.overlayBottom}>
          <Text style={styles.overlayTitle}>팔공산 30년 전통의 깊이</Text>
          <Text style={styles.overlaySubtitle}>성공식당</Text>

          {/* 점 인디케이터 */}
          <View style={styles.dotsRow}>
            {HEADER_SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, idx === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function FacilityItem({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.facilityItem}>
      <View style={styles.facilityIconContainer}>
        <Ionicons name={icon} size={20} color={Palette.amberDeep} />
      </View>
      <Text style={styles.facilityLabel}>{label}</Text>
    </View>
  );
}

export default function InfoScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Cover image — 자동 슬라이드 */}
        <HeaderSlider />

        {/* Introduction */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="ribbon-outline"
              size={20}
              color={Palette.amberDeep}
            />
            <Text style={styles.sectionTitle}>소개</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.quote}>
              "팔공산 30년 전통의 깊이를 이어오다"
            </Text>
            <Text style={styles.description}>
              팔공산 자락 아래에서 30년 동안 한자리를 지켜온 성공식당은 3대째
              이어져 내려오는 전통 있는 맛집입니다.{"\n\n"}
              오랜 세월 지역 주민은 물론 팔공산을 찾는 등산객들의 꾸준한 사랑을
              받아왔으며, 가족모임이나 단체모임 장소로도 자주 선택되어 온
              곳입니다.{"\n\n"}
              화려함보다 정직한 재료와 변함없는 손맛으로 식당의 명맥을 이어오고
              있으며, 오늘도 정성껏 준비합니다.
            </Text>
          </View>
        </View>

        {/* Menu highlights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="restaurant-outline"
              size={20}
              color={Palette.amberDeep}
            />
            <Text style={styles.sectionTitle}>성공식당의 맛</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.menuName}>맑고 깊은 [능이오리백숙]</Text>
            <Text style={styles.description}>
              약재 향이 강한 한방백숙과는 결이 다릅니다. 능이버섯 고유의 은은한
              향을 살려 남녀노소 누구나 편안하게 즐길 수 있도록 완성했습니다.
              {"\n\n"}
              48시간 이상 정성껏 우려낸 육수는 맑고 깔끔하면서도 깊은 감칠맛을
              지녀, 가족 외식이나 점심 식사로도 부담 없이 선택하실 수 있습니다.
            </Text>
          </View>
          <View style={[styles.card, { marginTop: Spacing.md }]}>
            <Text style={styles.menuName}>정성을 담은 [밑반찬]</Text>
            <Text style={styles.description}>
              모든 밑반찬은 지역에서 공수한 우수한 재료로 직접 담급니다.
              대한민국 국산김치 인증을 받은 김치를 비롯해, 반찬 하나까지 허투루
              하지 않는 손맛은 우리의 자랑입니다.
            </Text>
          </View>
        </View>

        {/* Facilities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="apps-outline" size={20} color={Palette.amberDeep} />
            <Text style={styles.sectionTitle}>편의시설 및 서비스</Text>
          </View>
          <View style={styles.facilitiesGrid}>
            <FacilityItem icon="people-outline" label="단체 이용" />
            <FacilityItem icon="bag-outline" label="포장 가능" />
            <FacilityItem icon="woman-outline" label="남/녀 화장실" />
            <FacilityItem icon="calendar-outline" label="예약 가능" />
            <FacilityItem icon="accessibility-outline" label="유아의자" />
            <FacilityItem icon="paw-outline" label="반려동물" />
            <FacilityItem icon="wifi-outline" label="무선 인터넷" />
            <FacilityItem icon="car-outline" label="주차 가능" />
            <FacilityItem icon="body-outline" label="휠체어 이용" />
          </View>
        </View>

        {/* Seats & rooms */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={20} color={Palette.amberDeep} />
            <Text style={styles.sectionTitle}>좌석 및 공간</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.seatRow}>
              <Text style={styles.seatType}>룸</Text>
              <Text style={styles.seatValue}>최소 2명 ~ 최대 80명</Text>
            </View>
            <View style={styles.seatRow}>
              <Text style={styles.seatType}>단체석</Text>
              <Text style={styles.seatValue}>최소 8명 ~ 최대 80명</Text>
            </View>
            <View style={[styles.seatRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.seatType}>입식</Text>
              <Text style={styles.seatValue}>홀 테이블 완비</Text>
            </View>
          </View>
        </View>

        {/* Directions & parking */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="map-outline" size={20} color={Palette.amberDeep} />
            <Text style={styles.sectionTitle}>오시는 길 및 주차</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.infoSubTitle}>주차 안내</Text>
            <Text style={styles.description}>
              매장 앞 약 30대 무료 주차 가능. 만차 시 인근 길가 주차 가능.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.infoSubTitle}>자차 이용</Text>
            <Text style={styles.description}>
              네비 '팔공산 성공식당' 또는 '팔공산로 199길 12(39-9)' 검색
            </Text>

            <View style={styles.divider} />

            <Text style={styles.infoSubTitle}>대중교통</Text>
            <Text style={styles.description}>
              급행 1번 버스 → 동화사 입구 하차 후 분수대 방향 50m
            </Text>
          </View>
        </View>

        {/* Certification & payment */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.ansimContainer}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={Palette.success}
              />
              <Text style={styles.ansimText}>
                농림축산식품부 제공 [안심식당] 인증
              </Text>
            </View>
            <View style={styles.paymentContainer}>
              <Text style={styles.paymentLabel}>결제 수단</Text>
              <Text style={styles.paymentValue}>지역화폐, 제로페이 가능</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  imageContainer: {
    width: "100%",
    height: 260,
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: 260,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "space-between",
    backgroundColor: "rgba(26,22,20,0.32)",
  },
  overlayBottom: {
    padding: Spacing.lg,
  },
  overlayTitle: {
    color: Palette.cream,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  overlaySubtitle: {
    color: Palette.cream,
    fontSize: 30,
    fontWeight: "700",
    marginTop: 2,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    backgroundColor: Palette.gold,
    width: 18,
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
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
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  quote: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.amberDeep,
    marginBottom: Spacing.sm + 2,
    fontStyle: "italic",
  },
  description: {
    fontSize: 13,
    color: Palette.inkSoft,
    lineHeight: 21,
  },
  menuName: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm,
  },
  facilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  facilityItem: {
    width: "33%",
    alignItems: "center",
    paddingVertical: Spacing.sm + 4,
  },
  facilityIconContainer: {
    width: 42,
    height: 42,
    backgroundColor: Palette.white,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  facilityLabel: {
    fontSize: 11,
    color: Palette.ink,
    fontWeight: "500",
  },
  seatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  seatType: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.ink,
  },
  seatValue: {
    fontSize: 13,
    color: Palette.inkSoft,
  },
  infoSubTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.line,
    marginVertical: Spacing.md,
  },
  ansimContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(91,123,90,0.1)",
    padding: Spacing.sm + 2,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm + 2,
  },
  ansimText: {
    fontSize: 12,
    color: Palette.success,
    fontWeight: "600",
  },
  paymentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentLabel: {
    fontSize: 13,
    color: Palette.ink,
    fontWeight: "600",
  },
  paymentValue: {
    fontSize: 13,
    color: Palette.amberDeep,
    fontWeight: "700",
  },
});
