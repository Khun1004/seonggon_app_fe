// components/contexts/RoomsContext.tsx
import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import { BASE_URL, resolvePhotoUrl } from "@/constants/api";
import { ROOM_IMAGE_FALLBACK } from "@/constants/roomImageFallback";

export type RoomCategory =
  | "hall"
  | "small"
  | "medium"
  | "large"
  | "group_room"
  | "group_large"
  | "group_hall";

export type RoomOption = {
  id: string; // roomKey — 예약 데이터가 참조하는 고유 문자열
  number: string;
  floor: 1 | 2;
  category: RoomCategory;
  categoryLabel: string;
  capacity: string;
  isRoom: boolean;
  note?: string;
  image?: any;
};

export type RoomGroup = {
  category: RoomCategory;
  categoryLabel: string;
  isRoom: boolean;
  note?: string;
  rooms: RoomOption[];
};

type BackendRoom = {
  id: number;
  roomKey: string;
  number: string;
  floor: number;
  category: string;
  categoryLabel: string;
  capacity: string;
  isRoom: boolean;
  note?: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
};

function toRoomOption(r: BackendRoom): RoomOption {
  // React Native의 Image는 로컬 사진(require() 결과, 숫자)과 서버 사진(문자열
  // 주소)을 다르게 받아요 — 서버 주소는 반드시 { uri: "..." } 형태로 감싸야
  // 해요. 문자열을 그냥 넣으면 조용히 아무것도 안 그려집니다.
  const resolvedUrl = resolvePhotoUrl(r.imageUrl);
  const image = resolvedUrl
    ? { uri: resolvedUrl }
    : (ROOM_IMAGE_FALLBACK[r.roomKey] ?? undefined);

  return {
    id: r.roomKey,
    number: r.number,
    floor: r.floor === 2 ? 2 : 1,
    category: r.category as RoomCategory,
    categoryLabel: r.categoryLabel,
    capacity: r.capacity,
    isRoom: r.isRoom,
    note: r.note,
    image,
  };
}

// 같은 카테고리 안에서도 좌석마다 인원수가 다를 수 있어서, "2명 ~ 8명"처럼
// 그 카테고리 전체를 아우르는 범위를 계산해줍니다.
export function getGroupCapacityRange(rooms: RoomOption[]): string {
  const numbers = rooms
    .flatMap((r) => r.capacity.match(/\d+/g) ?? [])
    .map(Number);
  if (numbers.length === 0) return "";
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  return min === max ? `${min}명` : `${min}명 ~ ${max}명`;
}

function groupRoomsByCategoryImpl(rooms: RoomOption[]): RoomGroup[] {
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

type RoomsContextType = {
  rooms: RoomOption[];
  loading: boolean;
  refreshRooms: () => void;
  findRoomById: (id: string) => RoomOption | undefined;
  groupRoomsByCategory: (rooms?: RoomOption[]) => RoomGroup[];
  groupFloor1Rooms: () => RoomGroup[];
  groupFloor2Rooms: () => RoomGroup[];
};

export const RoomsContext = createContext<RoomsContextType>({
  rooms: [],
  loading: true,
  refreshRooms: () => {},
  findRoomById: () => undefined,
  groupRoomsByCategory: () => [],
  groupFloor1Rooms: () => [],
  groupFloor2Rooms: () => [],
});

export const RoomsProvider = ({ children }: { children: ReactNode }) => {
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshRooms = useCallback(() => {
    setLoading(true);
    fetch(`${BASE_URL}/api/rooms`)
      .then((res) => {
        if (!res.ok) throw new Error("좌석 정보를 불러오지 못했습니다.");
        return res.json();
      })
      .then((data: BackendRoom[]) => setRooms(data.map(toRoomOption)))
      .catch(() => {
        // 조용히 무시 — 좌석을 못 불러와도 나머지 화면은 계속 쓸 수 있게
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  const findRoomById = useCallback(
    (id: string) => rooms.find((r) => r.id === id),
    [rooms],
  );

  const groupRoomsByCategory = useCallback(
    (targetRooms?: RoomOption[]) =>
      groupRoomsByCategoryImpl(
        targetRooms ?? rooms.filter((r) => r.floor === 1),
      ),
    [rooms],
  );

  const groupFloor1Rooms = useCallback(
    () => groupRoomsByCategoryImpl(rooms.filter((r) => r.floor === 1)),
    [rooms],
  );

  const groupFloor2Rooms = useCallback(
    () => groupRoomsByCategoryImpl(rooms.filter((r) => r.floor === 2)),
    [rooms],
  );

  return (
    <RoomsContext.Provider
      value={{
        rooms,
        loading,
        refreshRooms,
        findRoomById,
        groupRoomsByCategory,
        groupFloor1Rooms,
        groupFloor2Rooms,
      }}
    >
      {children}
    </RoomsContext.Provider>
  );
};
