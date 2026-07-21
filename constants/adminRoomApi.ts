// constants/adminRoomApi.ts
import { BASE_URL } from "@/constants/api";

export type AdminRoom = {
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

export type UpsertRoomPayload = {
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

export async function getAdminRooms(
  adminPassword: string,
): Promise<AdminRoom[]> {
  const res = await fetch(`${BASE_URL}/api/admin/rooms`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (res.status === 401) throw new Error("관리자 인증이 만료되었습니다.");
  if (!res.ok) throw new Error("좌석 목록을 불러오지 못했습니다.");
  return (await res.json()) as AdminRoom[];
}

export async function createAdminRoom(
  payload: UpsertRoomPayload,
  adminPassword: string,
): Promise<AdminRoom> {
  const res = await fetch(`${BASE_URL}/api/admin/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("좌석 추가에 실패했습니다.");
  return (await res.json()) as AdminRoom;
}

export async function updateAdminRoom(
  id: number,
  payload: UpsertRoomPayload,
  adminPassword: string,
): Promise<AdminRoom> {
  const res = await fetch(`${BASE_URL}/api/admin/rooms/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("좌석 수정에 실패했습니다.");
  return (await res.json()) as AdminRoom;
}

export async function hideAdminRoom(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/rooms/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("좌석 숨기기에 실패했습니다.");
}

export async function restoreAdminRoom(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/rooms/${id}/restore`, {
    method: "PATCH",
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("좌석 복원에 실패했습니다.");
}

export async function uploadAdminRoomPhoto(
  imageBase64: string,
  adminPassword: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/admin/rooms/upload-photo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify({ imageBase64 }),
  });
  if (!res.ok) throw new Error("사진 업로드에 실패했습니다.");
  const data = await res.json();
  return data.url as string;
}
