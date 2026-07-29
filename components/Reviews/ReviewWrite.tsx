// components/Reviews/ReviewWrite.tsx
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/components/contexts/AuthContext";
import { ProfileContext } from "@/components/contexts/ProfileContext";
import { ReviewContext } from "@/components/contexts/ReviewContext";
import {
  generateAiReview,
  getReviewGoodPointOptions,
  resolvePhotoUrl,
  ReviewGoodPointOption,
  uploadReviewPhoto,
} from "@/constants/api";
import { NAVER_REVIEW_URL } from "@/constants/store";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const MAX_PHOTOS = 10;

type WriteMode = "manual" | "ai";

const TASTE_KEYWORDS = [
  "맛있어요",
  "재료가 신선해요",
  "양이 많아요",
  "특별한 맛이에요",
];
const MOOD_KEYWORDS = [
  "분위기가 좋아요",
  "조용해요",
  "가족모임에 좋아요",
  "깨끗해요",
];
const SERVICE_KEYWORDS = ["친절해요", "응대가 빨라요", "설명을 잘 해줘요"];

const MENU_OPTIONS = [
  "능이오리백숙",
  "산더미 오리간장불고기",
  "능이닭백숙",
  "유황오리생불고기",
  "유황오리로스구이",
  "해물파전",
];

// 예약에서 넘어온 메뉴 이름이 리뷰용 메뉴 목록과 정확히 안 맞을 수 있어서
// (예: "산더미 오리간장불고기 2인" vs "산더미 오리간장불고기") 앞부분이 일치하면 매칭해줍니다.
function matchMenuOption(name: string | undefined): string | null {
  if (!name) return null;
  if (MENU_OPTIONS.includes(name)) return name;
  const found = MENU_OPTIONS.find((option) => name.startsWith(option));
  return found ?? null;
}

function maskName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "고객";
  if (trimmed.length === 1) return trimmed;
  if (trimmed.length === 2) return `${trimmed[0]}*`;
  return `${trimmed[0]}${"*".repeat(trimmed.length - 2)}${trimmed[trimmed.length - 1]}`;
}

export default function ReviewWrite() {
  const router = useRouter();
  const {
    rewardEligible: rewardEligibleParam,
    menu: menuParam,
    reservationId: reservationIdParam,
  } = useLocalSearchParams<{
    rewardEligible?: string;
    menu?: string;
    reservationId?: string;
  }>();
  const isRewardEligible = rewardEligibleParam === "true";
  const { addReview } = useContext(ReviewContext);
  const { profile } = useContext(ProfileContext);
  const { user, isLoaded } = useAuth();

  const [writeMode, setWriteMode] = useState<WriteMode>("manual");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [foodImages, setFoodImages] = useState<string[]>([]);

  const [selectedGoodPoints, setSelectedGoodPoints] = useState<string[]>([]);
  const [goodPointOptions, setGoodPointOptions] = useState<
    ReviewGoodPointOption[]
  >([]);
  useEffect(() => {
    getReviewGoodPointOptions()
      .then(setGoodPointOptions)
      .catch(() => {});
  }, []);
  // 예약 내역에서 "리뷰 작성"을 눌러 넘어온 경우, 그때 드셨던(고르셨던) 메뉴가 자동으로 선택돼요.
  const [selectedMenu, setSelectedMenu] = useState<string | null>(() =>
    matchMenuOption(menuParam),
  );

  const [selectedTaste, setSelectedTaste] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const handleFoodImageUpload = async () => {
    if (foodImages.length >= MAX_PHOTOS) {
      Alert.alert("알림", `사진은 최대 ${MAX_PHOTOS}장까지만 첨부 가능합니다.`);
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("알림", "사진 보관함 접근 권한이 필요합니다.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - foodImages.length,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    // 고른 사진들을 로컬 경로 그대로 저장하면 다른 사람(다른 기기)은 못 보게 돼요.
    // 그래서 서버에 실제로 업로드하고, 그 결과 주소(URL)만 저장합니다.
    setPhotoUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const asset of result.assets) {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const url = await uploadReviewPhoto(base64);
        uploadedUrls.push(url);
      }
      setFoodImages((prev) => [...prev, ...uploadedUrls].slice(0, MAX_PHOTOS));
    } catch (e: any) {
      Alert.alert("알림", e.message || "사진 업로드에 실패했습니다.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const toggleKeyword = (
    value: string,
    current: string | null,
    setter: (v: string | null) => void,
  ) => {
    setter(current === value ? null : value);
  };

  const toggleGoodPoint = (label: string) => {
    setSelectedGoodPoints((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  const handleApplyAiText = async () => {
    setAiGenerating(true);
    try {
      const text = await generateAiReview({
        rating,
        goodPoints: selectedGoodPoints,
        menuName: selectedMenu ?? undefined,
        taste: selectedTaste ?? undefined,
        mood: selectedMood ?? undefined,
        service: selectedService ?? undefined,
      });
      setReviewText(text);
    } catch (e: any) {
      Alert.alert("오류", e.message || "AI 리뷰 생성에 실패했습니다.");
    } finally {
      setAiGenerating(false);
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("알림", "로그인 후 리뷰를 작성할 수 있어요.", [
        { text: "취소", style: "cancel" },
        { text: "로그인하기", onPress: () => router.push("/login" as any) },
      ]);
      return;
    }
    if (reviewText.trim().length < 5) {
      Alert.alert("알림", "리뷰를 5자 이상 작성해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await addReview({
        id: Math.random().toString(),
        name: profile?.name ? maskName(profile.name) : "고객",
        rating,
        date: new Date().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
        text: reviewText,
        options: [
          foodImages.length > 0 ? "포토리뷰" : "일반리뷰",
          ...(selectedMenu ? [selectedMenu] : []),
        ],
        likes: 0,
        photos: foodImages,
        keywords: selectedGoodPoints,
        menuName: selectedMenu ?? undefined,
        reservationId: reservationIdParam || undefined,
        rewardEligible: isRewardEligible,
      });

      Alert.alert(
        "등록 완료",
        isRewardEligible
          ? "리뷰가 등록되었고 1,500원이 적립되었습니다! 마이페이지의 '리뷰 적립'에서 확인하실 수 있어요.\n\n네이버에도 리뷰를 남겨주시면 큰 도움이 됩니다 😊"
          : "리뷰가 방문자 리뷰로 등록되었으며, 마이페이지에서 확인 가능합니다.\n\n네이버에도 리뷰를 남겨주시면 큰 도움이 됩니다 😊",
        [
          {
            text: "네이버에 리뷰 남기기",
            onPress: () => {
              Linking.openURL(NAVER_REVIEW_URL).catch(() => {
                Alert.alert("알림", "네이버 리뷰 페이지를 열 수 없습니다.");
              });
              router.back();
            },
          },
          { text: "나중에", style: "cancel", onPress: () => router.back() },
        ],
      );
    } catch (e: any) {
      Alert.alert("오류", e.message || "리뷰 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = reviewText.trim().length >= 5 && !submitting;

  // 아직 로그인 상태를 불러오는 중이면 잠시 대기
  if (!isLoaded) {
    return (
      <View style={[styles.container, styles.loginGateContainer]}>
        <ActivityIndicator color={Palette.amberDeep} />
      </View>
    );
  }

  // 로그인하지 않은 사용자는 작성 폼 대신 로그인 안내를 보여줍니다.
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loginGateContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={40}
            color={Palette.amberDeep}
          />
          <Text style={styles.loginGateTitle}>로그인이 필요해요</Text>
          <Text style={styles.loginGateDesc}>
            방문자 리뷰는 로그인 후 작성할 수 있습니다.{"\n"}
            로그인하고 소중한 경험을 남겨주세요.
          </Text>
          <TouchableOpacity
            style={styles.loginGateBtn}
            onPress={() => router.push("/login" as any)}
          >
            <Text style={styles.loginGateBtnText}>로그인하러 가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isRewardEligible && (
          <View style={styles.rewardBadgeBanner}>
            <Ionicons name="pricetag" size={16} color={Palette.white} />
            <Text style={styles.rewardBadgeBannerText}>
              이 리뷰는 1,500원 적립 대상이에요
            </Text>
          </View>
        )}

        {/* 리뷰 작성법 바로가기 */}
        <TouchableOpacity
          style={styles.guideLinkRow}
          onPress={() => router.push("/review-guide" as any)}
        >
          <Text style={styles.guideLinkText}>리뷰 작성법</Text>
          <Ionicons
            name="chevron-forward"
            size={13}
            color={Palette.amberDeep}
          />
        </TouchableOpacity>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 별점 선택</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={34}
                  color={Palette.gold}
                  style={{ marginRight: 5 }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 먹은 메뉴 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 어떤 메뉴를 드셨나요?</Text>
          <Text style={styles.sectionDesc}>
            선택한 메뉴의 평점에 반영됩니다.
          </Text>
          <View style={styles.menuChipRow}>
            {MENU_OPTIONS.map((menu) => (
              <TouchableOpacity
                key={menu}
                style={[
                  styles.menuChip,
                  selectedMenu === menu && styles.menuChipActive,
                ]}
                onPress={() =>
                  setSelectedMenu((prev) => (prev === menu ? null : menu))
                }
              >
                <Text
                  style={[
                    styles.menuChipText,
                    selectedMenu === menu && styles.menuChipTextActive,
                  ]}
                >
                  {menu}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 이런 점이 좋았어요 키워드 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. 어떤 점이 좋았나요? (복수 선택)
          </Text>
          <Text style={styles.sectionDesc}>
            선택하신 항목은 '이런 점이 좋았어요' 통계에 반영됩니다.
          </Text>
          <View style={styles.goodPointChipGrid}>
            {goodPointOptions.map((opt) => {
              const isSelected = selectedGoodPoints.includes(opt.label);
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.goodPointChip,
                    isSelected && styles.goodPointChipActive,
                  ]}
                  onPress={() => toggleGoodPoint(opt.label)}
                >
                  <Text style={styles.goodPointEmoji}>{opt.emoji}</Text>
                  <Text
                    style={[
                      styles.goodPointChipText,
                      isSelected && styles.goodPointChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Write mode toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 리뷰 작성</Text>
          <View style={styles.modeTabRow}>
            <TouchableOpacity
              style={[
                styles.modeTab,
                writeMode === "manual" && styles.modeTabActive,
              ]}
              onPress={() => setWriteMode("manual")}
            >
              <Ionicons
                name="create-outline"
                size={14}
                color={writeMode === "manual" ? Palette.cream : Palette.inkSoft}
              />
              <Text
                style={[
                  styles.modeTabText,
                  writeMode === "manual" && styles.modeTabTextActive,
                ]}
              >
                직접 작성
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeTab,
                writeMode === "ai" && styles.modeTabActive,
              ]}
              onPress={() => setWriteMode("ai")}
            >
              <Ionicons
                name="sparkles-outline"
                size={14}
                color={writeMode === "ai" ? Palette.cream : Palette.inkSoft}
              />
              <Text
                style={[
                  styles.modeTabText,
                  writeMode === "ai" && styles.modeTabTextActive,
                ]}
              >
                AI 작성
              </Text>
            </TouchableOpacity>
          </View>

          {writeMode === "ai" && (
            <View style={styles.aiKeywordBox}>
              <Text style={styles.aiKeywordLabel}>맛은 어땠나요?</Text>
              <View style={styles.keywordRow}>
                {TASTE_KEYWORDS.map((kw) => (
                  <TouchableOpacity
                    key={kw}
                    style={[
                      styles.keywordChip,
                      selectedTaste === kw && styles.keywordChipActive,
                    ]}
                    onPress={() =>
                      toggleKeyword(kw, selectedTaste, setSelectedTaste)
                    }
                  >
                    <Text
                      style={[
                        styles.keywordChipText,
                        selectedTaste === kw && styles.keywordChipTextActive,
                      ]}
                    >
                      {kw}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.aiKeywordLabel, { marginTop: Spacing.md }]}>
                분위기는 어땠나요?
              </Text>
              <View style={styles.keywordRow}>
                {MOOD_KEYWORDS.map((kw) => (
                  <TouchableOpacity
                    key={kw}
                    style={[
                      styles.keywordChip,
                      selectedMood === kw && styles.keywordChipActive,
                    ]}
                    onPress={() =>
                      toggleKeyword(kw, selectedMood, setSelectedMood)
                    }
                  >
                    <Text
                      style={[
                        styles.keywordChipText,
                        selectedMood === kw && styles.keywordChipTextActive,
                      ]}
                    >
                      {kw}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.aiKeywordLabel, { marginTop: Spacing.md }]}>
                서비스는 어땠나요?
              </Text>
              <View style={styles.keywordRow}>
                {SERVICE_KEYWORDS.map((kw) => (
                  <TouchableOpacity
                    key={kw}
                    style={[
                      styles.keywordChip,
                      selectedService === kw && styles.keywordChipActive,
                    ]}
                    onPress={() =>
                      toggleKeyword(kw, selectedService, setSelectedService)
                    }
                  >
                    <Text
                      style={[
                        styles.keywordChipText,
                        selectedService === kw && styles.keywordChipTextActive,
                      ]}
                    >
                      {kw}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.aiGenerateBtn,
                  aiGenerating && styles.aiGenerateBtnDisabled,
                ]}
                onPress={handleApplyAiText}
                disabled={aiGenerating}
              >
                {aiGenerating ? (
                  <ActivityIndicator size="small" color={Palette.white} />
                ) : (
                  <Ionicons name="sparkles" size={14} color={Palette.white} />
                )}
                <Text style={styles.aiGenerateBtnText}>
                  {aiGenerating ? "AI가 작성 중..." : "AI로 리뷰 만들기"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.textInput}
            placeholder="음식의 맛, 분위기, 친절도 등 식당에서의 경험을 자유롭게 남겨주세요. (최소 5자 이상)"
            placeholderTextColor={Palette.inkFaint}
            multiline
            textAlignVertical="top"
            value={reviewText}
            onChangeText={setReviewText}
          />

          <View style={styles.photoUploadContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.photoAddBtn}
                onPress={handleFoodImageUpload}
                disabled={photoUploading}
              >
                {photoUploading ? (
                  <ActivityIndicator color={Palette.amberDeep} />
                ) : (
                  <>
                    <Ionicons name="add" size={24} color={Palette.amberDeep} />
                    <Text style={styles.photoAddText}>
                      {foodImages.length}/{MAX_PHOTOS}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {foodImages.map((uri, idx) => (
                <View key={idx} style={styles.photoPreviewWrapper}>
                  <Image
                    source={{ uri: resolvePhotoUrl(uri) ?? uri }}
                    style={styles.foodPhoto}
                  />
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={() =>
                      setFoodImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={Palette.error}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Palette.cream} />
          ) : (
            <Text style={styles.submitBtnText}>방문자 리뷰로 등록하기</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },
  rewardBadgeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#B23A2E",
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  rewardBadgeBannerText: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.white,
  },
  guideLinkRow: {
    flexDirection: "row",
    alignSelf: "flex-end",
    alignItems: "center",
    gap: 2,
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    marginBottom: Spacing.md,
  },
  guideLinkText: {
    fontSize: 11,
    fontWeight: "700",
    color: Palette.amberDeep,
  },

  scrollContent: { padding: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.ink,
    marginBottom: Spacing.sm,
  },
  sectionDesc: {
    fontSize: 13,
    color: Palette.inkFaint,
    marginBottom: Spacing.md,
    lineHeight: 19,
  },
  loginGateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm + 4,
  },
  loginGateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Palette.ink,
    marginTop: Spacing.sm,
  },
  loginGateDesc: {
    fontSize: 13,
    color: Palette.inkFaint,
    textAlign: "center",
    lineHeight: 20,
  },
  loginGateBtn: {
    backgroundColor: Palette.charcoal,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  loginGateBtnText: {
    color: Palette.cream,
    fontSize: 15,
    fontWeight: "700",
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: Spacing.sm,
  },

  menuChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  menuChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  menuChipActive: {
    backgroundColor: Palette.charcoal,
    borderColor: Palette.charcoal,
  },
  menuChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.inkSoft,
  },
  menuChipTextActive: {
    color: Palette.cream,
  },

  goodPointChipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  goodPointChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  goodPointChipActive: {
    backgroundColor: Palette.amberSoft,
    borderColor: Palette.amber,
  },
  goodPointEmoji: {
    fontSize: 14,
  },
  goodPointChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Palette.inkSoft,
  },
  goodPointChipTextActive: {
    color: Palette.amberDeep,
  },

  modeTabRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  modeTabActive: {
    backgroundColor: Palette.charcoal,
    borderColor: Palette.charcoal,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Palette.inkSoft,
  },
  modeTabTextActive: {
    color: Palette.cream,
  },

  aiKeywordBox: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  aiKeywordLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Palette.inkSoft,
    marginBottom: Spacing.sm,
  },
  keywordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  keywordChip: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.pill,
    backgroundColor: Palette.creamDim,
  },
  keywordChipActive: {
    backgroundColor: Palette.amber,
  },
  keywordChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Palette.inkSoft,
  },
  keywordChipTextActive: {
    color: Palette.white,
  },
  aiGenerateBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: Palette.amberDeep,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  aiGenerateBtnDisabled: {
    opacity: 0.6,
  },
  aiGenerateBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.white,
  },

  textInput: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: 14,
    height: 140,
    color: Palette.ink,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  photoUploadContainer: { flexDirection: "row", alignItems: "center" },
  photoAddBtn: {
    width: 66,
    height: 66,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.amber,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm + 4,
    backgroundColor: Palette.amberSoft,
  },
  photoAddText: {
    fontSize: 11,
    color: Palette.amberDeep,
    marginTop: 4,
    fontWeight: "700",
  },
  photoPreviewWrapper: { position: "relative", marginRight: Spacing.sm + 4 },
  foodPhoto: {
    width: 66,
    height: 66,
    borderRadius: Radius.md,
    backgroundColor: Palette.creamDim,
  },
  photoRemoveBtn: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: Palette.white,
    borderRadius: 10,
  },
  submitBtn: {
    backgroundColor: Palette.charcoal,
    height: 54,
    borderRadius: Radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: Palette.cream, fontSize: 16, fontWeight: "700" },
});
