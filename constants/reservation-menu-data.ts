// constants/reservation-menu-data.ts
export type SimpleMenuItem = { id: string; name: string; price: string };

export const RESERVATION_MENU_DATA: Record<string, SimpleMenuItem[]> = {
  백숙: [
    { id: "b1", name: "능이오리백숙", price: "69,000원" },
    { id: "b2", name: "능이닭백숙", price: "65,000원" },
    { id: "b3", name: "닭백숙", price: "55,000원" },
    { id: "b4", name: "오리백숙", price: "60,000원" },
  ],
  고기: [
    { id: "g1", name: "산더미 오리간장불고기 3-4인", price: "54,000원" },
    { id: "g2", name: "산더미 오리간장불고기 2인", price: "42,000원" },
    { id: "g3", name: "유황오리생불고기", price: "49,000원" },
    { id: "g4", name: "유황오리로스구이", price: "47,000원" },
  ],
  사이드: [
    { id: "s1", name: "해물파전", price: "15,000원" },
    { id: "s2", name: "도토리묵", price: "9,000원" },
    { id: "s3", name: "찹쌀동동주", price: "8,000원" },
  ],
  "음료/주류": [
    { id: "d1", name: "음료 (펩시/사이다/탐스)", price: "2,000원" },
    { id: "a1", name: "주류 (소주/맥주/막걸리)", price: "5,000원" },
  ],
};

const ALL_ITEMS_MAP: Record<string, SimpleMenuItem> = Object.values(
  RESERVATION_MENU_DATA,
)
  .flat()
  .reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<string, SimpleMenuItem>,
  );

export function getReservationMenuName(id: string): string {
  return ALL_ITEMS_MAP[id]?.name ?? id;
}

export function getReservationMenuPrice(id: string): string | undefined {
  return ALL_ITEMS_MAP[id]?.price;
}

// "69,000원" -> 69000 (결제 화면에서 총액 계산할 때 사용)
export function getReservationMenuPriceNumber(id: string): number {
  const priceStr = ALL_ITEMS_MAP[id]?.price ?? "0";
  return Number(priceStr.replace(/[^0-9]/g, "")) || 0;
}
