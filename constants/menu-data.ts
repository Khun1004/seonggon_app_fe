// constants/menu-data.ts
export type IngredientInfo = {
  name: string;
  image: any; // require()된 로컬 이미지 또는 URL 문자열
};

export const EXTRA_MENU: ExtraMenuItem[] = [
  { id: "e1", name: "공깃밥", price: "2,000원" },
  { id: "e2", name: "볶음밥", price: "5,000원" },
  { id: "e3", name: "누룽지", price: "5,000원" },
  {
    id: "e4",
    name: "고기 300g 추가",
    price: "20,000원",
  },
  { id: "e5", name: "능이버섯 추가", price: "15,000원" },
];

export type ExtraMenuItem = {
  id: string;
  name: string;
  price: string;
  note?: string; // 추가 설명 (예: "1인분 기준")
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceVal: number;
  isHot?: boolean;
  image: any; // require()된 로컬 이미지
  mushrooms?: IngredientInfo[]; // 들어간 재료(버섯 등) — "종류" 탭에서 표시
};

// 백숙류 전체에 공통으로 들어가는 11종 버섯
// 사장님이 보내주신 포스터 기준 — 사진은 임시 URL로 채워뒀습니다.
// 실제 사진 파일을 assets/images/mushrooms/ 에 넣어주시면 require()로 교체해드릴게요.
const ALL_MUSHROOMS: IngredientInfo[] = [
  {
    name: "에노타리버섯",
    image:
      "https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=200&q=80",
  },
  {
    name: "만가닥버섯",
    image:
      "https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=200&q=80",
  },
  {
    name: "표고버섯",
    image:
      "https://images.unsplash.com/photo-1607330289028-33860ee31c5a?w=200&q=80",
  },
  {
    name: "양송이버섯",
    image:
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&q=80",
  },
  {
    name: "건백목이버섯",
    image:
      "https://images.unsplash.com/photo-1611171711912-bc15ce7e6f8e?w=200&q=80",
  },
  {
    name: "건흑목이버섯",
    image:
      "https://images.unsplash.com/photo-1502741126161-b048400d085d?w=200&q=80",
  },
  {
    name: "새송이버섯",
    image:
      "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=200&q=80",
  },
  {
    name: "황금팽이버섯",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80",
  },
  {
    name: "팽이버섯",
    image:
      "https://images.unsplash.com/photo-1622597489970-9a55c5c0a376?w=200&q=80",
  },
  {
    name: "백만송이버섯",
    image:
      "https://images.unsplash.com/photo-1635347561344-7c8830a3d0c1?w=200&q=80",
  },
  {
    name: "초고버섯",
    image:
      "https://images.unsplash.com/photo-1626685307744-c2c1a2d2a2e8?w=200&q=80",
  },
];

export const MENU_DATA: Record<string, MenuItem[]> = {
  백숙: [
    {
      id: "b1",
      name: "능이오리백숙",
      description:
        "48시간 정성 우려낸 진국에 능이와 오리를 담은 품격 있는 보양 백숙",
      price: "69,000원",
      priceVal: 69000,
      isHot: true,
      image: require("../assets/images/능이오리백수.jpeg"),
      mushrooms: ALL_MUSHROOMS,
    },
    {
      id: "b2",
      name: "능이닭백숙",
      description:
        "48시간 정성으로 우린 육수에 능이와 토종닭을 넣어 끓여낸 깊은 맛의 진국 백숙",
      price: "65,000원",
      priceVal: 65000,
      image: require("../assets/images/능이오리백수.jpeg"),
      mushrooms: ALL_MUSHROOMS,
    },
    {
      id: "b3",
      name: "닭백숙",
      description:
        "24시간 비법육수와 백숙 본연의 국물을 섞어 또 24시간 끓여 만든 진국백숙",
      price: "55,000원",
      priceVal: 55000,
      image: require("../assets/images/능이오리백수.jpeg"),
      mushrooms: ALL_MUSHROOMS,
    },
    {
      id: "b4",
      name: "오리백숙",
      description:
        "24시간 비법육수와 백숙 본연의 국물을 섞어 또 24시간 끓여 만든 진국백숙",
      price: "60,000원",
      priceVal: 60000,
      image: require("../assets/images/능이오리백수.jpeg"),
      mushrooms: ALL_MUSHROOMS,
    },
  ],
  고기: [
    {
      id: "g1",
      name: "산더미 오리간장불고기 3-4인",
      description:
        "성공식당 특제 간장소스가 더해진 유황오리와 신선 채소의 산더미 별미 메뉴",
      price: "54,000원",
      priceVal: 54000,
      isHot: true,
      image: require("../assets/images/산더미오리간장불고기.jpeg"),
    },
    {
      id: "g2",
      name: "산더미 오리간장불고기 2인",
      description:
        "유황오리를 급냉하여 얇게 썰어 신선한 야채와 특제소스로 버무린 메뉴",
      price: "42,000원",
      priceVal: 42000,
      image: require("../assets/images/산더미오리간장불고기.jpeg"),
    },
    {
      id: "g3",
      name: "유황오리생불고기",
      description: "생오리에 특제 숙성양념을 더하여 만든 양념 오리불고기",
      price: "49,000원",
      priceVal: 49000,
      image: require("../assets/images/유황오리생불고기.jpeg"),
    },
    {
      id: "g4",
      name: "유황오리로스구이",
      description: "생오리에 들기름, 마늘을 넣어 고소하고 담백한 로스구이",
      price: "47,000원",
      priceVal: 47000,
      image: require("../assets/images/유황오리로스구이.jpeg"),
    },
  ],
  사이드: [
    {
      id: "s1",
      name: "해물파전",
      description: "오징어와 각종 야채를 넣어 바싹하게 튀긴 해물파전",
      price: "15,000원",
      priceVal: 15000,
      image: require("../assets/images/해물파전.jpeg"),
    },
    {
      id: "s2",
      name: "도토리묵",
      description: "탱글탱글한 수제 도토리묵",
      price: "9,000원",
      priceVal: 9000,
      image: require("../assets/images/도토리묵.jpeg"),
    },
    {
      id: "s3",
      name: "찹쌀동동주",
      description: "산지에서 직접 공수한 고소하고 달콤한 찹쌀동동주",
      price: "8,000원",
      priceVal: 8000,
      image: require("../assets/images/찹쌀동동주.jpeg"),
    },
  ],
};

export function resolveImageSource(image: any) {
  if (!image) return null;
  if (typeof image === "string") return { uri: image };
  return image; // require()는 그대로 number — Image source로 직접 사용 가능
}

export function findMenuItemById(id: string): MenuItem | undefined {
  for (const category of Object.values(MENU_DATA)) {
    const found = category.find((item) => item.id === id);
    if (found) return found;
  }
  return undefined;
}
