// components/Policy/Policy.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

type PolicySection = {
  heading: string;
  body: string;
};

const TERMS_SECTIONS: PolicySection[] = [
  {
    heading: "제1조 (목적)",
    body: "이 약관은 성공식당(이하 '회사')이 제공하는 모바일 애플리케이션 서비스(이하 '서비스')의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.",
  },
  {
    heading: "제2조 (서비스의 내용)",
    body: "회사는 메뉴 안내, 좌석 및 매장 정보 안내, 예약, 리뷰 작성 등의 기능을 서비스로 제공합니다. 본 서비스는 사전 결제 또는 선주문 기능을 제공하지 않으며, 실제 주문 및 결제는 매장 방문 시 이루어집니다.",
  },
  {
    heading: "제3조 (예약의 성립 및 취소)",
    body: "이용자가 앱을 통해 예약을 신청하면 예약이 성립됩니다. 예약 후 30분 이내에는 앱에서 직접 예약 내용을 수정하거나 취소할 수 있으며, 그 이후의 변경은 매장 전화 문의를 통해야 합니다. 주말 및 공휴일 예약은 온라인으로 접수되지 않으며 전화로만 가능합니다.",
  },
  {
    heading: "제4조 (이용자의 의무)",
    body: "이용자는 예약 시 정확한 인적사항(성명, 연락처)을 입력해야 하며, 허위 정보 입력으로 발생하는 불이익에 대해 회사는 책임을 지지 않습니다.",
  },
  {
    heading: "제5조 (서비스의 변경 및 중단)",
    body: "회사는 운영상, 기술상의 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있으며, 이 경우 사전에 공지사항을 통해 안내합니다.",
  },
  {
    heading: "제6조 (책임의 제한)",
    body: "회사는 천재지변, 매장 사정 등 불가항력적인 사유로 서비스 제공이 어려운 경우 책임을 지지 않습니다.",
  },
];

const PRIVACY_SECTIONS: PolicySection[] = [
  {
    heading: "1. 수집하는 개인정보 항목",
    body: "회사는 예약 서비스 제공을 위해 성명, 휴대전화번호를 수집합니다. 리뷰 작성 시 작성하시는 사진과 리뷰 내용이 추가로 수집될 수 있습니다.",
  },
  {
    heading: "2. 개인정보의 수집 및 이용 목적",
    body: "수집한 개인정보는 예약 확인 및 안내, 예약 변경·취소 처리, 고객 문의 응대, 리뷰 등록 및 노출을 위한 목적으로만 이용됩니다.",
  },
  {
    heading: "3. 개인정보의 보유 및 이용 기간",
    body: "예약 관련 개인정보는 방문 완료 후 1년간 보관 후 파기합니다. 다만 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.",
  },
  {
    heading: "4. 개인정보의 제3자 제공",
    body: "회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 법령에 근거가 있거나 이용자가 사전에 동의한 경우에는 예외로 합니다.",
  },
  {
    heading: "5. 이용자의 권리",
    body: "이용자는 언제든지 자신의 개인정보 열람, 정정, 삭제를 요청할 수 있으며, 매장 또는 고객센터를 통해 요청하실 수 있습니다.",
  },
  {
    heading: "6. 개인정보 보호책임자",
    body: "개인정보 관련 문의사항은 매장 전화번호로 연락 주시면 신속히 답변해 드리겠습니다.",
  },
];

export default function Policy() {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  const sections = activeTab === "terms" ? TERMS_SECTIONS : PRIVACY_SECTIONS;

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

        <View style={styles.policyCard}>
          {sections.map((section, idx) => (
            <View
              key={section.heading}
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
