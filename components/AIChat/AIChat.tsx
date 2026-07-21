// components/AIChat/AIChat.tsx
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatApiMessage, sendAiChatMessage } from "@/constants/api";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

type ChatMessage = {
  id: string;
  sender: "bot" | "user";
  text: string;
  imageUri?: string;
  fileName?: string;
  isTyping?: boolean; // true면 한 글자씩 타이핑 중인 상태
};

const QUICK_QUESTIONS = [
  "영업시간이 언제예요?",
  "주차 가능한가요?",
  "추천 메뉴 알려주세요",
];

const WELCOME_TEXT =
  "안녕하세요! 성공식당 AI 상담원입니다 🙂\n영업시간, 예약, 메뉴, 주차 등 무엇이든 편하게 물어보세요.";

// 한 글자가 나타나는 간격(ms) — 작을수록 빠르게 타이핑됩니다.
const TYPING_INTERVAL_MS = 18;

// 타이핑 애니메이션을 보여주는 봇 말풍선용 컴포넌트
function TypingText({
  fullText,
  onDone,
}: {
  fullText: string;
  onDone: () => void;
}) {
  const [shownLength, setShownLength] = useState(0);

  useEffect(() => {
    if (shownLength >= fullText.length) {
      onDone();
      return;
    }
    const timer = setTimeout(() => {
      setShownLength((prev) => prev + 1);
    }, TYPING_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [shownLength, fullText]);

  return (
    <Text style={styles.bubbleText}>{fullText.slice(0, shownLength)}</Text>
  );
}

export default function AIChat() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", sender: "bot", text: WELCOME_TEXT, isTyping: true },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachMenuVisible, setAttachMenuVisible] = useState(false);

  const scrollToEnd = () => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    scrollToEnd();

    try {
      const history: ChatApiMessage[] = [...messages, userMsg]
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }));

      const reply = await sendAiChatMessage(history);

      const botMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "bot",
        text: reply,
        isTyping: true, // 답변이 오면 타이핑 효과로 표시
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "bot",
        text: "죄송해요, 지금 답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요. 급하시면 매장으로 바로 전화 주세요 (0507-1410-7634).",
        isTyping: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  };

  // 타이핑이 끝나면 그 메시지의 isTyping을 false로 바꿔서, 다음부터는
  // 그냥 고정 텍스트로 렌더링되도록 합니다 (재마운트 시 다시 타이핑되는 것 방지).
  const handleTypingDone = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isTyping: false } : m)),
    );
  };

  const addAttachmentMessage = (
    description: string,
    extra: Partial<ChatMessage>,
  ) => {
    const msg: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: description,
      ...extra,
    };
    setMessages((prev) => [...prev, msg]);
    scrollToEnd();
  };

  const handleCamera = async () => {
    setAttachMenuVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("알림", "카메라 접근 권한이 필요합니다.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      addAttachmentMessage("사진을 보냈어요.", {
        imageUri: result.assets[0].uri,
      });
    }
  };

  const handlePhotos = async () => {
    setAttachMenuVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("알림", "사진 보관함 접근 권한이 필요합니다.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      addAttachmentMessage("사진을 보냈어요.", {
        imageUri: result.assets[0].uri,
      });
    }
  };

  const handleFiles = async () => {
    setAttachMenuVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        addAttachmentMessage(`파일을 보냈어요: ${result.assets[0].name}`, {
          fileName: result.assets[0].name,
        });
      }
    } catch {
      Alert.alert("오류", "파일을 선택할 수 없습니다.");
    }
  };

  const handleVoicePress = () => {
    Alert.alert("음성 입력", "음성으로 질문하는 기능은 준비 중입니다.");
  };

  const ATTACH_OPTIONS = [
    {
      key: "camera",
      icon: "camera-outline" as const,
      label: "카메라",
      onPress: handleCamera,
    },
    {
      key: "photos",
      icon: "image-outline" as const,
      label: "사진",
      onPress: handlePhotos,
    },
    {
      key: "files",
      icon: "document-outline" as const,
      label: "파일",
      onPress: handleFiles,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {/* 다크 헤더 */}
        <SafeAreaView edges={["top"]} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={20} color={Palette.cream} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.botIconWrap}>
              <Ionicons name="sparkles" size={14} color={Palette.gold} />
            </View>
            <View>
              <Text style={styles.eyebrow}>AI CONCIERGE</Text>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle}>성공식당 상담원</Text>
                <View style={styles.onlineDot} />
              </View>
            </View>
          </View>
          <View style={{ width: 34 }} />
        </SafeAreaView>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={scrollToEnd}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubbleRow,
                item.sender === "user" && styles.bubbleRowUser,
              ]}
            >
              {item.sender === "bot" && (
                <View style={styles.botAvatar}>
                  <Ionicons
                    name="sparkles"
                    size={13}
                    color={Palette.amberDeep}
                  />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  item.sender === "user" ? styles.bubbleUser : styles.bubbleBot,
                ]}
              >
                {item.imageUri && (
                  <Image
                    source={{ uri: item.imageUri }}
                    style={styles.attachImage}
                  />
                )}
                {item.fileName && (
                  <View style={styles.fileChip}>
                    <Ionicons
                      name="document-text"
                      size={14}
                      color={Palette.amberDeep}
                    />
                    <Text style={styles.fileChipText} numberOfLines={1}>
                      {item.fileName}
                    </Text>
                  </View>
                )}

                {item.sender === "bot" && item.isTyping ? (
                  <TypingText
                    fullText={item.text}
                    onDone={() => handleTypingDone(item.id)}
                  />
                ) : (
                  <Text
                    style={[
                      styles.bubbleText,
                      item.sender === "user" && styles.bubbleTextUser,
                    ]}
                  >
                    {item.text}
                  </Text>
                )}
              </View>
            </View>
          )}
          ListFooterComponent={
            loading ? (
              <View style={[styles.bubbleRow]}>
                <View style={styles.botAvatar}>
                  <Ionicons
                    name="sparkles"
                    size={13}
                    color={Palette.amberDeep}
                  />
                </View>
                <View
                  style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}
                >
                  <ActivityIndicator size="small" color={Palette.amberDeep} />
                </View>
              </View>
            ) : null
          }
        />

        {messages.length <= 1 && (
          <View style={styles.quickRow}>
            {QUICK_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.quickChip}
                onPress={() => sendMessage(q)}
              >
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 입력 바 — 헤더와 동일한 차콜 톤 */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.plusBtn}
            onPress={() => setAttachMenuVisible(true)}
          >
            <Ionicons name="add" size={22} color={Palette.cream} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="무엇이든 물어보세요"
            placeholderTextColor={Palette.inkFaint}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            multiline
          />

          {input.trim().length > 0 ? (
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => sendMessage(input)}
              disabled={loading}
            >
              <Ionicons name="arrow-up" size={18} color={Palette.charcoal} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.voiceBtn}
              onPress={handleVoicePress}
            >
              <Ionicons name="mic-outline" size={19} color={Palette.cream} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* + 버튼 액션 시트 */}
      <Modal
        visible={attachMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setAttachMenuVisible(false)}
        >
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>첨부하기</Text>
            <View style={styles.sheetOptionsRow}>
              {ATTACH_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={styles.sheetOption}
                  onPress={opt.onPress}
                >
                  <View style={styles.sheetIconWrap}>
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={Palette.amberDeep}
                    />
                  </View>
                  <Text style={styles.sheetOptionLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setAttachMenuVisible(false)}
            >
              <Text style={styles.sheetCancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.cream },

  header: {
    backgroundColor: Palette.charcoal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  botIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(201,98,46,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  eyebrow: {
    color: Palette.gold,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.cream,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.success,
  },

  chatList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm + 4,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  botAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.amberSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  bubbleBot: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: 4,
    ...Shadow.card,
  },
  bubbleUser: {
    backgroundColor: Palette.charcoal,
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 13.5,
    color: Palette.ink,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: Palette.cream,
  },
  typingBubble: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md + 4,
  },
  attachImage: {
    width: 160,
    height: 160,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Palette.amberSoft,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
    maxWidth: 220,
  },
  fileChipText: {
    fontSize: 11,
    color: Palette.amberDeep,
    fontWeight: "600",
    flexShrink: 1,
  },

  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  quickChip: {
    backgroundColor: Palette.amberSoft,
    borderWidth: 1,
    borderColor: Palette.amber,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Palette.amberDeep,
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    paddingBottom: Spacing.lg,
    backgroundColor: Palette.charcoal,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 6,
    fontSize: 14,
    color: Palette.cream,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.gold,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  voiceBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },

  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.lg + 4,
    borderTopRightRadius: Radius.lg + 4,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.line,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Palette.inkSoft,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  sheetOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.lg,
  },
  sheetOption: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  sheetIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.amberSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetOptionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Palette.inkSoft,
  },
  sheetCancelBtn: {
    backgroundColor: Palette.creamDim,
    paddingVertical: Spacing.sm + 6,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: Palette.inkSoft,
  },
});
