/**
 * 성공 레스토랑 앱 — 디자인 토큰
 * 컨셉: 깊은 차콜 + 따뜻한 크림 + 톤다운 앰버/골드
 * 단순 주황 단색 대신, 채도를 낮추고 깊이를 더해 "고급 한정식/파인다이닝" 느낌을 냄
 */

export const Palette = {
  // Base
  charcoal: '#1A1614',      // 가장 깊은 배경 (헤더, 다크 섹션)
  charcoalSoft: '#262019',  // 카드/서피스용 살짝 밝은 차콜
  cream: '#FBF6EE',         // 메인 배경 (종이/한지 느낌)
  creamDim: '#F1E9DA',      // 보조 배경, 구분 영역

  // Signature accent (기존 #F36F1F 보다 톤다운된 고급 버전)
  amber: '#C9622E',         // 메인 시그니처 컬러
  amberDeep: '#9A4A22',     // 눌림/active 상태
  amberSoft: '#EFD9C4',     // 연한 배경, 하이라이트 박스

  // Gold accent (구분선, 별점, 프리미엄 디테일)
  gold: '#B68A4E',
  goldLight: '#D9C49A',

  // Text
  ink: '#241F1A',           // 본문 텍스트
  inkSoft: '#6B6258',       // 보조 텍스트
  inkFaint: '#A39A8C',      // placeholder, disabled

  // Utility
  white: '#FFFFFF',
  line: '#E4D9C8',          // 구분선
  success: '#5B7B5A',
  error: '#A23E3E',
};

export const Colors = {
  light: {
    text: Palette.ink,
    textSoft: Palette.inkSoft,
    background: Palette.cream,
    surface: Palette.white,
    surfaceSoft: Palette.creamDim,
    tint: Palette.amber,
    tintDeep: Palette.amberDeep,
    gold: Palette.gold,
    icon: Palette.inkSoft,
    tabBarBackground: Palette.charcoal,
    tabIconDefault: '#8A8178',
    tabIconSelected: Palette.amber,
    border: Palette.line,
  },
  dark: {
    text: Palette.cream,
    textSoft: '#C9BFAE',
    background: Palette.charcoal,
    surface: Palette.charcoalSoft,
    surfaceSoft: '#211B16',
    tint: Palette.amber,
    tintDeep: Palette.amberDeep,
    gold: Palette.gold,
    icon: '#C9BFAE',
    tabBarBackground: Palette.charcoal,
    tabIconDefault: '#8A8178',
    tabIconSelected: Palette.amber,
    border: '#3A3128',
  },
};

export const Typography = {
  // Display: 메뉴명, 타이틀 등 — letterSpacing 넓혀 클래식한 느낌
  display: {
    fontFamily: undefined, // 시스템 세리프 fallback (아래 Fonts 참고)
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  // Body
  body: {
    fontWeight: '400' as const,
    letterSpacing: 0.1,
  },
  // Eyebrow / label (소문자+자간 넓은 라벨, "PRIVATE DINING" 류)
  eyebrow: {
    fontWeight: '600' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
};

export const Fonts = {
  serifDisplay: 'serif',     // iOS: Georgia 계열, Android: serif — 추후 expo-font로 커스텀 폰트 교체 가능
  sans: 'System',
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  tabBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
};
