// components/Takeout/TakeoutInfo.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MENU_DATA, resolveImageSource } from "@/constants/menu-data";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const RESTAURANT_PHONE = "0507-1410-7634";

export default function TakeoutInfo() {
  const router = useRouter();

  const handleCall = () => {
    Linking.openURL(`tel:${RESTAURANT_PHONE}`).catch(() => {
      Alert.alert("알림", "전화 걸기 기능을 실행할 수 없습니다.");
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introCard}>
          <Ionicons name="bag-handle" size={26} color={Palette.amberDeep} />
          <Text style={styles.introTitle}>포장 주문 안내</Text>
          <Text style={styles.introText}>
            아래 메뉴 중 원하시는 걸 골라 앱에서 바로 주문하시거나, 전화로도
            접수해 드려요. (앱 주문은 로그인이 필요해요)
          </Text>
          <TouchableOpacity
            style={styles.appOrderBtn}
            onPress={() => router.push("/reservation?mode=takeout" as any)}
          >
            <Ionicons name="bag-handle" size={16} color={Palette.white} />
            <Text style={styles.appOrderBtnText}>앱에서 포장 주문하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call" size={16} color={Palette.amberDeep} />
            <Text style={styles.callBtnText}>전화로 포장 주문하기</Text>
          </TouchableOpacity>
        </View>

        {Object.entries(MENU_DATA).map(([category, items]) => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>{category}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemImageWrap}>
                  {item.image ? (
                    <Image
                      source={resolveImageSource(item.image) ?? undefined}
                      style={styles.itemImage}
                    />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <Ionicons
                        name="restaurant-outline"
                        size={18}
                        color={Palette.amberDeep}
                      />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{item.price}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  scrollContent: { padding: Spacing.lg },

  introCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.ink,
    marginTop: Spacing.sm,
    marginBottom: 6,
  },
  introText: {
    fontSize: 12,
    color: Palette.inkSoft,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  appOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Palette.amberDeep,
    paddingVertical: Spacing.sm + 6,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    width: "100%",
    marginBottom: Spacing.sm,
  },
  appOrderBtnText: { color: Palette.white, fontSize: 14, fontWeight: "700" },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: Palette.amberDeep,
    paddingVertical: Spacing.sm + 6,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    width: "100%",
  },
  callBtnText: { color: Palette.amberDeep, fontSize: 14, fontWeight: "700" },

  section: { marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm + 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 4,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  itemImageWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    overflow: "hidden",
    backgroundColor: Palette.creamDim,
  },
  itemImage: { width: "100%", height: "100%" },
  itemImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: { fontSize: 14, fontWeight: "600", color: Palette.ink },
  itemPrice: { fontSize: 12, color: Palette.amberDeep, marginTop: 2 },
});
