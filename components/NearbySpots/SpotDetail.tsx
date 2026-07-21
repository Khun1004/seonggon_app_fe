// components/NearbySpots/SpotDetail.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getNearbySpots, NearbySpot } from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

export default function SpotDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [spot, setSpot] = useState<NearbySpot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNearbySpots()
      .then((spots) => {
        const found = spots.find((s) => String(s.id) === String(id));
        setSpot(found ?? null);
      })
      .catch(() => setSpot(null))
      .finally(() => setLoading(false));
  }, [id]);

  const openMap = () => {
    if (!spot) return;
    const query = encodeURIComponent(`팔공산 ${spot.name}`);
    Linking.openURL(`https://map.naver.com/p/search/${query}`).catch(() => {});
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={Palette.amberDeep} />
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notFoundText}>명소 정보를 찾을 수 없습니다.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.notFoundLink}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.imageContainer}>
          {spot.imageUrl ? (
            <Image
              source={{ uri: spot.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons
                name={(spot.icon as any) || "location-outline"}
                size={40}
                color={Palette.amberDeep}
              />
            </View>
          )}

          <SafeAreaView style={styles.headerOverlay} edges={["top"]}>
            <TouchableOpacity
              style={styles.roundBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={20} color={Palette.ink} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.eyebrow}>AROUND PALGONGSAN</Text>
          <Text style={styles.title}>{spot.name}</Text>
          <Text style={styles.description}>{spot.description}</Text>

          <TouchableOpacity style={styles.mapBtn} onPress={openMap}>
            <Ionicons name="map-outline" size={16} color={Palette.white} />
            <Text style={styles.mapBtnText}>네이버 지도에서 길찾기</Text>
          </TouchableOpacity>

          <View style={styles.noteBox}>
            <Ionicons
              name="information-circle"
              size={16}
              color={Palette.gold}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.noteText}>
              성공식당에서 식사 전후로 들러보기 좋은 팔공산 명소예요. 사진은
              네이버에 다른 분들이 올려주신 사진을 가져온 거예요.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { paddingBottom: 20 },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Palette.cream,
  },
  notFoundText: { fontSize: 14, color: Palette.inkFaint },
  notFoundLink: {
    fontSize: 14,
    color: Palette.amberDeep,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  imageContainer: {
    width: "100%",
    height: 260,
    backgroundColor: Palette.creamDim,
  },
  heroImage: { width: "100%", height: "100%" },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.white,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.card,
  },

  contentContainer: { padding: Spacing.lg },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm + 4,
  },
  description: {
    fontSize: 14,
    color: Palette.inkSoft,
    lineHeight: 21,
    marginBottom: Spacing.xl,
  },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Palette.amberDeep,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  mapBtnText: { color: Palette.white, fontSize: 15, fontWeight: "700" },

  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(182,138,78,0.12)",
    padding: Spacing.sm + 4,
    borderRadius: Radius.sm,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: Palette.amberDeep,
    fontWeight: "600",
    lineHeight: 17,
  },
});
