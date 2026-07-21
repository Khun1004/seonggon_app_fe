// constants/adminSpotApi.ts
import { BASE_URL } from "@/constants/api";

export type AdminNearbySpot = {
  id: number;
  name: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  sortOrder: number;
};

export type UpsertSpotPayload = {
  name: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  sortOrder: number;
};

export async function getAdminSpots(
  adminPassword: string,
): Promise<AdminNearbySpot[]> {
  const res = await fetch(`${BASE_URL}/api/admin/nearby-spots`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (res.status === 401) throw new Error("관리자 인증이 만료되었습니다.");
  if (!res.ok) throw new Error("명소 목록을 불러오지 못했습니다.");
  return (await res.json()) as AdminNearbySpot[];
}

export async function createAdminSpot(
  payload: UpsertSpotPayload,
  adminPassword: string,
): Promise<AdminNearbySpot> {
  const res = await fetch(`${BASE_URL}/api/admin/nearby-spots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("명소 추가에 실패했습니다.");
  return (await res.json()) as AdminNearbySpot;
}

export async function updateAdminSpot(
  id: number,
  payload: UpsertSpotPayload,
  adminPassword: string,
): Promise<AdminNearbySpot> {
  const res = await fetch(`${BASE_URL}/api/admin/nearby-spots/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("명소 수정에 실패했습니다.");
  return (await res.json()) as AdminNearbySpot;
}

export async function deleteAdminSpot(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/nearby-spots/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("명소 삭제에 실패했습니다.");
}

export async function uploadAdminSpotPhoto(
  imageBase64: string,
  adminPassword: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/admin/nearby-spots/upload-photo`, {
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
