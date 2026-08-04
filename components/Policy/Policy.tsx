// components/Policy/Policy.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getPolicySections, PolicySection } from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

export default function Policy() {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");
  const [sections, setSections] = useState<PolicySection[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getPolicySections(activeTab)
        .then(setSections)
        .catch(() => setSections([]))
        .finally(() => setLoading(false));
    }, [activeTab]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === "terms" && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab("terms")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "terms" && styles.tabTextActive,
            ]}
          >
            이용약관
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === "privacy" && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab("privacy")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "privacy" && styles.tabTextActive,
            ]}
          >
            개인정보 처리방침
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.disclaimerBox}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={Palette.inkFaint}
          />
          <Text style={styles.disclaimerText}>
            본 내용은 일반적인 양식이며, 시행일은 추후 매장 운영자가 확정하여
            게시합니다.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            color={Palette.amberDeep}
            style={{ marginTop: Spacing.xl }}
          />
        ) : sections.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="document-text-outline"
              size={28}
              color={Palette.inkFaint}
            />
            <Text style={styles.emptyText}>등록된 내용이 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.policyCard}>
            {sections.map((section, idx) => (
              <View
                key={section.id}
                style={[
                  styles.sectionWrap,
                  idx !== sections.length - 1 && styles.sectionBorder,
                ]}
              >
                <Text style={styles.sectionHeading}>{section.heading}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: Palette.ink },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.white,
    borderRadius: Radius.pill,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: Radius.pill,
  },
  tabItemActive: {
    backgroundColor: Palette.charcoal,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Palette.inkSoft,
  },
  tabTextActive: {
    color: Palette.cream,
  },

  scrollContent: { paddingHorizontal: Spacing.lg },

  disclaimerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Palette.creamDim,
    padding: Spacing.sm + 4,
    borderRadius: Radius.sm,
    marginBottom: Spacing.lg,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: Palette.inkFaint,
    lineHeight: 16,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  emptyText: { fontSize: 13, color: Palette.inkFaint },

  policyCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  sectionWrap: {
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm,
  },
  sectionBody: {
    fontSize: 13,
    color: Palette.inkSoft,
    lineHeight: 21,
  },
});
