// utils/reservationTimerNotifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { Reservation } from "@/components/contexts/ReservationContext";

// 앱이 켜져 있는 상태(포그라운드)에서도 알림 배너/소리가 뜨도록 설정합니다.
// 이 설정이 없으면 앱을 보고 있을 땐 알림이 조용히 무시될 수 있어요.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// 1회 이용 시간 (예약 화면과 동일하게 1시간으로 맞춰뒀어요 — 나중에 이용
// 시간 정책이 바뀌면 이 값도 함께 바꿔주세요).
export const RESERVATION_DURATION_MS = 60 * 60 * 1000;
const WARNING_BEFORE_END_MS = 5 * 60 * 1000; // 종료 5분 전

// 포장 주문은 "테이블 이용 시간"이라는 개념이 없어서(픽업 순간일 뿐이라)
// 이 카운트다운/알림 기능은 방문(dine_in) 예약에만 적용합니다.

// 예약 하나마다 알림 식별자를 고정해서, 다시 예약 목록을 불러올 때마다
// 같은 예약이면 중복 예약 없이 "덮어쓰기"가 되도록 합니다.
function notificationIdFor(reservationId: string): string {
  return `reservation-end-warning-${reservationId}`;
}

export function getReservationWindow(res: Reservation): {
  start: number;
  end: number;
} {
  const start = new Date(`${res.date}T${res.time}:00`).getTime();
  return { start, end: start + RESERVATION_DURATION_MS };
}

// 앱을 처음 켤 때나, 알림을 실제로 예약하기 직전에 권한을 요청합니다.
// 이미 허용/거부된 적이 있으면 시스템이 알아서 조용히 넘어가요.
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("reservation-timer", {
    name: "예약 이용 시간 알림",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

// 서버에서 예약 목록을 새로 받아올 때마다 호출하세요.
// - 아직 끝나지 않은 방문(dine_in) 예약: "종료 5분 전" 알림을 (다시) 예약합니다.
// - 취소되었거나 이미 끝난 예약: 예약해둔 알림을 취소합니다.
export async function syncReservationEndWarnings(reservations: Reservation[]) {
  const granted = await requestNotificationPermission();
  if (!granted) return;
  await ensureAndroidChannel();

  const now = Date.now();

  for (const res of reservations) {
    const id = notificationIdFor(res.id);

    if (res.type !== "dine_in" || res.status === "cancelled") {
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      continue;
    }

    const { end } = getReservationWindow(res);
    const fireAt = end - WARNING_BEFORE_END_MS;

    // 이미 지나간 시간이면 예약할 필요가 없어요 (취소만 해서 중복 방지).
    if (fireAt <= now) {
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      continue;
    }

    // 같은 id로 다시 예약하면 기존 것을 덮어써서, 시간이 바뀐 예약(메뉴 수정 등)도
    // 항상 최신 시간 기준으로 다시 잡힙니다.
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: "이용 시간이 5분 남았어요",
        body: `${res.roomLabel} 이용 시간이 곧 끝나요. 정리 부탁드려요 :)`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
        channelId: "reservation-timer",
      },
    });
  }
}

export async function cancelReservationEndWarning(reservationId: string) {
  await Notifications.cancelScheduledNotificationAsync(
    notificationIdFor(reservationId),
  ).catch(() => {});
}
