// constants/adminMenuApi.ts
import { BASE_URL } from "@/constants/api";

export type AdminMenuIngredient = {
  name: string;
  imageUrl?: string;
};

export type AdminMenuItem = {
  id: number;
  category: string;
  name: string;
  description: string;
  price: string;
  priceVal: number;
  isHot: boolean;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
  ingredients: AdminMenuIngredient[];
};

export type UpsertMenuItemPayload = {
  category: string;
  name: string;
  description: string;
  price: string;
  priceVal: number;
  isHot: boolean;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
  ingredients?: AdminMenuIngredient[];
};

export async function getAdminMenus(
  adminPassword: string,
): Promise<AdminMenuItem[]> {
  const res = await fetch(`${BASE_URL}/api/admin/menu`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (res.status === 401) throw new Error("관리자 인증이 만료되었습니다.");
  if (!res.ok) throw new Error("메뉴 목록을 불러오지 못했습니다.");
  return (await res.json()) as AdminMenuItem[];
}

export async function createAdminMenu(
  payload: UpsertMenuItemPayload,
  adminPassword: string,
): Promise<AdminMenuItem> {
  const res = await fetch(`${BASE_URL}/api/admin/menu`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("메뉴 추가에 실패했습니다.");
  return (await res.json()) as AdminMenuItem;
}

export async function updateAdminMenu(
  id: number,
  payload: UpsertMenuItemPayload,
  adminPassword: string,
): Promise<AdminMenuItem> {
  const res = await fetch(`${BASE_URL}/api/admin/menu/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("메뉴 수정에 실패했습니다.");
  return (await res.json()) as AdminMenuItem;
}

export async function hideAdminMenu(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/menu/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("메뉴 숨기기에 실패했습니다.");
}

export async function deleteAdminMenu(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/menu/${id}/permanent`, {
    method: "DELETE",
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("메뉴 삭제에 실패했습니다.");
}

export async function restoreAdminMenu(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/menu/${id}/restore`, {
    method: "PATCH",
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("메뉴 복원에 실패했습니다.");
}

export async function uploadAdminMenuPhoto(
  imageBase64: string,
  adminPassword: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/admin/menu/upload-photo`, {
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
