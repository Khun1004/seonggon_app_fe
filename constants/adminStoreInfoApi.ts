// constants/adminStoreInfoApi.ts
import { BASE_URL } from "@/constants/api";

export type AdminStoreInfoSection = {
  id: number;
  group: string;
  title: string;
  content: string;
  icon?: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
};

export type UpsertStoreInfoPayload = {
  group: string;
  title: string;
  content: string;
  icon?: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
};

export async function getAdminStoreInfo(
  adminPassword: string,
): Promise<AdminStoreInfoSection[]> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/admin/store-info`, {
      headers: { "X-Admin-Password": adminPassword },
    });
  } catch (networkError: any) {
    // fetch 자체가 실패하면(서버에 연결도 못 한 경우) 여기로 옵니다.
    throw new Error(
      `서버에 연결하지 못했습니다: ${networkError?.message ?? networkError}`,
    );
  }
  if (!res.ok) {
    // 정확한 원인을 알 수 있게, 상태 코드와 서버 응답 내용을 그대로 에러 메시지에 담습니다.
    const bodyText = await res.text().catch(() => "(응답 본문 없음)");
    throw new Error(
      `안내 문구를 불러오지 못했습니다. (status ${res.status}) ${bodyText}`,
    );
  }
  return (await res.json()) as AdminStoreInfoSection[];
}

export async function createAdminStoreInfo(
  payload: UpsertStoreInfoPayload,
  adminPassword: string,
): Promise<AdminStoreInfoSection> {
  const res = await fetch(`${BASE_URL}/api/admin/store-info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("추가에 실패했습니다.");
  return (await res.json()) as AdminStoreInfoSection;
}

export async function updateAdminStoreInfo(
  id: number,
  payload: UpsertStoreInfoPayload,
  adminPassword: string,
): Promise<AdminStoreInfoSection> {
  const res = await fetch(`${BASE_URL}/api/admin/store-info/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("수정에 실패했습니다.");
  return (await res.json()) as AdminStoreInfoSection;
}

export async function deleteAdminStoreInfo(
  id: number,
  adminPassword: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/store-info/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Password": adminPassword },
  });
  if (!res.ok) throw new Error("삭제에 실패했습니다.");
}

export async function uploadAdminStoreInfoPhoto(
  imageBase64: string,
  adminPassword: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/admin/store-info/upload-photo`, {
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
