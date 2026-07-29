// app/admin/reservations.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AdminContext } from "@/components/contexts/AdminContext";
import {
  AdminReservation,
  cancelReservationAsAdmin,
  getAdminReservations,
  markReservationPaidAsAdmin,
} from "@/constants/adminApi";
import {
  AdminPalette as Palette,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/adminTheme";
import { getReservationMenuName } from "@/constants/reservation-menu-data";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

// 예약(방문)은 시작 시간+1시간, 포장은 픽업 시간 자체가 지나면 "완료됨"으로 봐요.
// 손님 화면(ReservationCard.tsx)과 같은 기준이에요.
function isPastReservation(res: AdminReservation, now: number): boolean {
  const start = new Date(`${res.date}T${res.time}:00`).getTime();
  const completionTime =
    res.type === "TAKEOUT" ? start : start + 60 * 60 * 1000;
  return now >= completionTime;
}

function getStatusInfo(res: AdminReservation, now: number) {
  if (res.status === "CANCELLED") {
    if (res.paymentStatus === "REFUNDED") {
      return { label: "환불됨", tone: "refunded" as const };
    }
    return { label: "취소됨", tone: "cancelled" as const };
  }
  if (isPastReservation(res, now)) {
    return { label: "완료됨", tone: "completed" as const };
  }
  return {
    label: res.type === "TAKEOUT" ? "주문접수" : "예약완료",
    tone: "active" as const,
  };
}

export default function AdminReservations() {
  const router = useRouter();
  const { adminPassword } = useContext(AdminContext);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"today" | "all" | "cancelled">("today");
  const [typeFilter, setTypeFilter] = useState<"all" | "DINE_IN" | "TAKEOUT">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(new Date().getTime());
  const [detailRes, setDetailRes] = useState<AdminReservation | null>(null);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payMethod, setPayMethod] = useState<"현장카드" | "현장현금" | "기타">(
    "현장카드",
  );
  const [payAmount, setPayAmount] = useState("");
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().getTime()), 30000);
    return () => clearInterval(timer);
  }, []);

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

  const handleCancel = (res: AdminReservation) => {
    const isPaid = res.paymentStatus === "PAID";
    Alert.alert(
      "예약 취소",
      isPaid
        ? `${res.date} ${res.time} · ${res.name}님 예약을 취소할까요?\n\n결제하신 ${(res.paidAmount ?? 0).toLocaleString()}원은 취소와 함께 환불 처리됩니다.`
        : `${res.date} ${res.time} · ${res.name}님 예약을 취소할까요?`,
      [
        { text: "닫기", style: "cancel" },
        {
          text: isPaid ? "취소 + 환불 처리" : "취소하기",
          style: "destructive",
          onPress: async () => {
            if (!adminPassword) return;
            try {
              await cancelReservationAsAdmin(res.id, adminPassword);
              setDetailRes(null);
              load();
            } catch (e: any) {
              Alert.alert("알림", e.message || "취소에 실패했습니다.");
            }
          },
        },
      ],
    );
  };

  const openPayForm = (res: AdminReservation) => {
    setPayMethod("현장카드");
    setPayAmount(res.paidAmount ? String(res.paidAmount) : "");
    setShowPayForm(true);
  };

  const handleMarkPaid = async () => {
    if (!detailRes || !adminPassword) return;
    const amount = Number(payAmount.replace(/[^0-9]/g, ""));
    if (!amount || amount <= 0) {
      Alert.alert("알림", "결제 금액을 입력해 주세요.");
      return;
    }
    setMarkingPaid(true);
    try {
      const updated = await markReservationPaidAsAdmin(
        detailRes.id,
        payMethod,
        amount,
        adminPassword,
      );
      setDetailRes(updated);
      setShowPayForm(false);
      load();
      Alert.alert("알림", "결제완료로 기록되었습니다.");
    } catch (e: any) {
      Alert.alert("알림", e.message || "처리에 실패했습니다.");
    } finally {
      setMarkingPaid(false);
    }
  };

  const filtered = reservations.filter((r) => {
    if (filter === "today") {
      if (r.date !== todayStr() || r.status === "CANCELLED") return false;
    } else if (filter === "cancelled") {
      if (r.status !== "CANCELLED") return false;
    }

    if (typeFilter !== "all" && r.type !== typeFilter) return false;

    const query = searchQuery.trim();
    if (query) {
      const nameMatch = r.name?.includes(query);
      const phoneMatch = r.phone
        ?.replace(/-/g, "")
        .includes(query.replace(/-/g, ""));
      if (!nameMatch && !phoneMatch) return false;
    }

    return true;
  });

  const renderCard = (res: AdminReservation) => {
    const menuNames = Object.entries(res.menus ?? {})
      .map(([id, qty]) => `${getReservationMenuName(id)} ${qty}개`)
      .join(", ");
    const statusInfo = getStatusInfo(res, now);
    const canCancel =
      res.status !== "CANCELLED" && !isPastReservation(res, now);

    return (
      <TouchableOpacity
        key={res.id}
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => setDetailRes(res)}
      >
        <View style={styles.cardTopRow}>
          <View
            style={[
              styles.typeBadge,
              res.type === "TAKEOUT" && styles.typeBadgeTakeout,
            ]}
          >
            <Text style={styles.typeBadgeText}>
              {res.type === "TAKEOUT" ? "🥡 포장" : "🍽 방문"}
            </Text>
          </View>
          {res.paymentStatus === "PAID" && (
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>결제완료</Text>
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              statusInfo.tone === "cancelled" && styles.statusBadgeCancelled,
              statusInfo.tone === "refunded" && styles.statusBadgeRefunded,
              statusInfo.tone === "completed" && styles.statusBadgeCompleted,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                statusInfo.tone === "cancelled" &&
                  styles.statusBadgeTextCancelled,
                statusInfo.tone === "refunded" &&
                  styles.statusBadgeTextRefunded,
                statusInfo.tone === "completed" &&
                  styles.statusBadgeTextCompleted,
              ]}
            >
              {statusInfo.label}
            </Text>
          </View>
        </View>
        <Text style={styles.cardDate}>
          {res.date} {res.time}
        </Text>
        <Text style={styles.cardRoom}>{res.roomLabel}</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>예약자</Text>
          <Text style={styles.detailValue}>
            {res.name} · {res.phone}
          </Text>
        </View>
        {menuNames.length > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>메뉴</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {menuNames}
            </Text>
          </View>
        )}

        <View style={styles.cardFooterRow}>
          <View style={styles.detailLinkRow}>
            <Text style={styles.detailLinkText}>자세히 보기</Text>
            <Ionicons
              name="chevron-forward"
              size={13}
              color={Palette.amberDeep}
            />
          </View>
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleCancel(res);
              }}
            >
              <Text style={styles.cancelBtnText}>예약 취소</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>ALL RESERVATIONS</Text>
              <Text style={styles.headerTitle}>예약 관리</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.filterRow}>
        {(
          [
            { key: "today", label: "오늘" },
            { key: "all", label: "전체" },
            { key: "cancelled", label: "취소됨" },
          ] as const
        ).map((f) => (
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

      <View style={styles.typeFilterRow}>
        {(
          [
            { key: "all", label: "전체" },
            { key: "DINE_IN", label: "🍽 방문" },
            { key: "TAKEOUT", label: "🥡 포장" },
          ] as const
        ).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.typeFilterTab,
              typeFilter === t.key && styles.typeFilterTabActive,
            ]}
            onPress={() => setTypeFilter(t.key)}
          >
            <Text
              style={[
                styles.typeFilterTabText,
                typeFilter === t.key && styles.typeFilterTabTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={Palette.inkFaint} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="이름 또는 전화번호로 검색"
          placeholderTextColor={Palette.inkFaint}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={Palette.inkFaint} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Palette.amberDeep} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons
                name="calendar-outline"
                size={44}
                color={Palette.line}
              />
              <Text style={styles.emptyText}>해당하는 예약이 없습니다.</Text>
            </View>
          ) : (
            filtered.map(renderCard)
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      <Modal
        visible={!!detailRes}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setDetailRes(null);
          setShowPayForm(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>예약 상세</Text>
                <TouchableOpacity
                  onPress={() => {
                    setDetailRes(null);
                    setShowPayForm(false);
                  }}
                  hitSlop={10}
                >
                  <Ionicons name="close" size={22} color={Palette.inkFaint} />
                </TouchableOpacity>
              </View>

              {detailRes && (
                <>
                  {(() => {
                    const statusInfo = getStatusInfo(detailRes, now);
                    return (
                      <View
                        style={[
                          styles.modalStatusBanner,
                          statusInfo.tone === "cancelled" &&
                            styles.statusBadgeCancelled,
                          statusInfo.tone === "refunded" &&
                            styles.statusBadgeRefunded,
                          statusInfo.tone === "completed" &&
                            styles.statusBadgeCompleted,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalStatusBannerText,
                            statusInfo.tone === "cancelled" &&
                              styles.statusBadgeTextCancelled,
                            statusInfo.tone === "refunded" &&
                              styles.statusBadgeTextRefunded,
                            statusInfo.tone === "completed" &&
                              styles.statusBadgeTextCompleted,
                          ]}
                        >
                          {statusInfo.label}
                        </Text>
                      </View>
                    );
                  })()}

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>구분</Text>
                    <Text style={styles.modalValue}>
                      {detailRes.type === "TAKEOUT" ? "포장 주문" : "방문 예약"}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>날짜/시간</Text>
                    <Text style={styles.modalValue}>
                      {detailRes.date} {detailRes.time}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>좌석/픽업</Text>
                    <Text style={styles.modalValue}>{detailRes.roomLabel}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>예약자</Text>
                    <Text style={styles.modalValue}>{detailRes.name}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>연락처</Text>
                    <Text style={styles.modalValue}>{detailRes.phone}</Text>
                  </View>
                  {detailRes.type !== "TAKEOUT" && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>인원</Text>
                      <Text style={styles.modalValue}>
                        {detailRes.peopleCount}명
                      </Text>
                    </View>
                  )}
                  {detailRes.hasPet && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>반려동물</Text>
                      <Text style={styles.modalValue}>동반 🐾</Text>
                    </View>
                  )}
                  {Object.keys(detailRes.menus ?? {}).length > 0 && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>메뉴</Text>
                      <Text style={styles.modalValue}>
                        {Object.entries(detailRes.menus ?? {})
                          .map(
                            ([id, qty]) =>
                              `${getReservationMenuName(id)} ${qty}개`,
                          )
                          .join(", ")}
                      </Text>
                    </View>
                  )}
                  {detailRes.wantsTakeout &&
                    Object.keys(detailRes.takeoutMenus ?? {}).length > 0 && (
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>포장</Text>
                        <Text style={styles.modalValue}>
                          {Object.entries(detailRes.takeoutMenus ?? {})
                            .map(
                              ([id, qty]) =>
                                `${getReservationMenuName(id)} ${qty}개`,
                            )
                            .join(", ")}
                        </Text>
                      </View>
                    )}
                  {detailRes.message && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>메시지</Text>
                      <Text style={styles.modalValue}>{detailRes.message}</Text>
                    </View>
                  )}

                  <View style={styles.modalDivider} />

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>결제 상태</Text>
                    <Text style={styles.modalValue}>
                      {detailRes.paymentStatus === "PAID"
                        ? "결제완료"
                        : detailRes.paymentStatus === "REFUNDED"
                          ? "환불됨"
                          : "미결제"}
                    </Text>
                  </View>
                  {(detailRes.paidAmount ?? 0) > 0 && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>결제 금액</Text>
                      <Text style={styles.modalValue}>
                        {(detailRes.paidAmount ?? 0).toLocaleString()}원
                      </Text>
                    </View>
                  )}
                  {detailRes.paymentMethod && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>결제 수단</Text>
                      <Text style={styles.modalValue}>
                        {detailRes.paymentMethod}
                      </Text>
                    </View>
                  )}

                  {detailRes.status !== "CANCELLED" && (
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => {
                        setDetailRes(null);
                        router.push(
                          `/admin/reservation-create?editId=${detailRes.id}` as any,
                        );
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={15}
                        color={Palette.amberDeep}
                      />
                      <Text style={styles.editBtnText}>
                        예약 시간/자리 수정
                      </Text>
                    </TouchableOpacity>
                  )}

                  {detailRes.status !== "CANCELLED" &&
                    detailRes.paymentStatus === "UNPAID" &&
                    !showPayForm && (
                      <TouchableOpacity
                        style={styles.markPaidBtn}
                        onPress={() => openPayForm(detailRes)}
                      >
                        <Ionicons
                          name="cash-outline"
                          size={15}
                          color={Palette.white}
                        />
                        <Text style={styles.markPaidBtnText}>
                          매장 결제 완료로 표시
                        </Text>
                      </TouchableOpacity>
                    )}

                  {showPayForm && (
                    <View style={styles.payFormBox}>
                      <Text style={styles.payFormLabel}>결제 수단</Text>
                      <View style={styles.payMethodRow}>
                        {(["현장카드", "현장현금", "기타"] as const).map(
                          (m) => (
                            <TouchableOpacity
                              key={m}
                              style={[
                                styles.payMethodChip,
                                payMethod === m && styles.payMethodChipActive,
                              ]}
                              onPress={() => setPayMethod(m)}
                            >
                              <Text
                                style={[
                                  styles.payMethodChipText,
                                  payMethod === m &&
                                    styles.payMethodChipTextActive,
                                ]}
                              >
                                {m}
                              </Text>
                            </TouchableOpacity>
                          ),
                        )}
                      </View>
                      <Text style={styles.payFormLabel}>결제 금액</Text>
                      <TextInput
                        style={styles.payAmountInput}
                        value={payAmount}
                        onChangeText={(v) =>
                          setPayAmount(v.replace(/[^0-9]/g, ""))
                        }
                        placeholder="예: 69000"
                        placeholderTextColor={Palette.inkFaint}
                        keyboardType="number-pad"
                      />
                      <View style={styles.payFormActions}>
                        <TouchableOpacity
                          style={styles.payFormCancelBtn}
                          onPress={() => setShowPayForm(false)}
                        >
                          <Text style={styles.payFormCancelBtnText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.payFormSubmitBtn,
                            markingPaid && { opacity: 0.6 },
                          ]}
                          onPress={handleMarkPaid}
                          disabled={markingPaid}
                        >
                          {markingPaid ? (
                            <ActivityIndicator
                              color={Palette.white}
                              size="small"
                            />
                          ) : (
                            <Text style={styles.payFormSubmitBtnText}>
                              결제완료 기록
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {detailRes.status !== "CANCELLED" &&
                    !isPastReservation(detailRes, now) && (
                      <TouchableOpacity
                        style={styles.modalCancelBtn}
                        onPress={() => handleCancel(detailRes)}
                      >
                        <Text style={styles.modalCancelBtnText}>
                          예약 취소
                          {detailRes.paymentStatus === "PAID" ? " + 환불" : ""}
                        </Text>
                      </TouchableOpacity>
                    )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  header: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  eyebrow: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 2,
    textAlign: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Palette.cream },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
  typeFilterRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  typeFilterTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  typeFilterTabActive: {
    backgroundColor: Palette.amberSoft,
    borderColor: Palette.amber,
  },
  typeFilterTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkSoft,
  },
  typeFilterTabTextActive: { color: Palette.amberDeep },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Palette.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Palette.ink,
    padding: 0,
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: Spacing.sm,
  },
  emptyText: { color: Palette.inkFaint, fontSize: 13 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardTopRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  typeBadgeTakeout: { backgroundColor: "rgba(107,63,160,0.14)" },
  typeBadgeText: { fontSize: 10, fontWeight: "700", color: Palette.amberDeep },
  paidBadge: {
    backgroundColor: "rgba(91,123,90,0.14)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  paidBadgeText: { fontSize: 10, fontWeight: "700", color: Palette.success },
  statusBadge: {
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  statusBadgeText: { fontSize: 10, fontWeight: "700", color: Palette.inkSoft },
  statusBadgeCancelled: { backgroundColor: "rgba(178,58,46,0.12)" },
  statusBadgeTextCancelled: { color: Palette.error },
  statusBadgeRefunded: { backgroundColor: "rgba(178,58,46,0.12)" },
  statusBadgeTextRefunded: { color: Palette.error },
  statusBadgeCompleted: { backgroundColor: "rgba(91,123,90,0.14)" },
  statusBadgeTextCompleted: { color: Palette.success },
  cardDate: { fontSize: 16, fontWeight: "800", color: Palette.ink },
  cardRoom: { fontSize: 13, color: Palette.inkSoft, marginBottom: Spacing.sm },
  detailRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  detailLabel: { fontSize: 12, color: Palette.inkFaint, width: 44 },
  detailValue: { fontSize: 12, color: Palette.ink, flex: 1 },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm + 4,
  },
  detailLinkRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  detailLinkText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: Palette.amberDeep,
  },
  cancelBtn: {
    backgroundColor: "hsla(0, 45%, 44%, 0.08)",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  cancelBtnText: { color: Palette.error, fontWeight: "700", fontSize: 12 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: "85%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: Palette.ink },
  modalStatusBanner: {
    alignSelf: "flex-start",
    backgroundColor: Palette.creamDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    marginBottom: Spacing.md,
  },
  modalStatusBannerText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: Palette.inkSoft,
  },
  modalRow: {
    flexDirection: "row",
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  modalLabel: {
    fontSize: 12.5,
    color: Palette.inkFaint,
    width: 72,
  },
  modalValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Palette.ink,
  },
  modalDivider: {
    height: Spacing.md,
  },
  modalCancelBtn: {
    marginTop: Spacing.lg,
    backgroundColor: "hsla(0, 45%, 44%, 0.08)",
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  modalCancelBtnText: { color: Palette.error, fontWeight: "700", fontSize: 14 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.lg,
    backgroundColor: Palette.amberSoft,
    borderWidth: 1,
    borderColor: Palette.amber,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.md,
  },
  editBtnText: { color: Palette.amberDeep, fontWeight: "700", fontSize: 14 },
  markPaidBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.lg,
    backgroundColor: "#2E7D32",
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.md,
  },
  markPaidBtnText: { color: Palette.white, fontWeight: "700", fontSize: 14 },
  payFormBox: {
    marginTop: Spacing.lg,
    backgroundColor: Palette.creamDim,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  payFormLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkSoft,
    marginBottom: 6,
  },
  payMethodRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: Spacing.md,
  },
  payMethodChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  payMethodChipActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  payMethodChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkSoft,
  },
  payMethodChipTextActive: { color: Palette.white },
  payAmountInput: {
    backgroundColor: Palette.white,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: 14,
    color: Palette.ink,
    borderWidth: 1,
    borderColor: Palette.line,
    marginBottom: Spacing.md,
  },
  payFormActions: { flexDirection: "row", gap: 8 },
  payFormCancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  payFormCancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.inkSoft,
  },
  payFormSubmitBtn: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.sm,
    backgroundColor: "#2E7D32",
  },
  payFormSubmitBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.white,
  },
});
