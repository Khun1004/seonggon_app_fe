// constants/rooms-data.ts
// 1층 / 2층 좌석·룸 정보 — 좌석 안내 화면과 예약 화면에서 공용으로 사용합니다.

export type RoomCategory =
  | "hall" // 1층 일반 홀 좌석
  | "small" // 1층 프라이빗 룸 (소형)
  | "medium" // 1층 프라이빗 룸 (중형)
  | "large" // 1층 프라이빗 룸 (대형)
  | "group_room" // 2층 단체 룸 (소형)
  | "group_large" // 2층 단체 룸 (대형)
  | "group_hall"; // 2층 대형 홀 (단체석)

export type RoomOption = {
  id: string; // 예약 데이터에 저장되는 고유 id
  number: string; // 화면에 보여줄 번호
  floor: 1 | 2;
  category: RoomCategory;
  categoryLabel: string;
  capacity: string;
  isRoom: boolean; // true면 독립 룸, false면 홀 좌석
  note?: string;
  image?: any; // require()된 실제 룸 사진 (있는 경우만, 대표 사진)
  images?: { label: string; image: any }[]; // 여러 장인 경우 (예: 대형룸이 7/8/9번 배치로 쓰일 때)
};

// 일반 홀 전체 모습 (1층) — 각 테이블 갤러리의 첫 사진으로 함께 보여줍니다.
const HALL_OVERVIEW_IMAGE = require("../assets/seat_images/1F_All.jpg");

export const FLOOR1_ROOMS: RoomOption[] = [
  // 일반 홀 좌석 1번 ~ 6번 — 테이블별 실제 사진 + 전체 모습을 갤러리로 보여줍니다.
  {
    id: "hall-1",
    number: "1",
    floor: 1,
    category: "hall",
    categoryLabel: "일반 홀 좌석",
    capacity: "4명 ~ 8명",
    isRoom: false,
    image: require("../assets/seat_images/1F_1T_5T_6T.jpg"),
    images: [
      { label: "전체 모습", image: HALL_OVERVIEW_IMAGE },
      {
        label: "1번 테이블",
        image: require("../assets/seat_images/1F_1T_5T_6T.jpg"),
      },
    ],
  },
  {
    id: "hall-2",
    number: "2",
    floor: 1,
    category: "hall",
    categoryLabel: "일반 홀 좌석",
    capacity: "4명 ~ 6명",
    isRoom: false,
    image: require("../assets/seat_images/1F_2T_3T.jpg"),
    images: [
      { label: "전체 모습", image: HALL_OVERVIEW_IMAGE },
      {
        label: "2번 테이블",
        image: require("../assets/seat_images/1F_2T_3T.jpg"),
      },
    ],
  },
  {
    id: "hall-3",
    number: "3",
    floor: 1,
    category: "hall",
    categoryLabel: "일반 홀 좌석",
    capacity: "4명 ~ 6명",
    isRoom: false,
    image: require("../assets/seat_images/1F_2T_3T.jpg"),
    images: [
      { label: "전체 모습", image: HALL_OVERVIEW_IMAGE },
      {
        label: "3번 테이블",
        image: require("../assets/seat_images/1F_2T_3T.jpg"),
      },
    ],
  },
  {
    id: "hall-4",
    number: "4",
    floor: 1,
    category: "hall",
    categoryLabel: "일반 홀 좌석",
    capacity: "4명 ~ 6명",
    isRoom: false,
    image: require("../assets/seat_images/1F_4T.jpg"),
    images: [
      { label: "전체 모습", image: HALL_OVERVIEW_IMAGE },
      {
        label: "4번 테이블",
        image: require("../assets/seat_images/1F_4T.jpg"),
      },
    ],
  },
  {
    id: "hall-5",
    number: "5",
    floor: 1,
    category: "hall",
    categoryLabel: "일반 홀 좌석",
    capacity: "2명 ~ 4명",
    isRoom: false,
    image: require("../assets/seat_images/1F_1T_5T_6T.jpg"),
    images: [
      { label: "전체 모습", image: HALL_OVERVIEW_IMAGE },
      {
        label: "5번 테이블",
        image: require("../assets/seat_images/1F_1T_5T_6T.jpg"),
      },
    ],
  },
  {
    id: "hall-6",
    number: "6",
    floor: 1,
    category: "hall",
    categoryLabel: "일반 홀 좌석",
    capacity: "2명 ~ 4명",
    isRoom: false,
    image: require("../assets/seat_images/1F_1T_5T_6T.jpg"),
    images: [
      { label: "전체 모습", image: HALL_OVERVIEW_IMAGE },
      {
        label: "6번 테이블",
        image: require("../assets/seat_images/1F_1T_5T_6T.jpg"),
      },
    ],
  },
  // 프라이빗 룸 (소형) 15번, 16번
  {
    id: "small-15",
    number: "15",
    floor: 1,
    category: "small",
    categoryLabel: "프라이빗 룸 (소형)",
    capacity: "2명 ~ 4명",
    isRoom: true,
    note: "신발을 벗고 들어가는 룸입니다.",
    image: require("../assets/seat_images/1F_15R.jpg"),
  },
  {
    id: "small-16",
    number: "16",
    floor: 1,
    category: "small",
    categoryLabel: "프라이빗 룸 (소형)",
    capacity: "2명 ~ 4명",
    isRoom: true,
    note: "신발을 벗고 들어가는 룸입니다.",
    image: require("../assets/seat_images/1F_16R.jpg"),
  },
  // 프라이빗 룸 (중형) 13번, 14번
  {
    id: "medium-13",
    number: "13",
    floor: 1,
    category: "medium",
    categoryLabel: "프라이빗 룸 (중형)",
    capacity: "4명 ~ 8명",
    isRoom: true,
    note: "신발을 벗고 들어가는 룸입니다.",
    image: require("../assets/seat_images/1F_13R.jpg"),
  },
  {
    id: "medium-14",
    number: "14",
    floor: 1,
    category: "medium",
    categoryLabel: "프라이빗 룸 (중형)",
    capacity: "4명 ~ 8명",
    isRoom: true,
    note: "신발을 벗고 들어가는 룸입니다.",
    image: require("../assets/seat_images/1F_14R.jpg"),
  },
  // 프라이빗 룸 (대형) 7번 — 상황에 따라 8번, 9번도 함께 배정될 수 있음
  {
    id: "large-7",
    number: "7",
    floor: 1,
    category: "large",
    categoryLabel: "프라이빗 룸 (대형)",
    capacity: "4명 ~ 10명",
    isRoom: true,
    note: "예약 상황에 따라 7번 · 8번 · 9번 룸이 함께 배정될 수 있습니다.",
    image: require("../assets/seat_images/1F_7R_7R.jpg"),
    images: [
      { label: "전체 모습", image: require("../assets/seat_images/1F_7R.jpg") },
      {
        label: "7번 자리",
        image: require("../assets/seat_images/1F_7R_7R.jpg"),
      },
      {
        label: "8번 자리",
        image: require("../assets/seat_images/1F_7R_8R.jpg"),
      },
      {
        label: "9번 자리",
        image: require("../assets/seat_images/1F_7R_9R.jpg"),
      },
    ],
  },
];

export const FLOOR2_ROOMS: RoomOption[] = [
  // 단체 룸 (소형) 1번, 2번
  {
    id: "2f-1",
    number: "1",
    floor: 2,
    category: "group_room",
    categoryLabel: "단체 룸 (소형)",
    capacity: "4명 ~ 8명",
    isRoom: true,
    note: "회식 및 소모임에 알맞은 룸입니다.",
    image: require("../assets/seat_images/2F_1R.jpg"),
  },
  {
    id: "2f-2",
    number: "2",
    floor: 2,
    category: "group_room",
    categoryLabel: "단체 룸 (소형)",
    capacity: "4명 ~ 8명",
    isRoom: true,
    note: "회식 및 소모임에 알맞은 룸입니다.",
    image: require("../assets/seat_images/2F_2R.jpg"),
  },
  // 단체 룸 (대형) 5번
  {
    id: "2f-5",
    number: "5",
    floor: 2,
    category: "group_large",
    categoryLabel: "단체 룸 (대형)",
    capacity: "4명 ~ 16명",
    isRoom: true,
    note: "단체 회식, 모임에 적합한 넓은 룸입니다.",
    image: require("../assets/seat_images/2F_5R.jpg"),
  },
  // 대형 홀 (단체석) 6번
  {
    id: "2f-6",
    number: "6",
    floor: 2,
    category: "group_hall",
    categoryLabel: "대형 홀 (단체석)",
    capacity: "4명 ~ 80명",
    isRoom: false,
    note: "기업 회식, 대가족 모임 등 단체 예약 시 홀 전체를 사용하실 수 있습니다.",
    image: require("../assets/seat_images/2F_6R_1.jpg"),
  },
];

export const ALL_ROOMS: RoomOption[] = [...FLOOR1_ROOMS, ...FLOOR2_ROOMS];

export function findRoomById(id: string): RoomOption | undefined {
  return ALL_ROOMS.find((r) => r.id === id);
}

// 같은 카테고리(예: 일반 홀 좌석) 안에서도 테이블마다 인원수가 다를 수 있어서,
// "2명 ~ 8명"처럼 그 카테고리 전체를 아우르는 범위를 계산해줍니다.
export function getGroupCapacityRange(rooms: RoomOption[]): string {
  const numbers = rooms
    .flatMap((r) => r.capacity.match(/\d+/g) ?? [])
    .map(Number);
  if (numbers.length === 0) return "";
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  return min === max ? `${min}명` : `${min}명 ~ ${max}명`;
}

// ── 예약 가능 시간 ──────────────────────────────────────────────
// 영업시간 11:00~21:00 기준, 네이버 예약처럼 자리 없이 시간만 고르는 방식이
// 아니라 자리도 같이 고르기 때문에, 1시간 단위로 딱 끊어서 예약을 받습니다.
// (1회 이용 시간 1시간 — 그 이상 이용은 전화 문의, 주말·공휴일 등 시간 초과 시
// 별도 요금이 발생할 수 있다는 안내는 예약 화면 안내문구에서 함께 보여줍니다.)
// 예약 화면(Reservation.tsx)과 좌석 안내 화면(Seats/RoomDetail)이
// 이 배열 하나를 함께 참조해서 항상 같은 시간이 보이도록 합니다.
export const CLOSING_TIME = "21:00";
export const RESERVATION_TIME_SLOTS = [
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

export type RoomGroup = {
  category: RoomCategory;
  categoryLabel: string;
  isRoom: boolean;
  note?: string;
  rooms: RoomOption[];
};

// 카테고리별로 묶어서 반환 (좌석 안내/예약 화면에서 그룹 렌더링용).
// rooms를 안 넘기면 기존 동작 그대로 1층 기준으로 묶입니다.
export function groupRoomsByCategory(
  rooms: RoomOption[] = FLOOR1_ROOMS,
): RoomGroup[] {
  const order: RoomCategory[] = [];
  for (const r of rooms) {
    if (!order.includes(r.category)) order.push(r.category);
  }
  return order.map((category) => {
    const catRooms = rooms.filter((r) => r.category === category);
    return {
      category,
      categoryLabel: catRooms[0]?.categoryLabel ?? "",
      isRoom: catRooms[0]?.isRoom ?? true,
      note: catRooms.find((r) => r.note)?.note,
      rooms: catRooms,
    };
  });
}

export function groupFloor1Rooms(): RoomGroup[] {
  return groupRoomsByCategory(FLOOR1_ROOMS);
}

export function groupFloor2Rooms(): RoomGroup[] {
  return groupRoomsByCategory(FLOOR2_ROOMS);
}
