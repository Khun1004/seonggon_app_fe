// components/common/AddressSearchModal.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { Palette, Spacing } from "@/constants/theme";

// 다음(카카오) 우편번호 서비스를 웹뷰 안에서 띄워서, 손님/관리자가 직접
// 도로명 주소를 검색해서 고를 수 있게 해줘요. 주소를 고르면 우리 앱으로
// 메시지를 보내줘서, 입력칸에 자동으로 채워집니다.
const POSTCODE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body, #layer {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="layer"></div>
  <script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
  <script>
    function post(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }
    function start() {
      if (typeof daum === 'undefined' || !daum.Postcode) {
        // SDK가 아직 안 불러와졌으면 잠깐 기다렸다가 다시 시도해요.
        setTimeout(start, 200);
        return;
      }
      new daum.Postcode({
        oncomplete: function (data) {
          var fullAddress = data.address;
          var extra = '';
          if (data.addressType === 'R') {
            if (data.bname !== '') extra += data.bname;
            if (data.buildingName !== '') {
              extra += (extra !== '' ? ', ' + data.buildingName : data.buildingName);
            }
            if (extra !== '') fullAddress += ' (' + extra + ')';
          }
          post({ address: fullAddress, zonecode: data.zonecode });
        },
        onclose: function () {
          post({ closed: true });
        },
        width: '100%',
        height: '100%',
      }).embed(document.getElementById('layer'));
    }
    start();
  </script>
</body>
</html>
`;

// SafeAreaView는 Modal 안(별도의 화면 레이어)에서는 기기의 노치/상태바
// 높이를 못 읽어오는 경우가 있어서, 여기서는 확실한 값을 직접 계산해서 써요.
const TOP_INSET =
  Platform.OS === "ios" ? 54 : (StatusBar.currentHeight ?? 24) + 12;

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (address: string, zonecode: string) => void;
};

export default function AddressSearchModal({
  visible,
  onClose,
  onSelect,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === "ios" ? "fullScreen" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>주소 검색</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={16}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color={Palette.ink} />
          </TouchableOpacity>
        </View>

        <View style={styles.webviewWrap}>
          <WebView
            style={styles.webview}
            containerStyle={styles.webview}
            // html을 그냥 주면 웹뷰 안 페이지의 "주소"가 없는 상태(about:blank
            // 등)라서, 다음 우편번호 서비스가 필요로 하는 외부 요청들이 막히는
            // 경우가 있어요. baseUrl로 실제 https 주소를 지정해주면 이 문제가
            // 해결돼요.
            source={{ html: POSTCODE_HTML, baseUrl: "https://touch.daum.net" }}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={Palette.amberDeep} />
              </View>
            )}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.closed) {
                  onClose();
                  return;
                }
                if (data.address) {
                  onSelect(data.address, data.zonecode);
                  onClose();
                }
              } catch {
                // 무시
              }
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.white },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: TOP_INSET,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
    backgroundColor: Palette.white,
    zIndex: 10,
    elevation: 10,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: Palette.ink },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  webviewWrap: { flex: 1 },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.white,
  },
});
