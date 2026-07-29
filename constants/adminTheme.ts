/**
 * 관리자(사장님) 전용 색상 팔레트
 * 손님 앱의 따뜻한 앰버/크림 톤과 구분되도록, 차분한 슬레이트 네이비 +
 * 딥틸 액센트로 "업무용 뒷단" 느낌을 냈어요. 구조(키 이름)는 손님 팔레트와
 * 똑같이 맞춰서, 관리자 화면 파일에서는 import 한 줄만 바꾸면 전체 색이
 * 바뀌도록 했습니다.
 */

export const AdminPalette = {
  // Base
  charcoal: "#022c14", // 가장 깊은 배경 (헤더, 다크 섹션) — 네이비에 가까운 차콜
  charcoalSoft: "#0d3103", // 카드/서피스용 살짝 밝은 톤
  cream: "#F2F5F7", // 메인 배경 — 손님 앱의 크림 대신 쿨그레이
  creamDim: "#E4E9EE", // 보조 배경, 구분 영역

  // Signature accent — 앰버 대신 딥틸
  amber: "#1F7A6C",
  amberDeep: "#155C51",
  amberSoft: "#D8ECE8",

  // Gold accent 자리 — 스틸 블루로 대체 (골드 뱃지/강조용)
  gold: "#5C7A99",
  goldLight: "#B9CBDB",

  // Text
  ink: "#1A2027",
  inkSoft: "#5B6774",
  inkFaint: "#98A3AE",

  // Utility
  white: "#FFFFFF",
  line: "#D6DEE4",
  success: "#4B7F6E",
  error: "#B23A3A",
};

export { Radius, Shadow, Spacing } from "@/constants/theme";

