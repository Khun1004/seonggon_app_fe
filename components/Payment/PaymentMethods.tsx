// components/Payment/PaymentMethods.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

type PaymentCard = {
  id: string;
  brand: string; // "신한", "국민", "삼성" 등
  last4: string; // 마지막 4자리
  isDefault: boolean;
};

const CARD_BRAND_COLORS: Record<string, string> = {
  신한: "#0046FF",
  국민: "#FFBC00",
  삼성: "#1428A0",
  현대: "#000000",
  롯데: "#E60012",
  우리: "#0067AC",
};

export default function PaymentMethods() {
  const [cards, setCards] = useState<PaymentCard[]>([
    { id: "c1", brand: "신한", last4: "4521", isDefault: true },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("신한");

  const handleSetDefault = (id: string) => {
    setCards((prev) =>
      prev.map((card) => ({ ...card, isDefault: card.id === id })),
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert("카드 삭제", "이 카드를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => setCards((prev) => prev.filter((c) => c.id !== id)),
      },
    ]);
  };

  const handleAddCard = () => {
    const digits = cardNumber.replace(/[^0-9]/g, "");
    if (digits.length < 4) {
      Alert.alert("알림", "카드 번호를 정확히 입력해 주세요.");
      return;
    }
    const last4 = digits.slice(-4);
    const newCard: PaymentCard = {
      id: Math.random().toString(36).substring(2, 9),
      brand: selectedBrand,
      last4,
      isDefault: cards.length === 0,
    };
    setCards((prev) => [...prev, newCard]);
    setCardNumber("");
    setShowAddForm(false);
    Alert.alert("등록 완료", "카드가 등록되었습니다.");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="card-outline"
                size={32}
                color={Palette.amberDeep}
              />
            </View>
            <Text style={styles.emptyText}>등록된 카드가 없습니다.</Text>
          </View>
        ) : (
          cards.map((card) => (
            <View key={card.id} style={styles.cardItem}>
              <View
                style={[
                  styles.cardBrandBadge,
                  {
                    backgroundColor:
                      CARD_BRAND_COLORS[card.brand] ?? Palette.charcoal,
                  },
                ]}
              >
                <Ionicons name="card" size={20} color={Palette.white} />
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardBrand}>{card.brand}카드</Text>
                  {card.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>기본</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardNumber}>
                  •••• •••• •••• {card.last4}
                </Text>
              </View>
              <View style={styles.cardActions}>
                {!card.isDefault && (
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => handleSetDefault(card.id)}
                  >
                    <Text style={styles.cardActionText}>기본 설정</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(card.id)}>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={Palette.inkFaint}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {showAddForm ? (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>새 카드 등록</Text>

            <Text style={styles.fieldLabel}>카드사</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.brandRow}>
                {Object.keys(CARD_BRAND_COLORS).map((brand) => (
                  <TouchableOpacity
                    key={brand}
                    style={[
                      styles.brandChip,
                      selectedBrand === brand && styles.brandChipActive,
                    ]}
                    onPress={() => setSelectedBrand(brand)}
                  >
                    <Text
                      style={[
                        styles.brandChipText,
                        selectedBrand === brand && styles.brandChipTextActive,
                      ]}
                    >
                      {brand}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>
              카드 번호
            </Text>
            <TextInput
              style={styles.input}
              placeholder="카드 번호를 입력해 주세요"
              placeholderTextColor={Palette.inkFaint}
              keyboardType="number-pad"
              value={cardNumber}
              onChangeText={setCardNumber}
              maxLength={19}
            />

            <View style={styles.addFormActions}>
              <TouchableOpacity
                style={styles.addFormCancelBtn}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.addFormCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addFormSubmitBtn}
                onPress={handleAddCard}
              >
                <Text style={styles.addFormSubmitText}>등록하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addCardBtn}
            onPress={() => setShowAddForm(true)}
          >
            <Ionicons
              name="add-circle-outline"
              size={18}
              color={Palette.amberDeep}
            />
            <Text style={styles.addCardBtnText}>카드 추가하기</Text>
          </TouchableOpacity>
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
  scrollContent: { paddingHorizontal: Spacing.lg },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.amberSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { color: Palette.inkFaint, fontSize: 13 },

  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardBrandBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.ink,
  },
  defaultBadge: {
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  cardNumber: {
    fontSize: 13,
    color: Palette.inkSoft,
    marginTop: 3,
  },
  cardActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  cardActionBtn: {
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: "600",
    color: Palette.inkSoft,
  },

  addCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.amber,
    borderStyle: "dashed",
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  addCardBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.amberDeep,
  },

  addForm: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  addFormTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Palette.inkSoft,
    marginBottom: Spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  brandChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Palette.creamDim,
  },
  brandChipActive: {
    backgroundColor: Palette.charcoal,
  },
  brandChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Palette.inkSoft,
  },
  brandChipTextActive: {
    color: Palette.cream,
  },
  input: {
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Palette.ink,
  },
  addFormActions: {
    flexDirection: "row",
    gap: Spacing.sm + 2,
    marginTop: Spacing.lg,
  },
  addFormCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.line,
    alignItems: "center",
  },
  addFormCancelText: {
    color: Palette.inkSoft,
    fontWeight: "600",
    fontSize: 13,
  },
  addFormSubmitBtn: {
    flex: 2,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    backgroundColor: Palette.charcoal,
    alignItems: "center",
  },
  addFormSubmitText: {
    color: Palette.cream,
    fontWeight: "700",
    fontSize: 13,
  },
});
