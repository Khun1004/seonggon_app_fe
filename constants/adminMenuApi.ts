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
  // 세트를 쓰면 "세트 재료 + 추가 재료"가 합쳐진 최종 목록이에요 (손님 화면용).
  ingredients: AdminMenuIngredient[];
  // 세트를 쓰는 중이면, 이 메뉴만의 추가 재료만 따로 담겨 있어요 (수정 화면에서 씀).
  extraIngredients?: AdminMenuIngredient[];
  ingredientSetId?: number;
  ingredientSetName?: string;
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
  ingredientSetId?: number;
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

// ── 재료 세트 (여러 메뉴가 공유하는 재료 목록) ────────────────
export type AdminIngredientSet = {
  id: number;
  name: string;
  ingredients: AdminMenuIngredient[];
  usedByCount: number;
};

export type UpsertIngredientSetPayload = {
  name: string;
  ingredients: AdminMenuIngredient[];
};

export async function getAdminIngredientSets(
  adminPassword: string,
): Promise<AdminIngredientSet[]> {
  const res = await fetch(`${BASE_URL}/api/admin/ingredient-sets`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (res.status === 401) throw new Error("관리자 인증이 만료되었습니다.");
  if (!res.ok) throw new Error("재료 세트 목록을 불러오지 못했습니다.");
  return (await res.json()) as AdminIngredientSet[];
}

export async function createAdminIngredientSet(
  payload: UpsertIngredientSetPayload,
  adminPassword: string,
): Promise<AdminIngredientSet> {
  const res = await fetch(`${BASE_URL}/api/admin/ingredient-sets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("재료 세트 추가에 실패했습니다.");
  return (await res.json()) as AdminIngredientSet;
}

export async function updateAdminIngredientSet(
  id: number,
  payload: UpsertIngredientSetPayload,
  adminPassword: string,
): Promise<AdminIngredientSet> {
  const res = await fetch(`${BASE_URL}/api/admin/ingredient-sets/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("재료 세트 수정에 실패했습니다.");
  return (await res.json()) as AdminIngredientSet;
}

export async function deleteAdminIngredientSet(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/ingredient-sets/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "재료 세트 삭제에 실패했습니다.");
  }
}
