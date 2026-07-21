// app/_layout.tsx
import { AdminProvider } from "@/components/contexts/AdminContext";
import { AuthProvider } from "@/components/contexts/AuthContext";
import { CartProvider } from "@/components/contexts/CartContext";
import { NotificationProvider } from "@/components/contexts/NotificationContext";
import NotificationSync from "@/components/contexts/NotificationSync";
import NotificationToast from "@/components/contexts/NotificationToast";
import { ProfileProvider } from "@/components/contexts/ProfileContext";
import { ReservationProvider } from "@/components/contexts/ReservationContext";
import { ReviewProvider } from "@/components/contexts/ReviewContext";
import { RoomsProvider } from "@/components/contexts/RoomsContext";
import { VisitProvider } from "@/components/contexts/VisitContext";
import FloatingActions from "@/components/FloatingActions/FloatingActions";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "react-native-reanimated";

import { screenHeaderOptions } from "@/components/common/ScreenHeader";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AdminProvider>
      <AuthProvider>
        <ProfileProvider>
          <VisitProvider>
            <CartProvider>
              <ReservationProvider>
                <RoomsProvider>
                  <ReviewProvider>
                    <NotificationProvider>
                      <NotificationSync />
                      <NotificationToast />
                      <ThemeProvider
                        value={
                          colorScheme === "dark" ? DarkTheme : DefaultTheme
                        }
                      >
                        <Stack>
                          <Stack.Screen
                            name="(tabs)"
                            options={{ headerShown: false }}
                          />
                          <Stack.Screen
                            name="menu"
                            options={screenHeaderOptions(
                              "OUR MENU",
                              "메뉴 상세",
                            )}
                          />
                          <Stack.Screen
                            name="find-account"
                            options={screenHeaderOptions(
                              "ACCOUNT RECOVERY",
                              "계정 찾기",
                            )}
                          />
                          <Stack.Screen
                            name="my-info"
                            options={screenHeaderOptions(
                              "MY ACCOUNT",
                              "내 정보",
                            )}
                          />
                          {/* login, signup: 다크 톤 자체 헤더(브랜드 아이콘 느낌)를 그대로
                        살리고 싶어서 공용 헤더 대신 화면 자체 헤더 유지 */}
                          <Stack.Screen
                            name="login"
                            options={{ headerShown: false }}
                          />
                          <Stack.Screen
                            name="signup"
                            options={{ headerShown: false }}
                          />
                          {/* admin: 자체 하단 탭바가 있는 완전히 독립된 화면이라
                        공용 헤더도, 손님용 플로팅 버튼도 안 보이게 합니다. */}
                          <Stack.Screen
                            name="admin"
                            options={{ headerShown: false }}
                          />
                          {/* menu-detail: 히어로 이미지 위에 떠 있는 투명 오버레이 헤더라서
                        공용 헤더를 적용하면 디자인이 깨져요. 기존 화면 자체 헤더 유지 */}
                          <Stack.Screen
                            name="menu-detail"
                            options={{ headerShown: false }}
                          />
                          {/* room-detail: menu-detail과 동일하게 사진 위에 뜨는
                        투명 오버레이 뒤로가기 버튼을 자체적으로 그립니다 */}
                          <Stack.Screen
                            name="room-detail"
                            options={{ headerShown: false }}
                          />
                          {/* spot-detail: menu-detail/room-detail과 동일하게 사진 위에
                        뜨는 투명 오버레이 뒤로가기 버튼을 자체적으로 그립니다 */}
                          <Stack.Screen
                            name="spot-detail"
                            options={{ headerShown: false }}
                          />
                          <Stack.Screen
                            name="policy"
                            options={screenHeaderOptions(
                              "POLICY",
                              "약관 및 정책",
                            )}
                          />
                          <Stack.Screen
                            name="notice"
                            options={screenHeaderOptions("NOTICE", "공지사항")}
                          />
                          <Stack.Screen
                            name="faq"
                            options={screenHeaderOptions(
                              "FAQ",
                              "자주 묻는 질문",
                            )}
                          />
                          <Stack.Screen
                            name="payment-methods"
                            options={screenHeaderOptions(
                              "PAYMENT METHODS",
                              "결제 수단 관리",
                            )}
                          />
                          <Stack.Screen
                            name="payment-checkout"
                            options={screenHeaderOptions(
                              "CHECKOUT",
                              "결제하기",
                            )}
                          />
                          <Stack.Screen
                            name="payment-history"
                            options={screenHeaderOptions(
                              "PAYMENT HISTORY",
                              "결제 내역",
                            )}
                          />
                          <Stack.Screen
                            name="my-review"
                            options={screenHeaderOptions(
                              "MY REVIEWS",
                              "마이 리뷰",
                            )}
                          />
                          <Stack.Screen
                            name="review-reward"
                            options={screenHeaderOptions(
                              "REVIEW REWARD",
                              "리뷰 적립",
                            )}
                          />
                          <Stack.Screen
                            name="cart"
                            options={screenHeaderOptions("MY CART", "장바구니")}
                          />
                          <Stack.Screen
                            name="visit-history"
                            options={screenHeaderOptions(
                              "VISIT STAMP",
                              "방문 도장",
                            )}
                          />
                          <Stack.Screen
                            name="drinks"
                            options={screenHeaderOptions(
                              "DRINKS & BEVERAGES",
                              "음료 / 주류",
                            )}
                          />
                          <Stack.Screen
                            name="takeout"
                            options={screenHeaderOptions(
                              "TAKEOUT",
                              "포장 주문",
                            )}
                          />
                          <Stack.Screen
                            name="reservation-detail"
                            options={screenHeaderOptions(
                              "RESERVATION DETAIL",
                              "예약 상세",
                            )}
                          />
                          <Stack.Screen
                            name="recent-reservations"
                            options={screenHeaderOptions(
                              "RECENT RESERVATIONS",
                              "최근 예약 내역",
                            )}
                          />
                          <Stack.Screen
                            name="cancelled-reservations"
                            options={screenHeaderOptions(
                              "CANCELLED RESERVATIONS",
                              "취소 내역",
                            )}
                          />
                          <Stack.Screen
                            name="review-detail"
                            options={screenHeaderOptions(
                              "REVIEW DETAIL",
                              "리뷰 상세",
                            )}
                          />
                          <Stack.Screen
                            name="coupon"
                            options={screenHeaderOptions(
                              "REVIEW BENEFITS",
                              "리뷰 이벤트 쿠폰",
                            )}
                          />
                          {/* search: 헤더 자리에 실시간 검색창(TextInput)이 들어가는
                        특수 화면이라 공용 헤더 대신 기존 자체 헤더 유지 */}
                          <Stack.Screen
                            name="search"
                            options={{ headerShown: false }}
                          />
                          <Stack.Screen
                            name="home-info"
                            options={screenHeaderOptions(
                              "RESTAURANT DETAIL",
                              "성공식당의 상세",
                            )}
                          />
                          {/* reservation: 단계별로 제목/뒤로가기 동작이 바뀌어서,
                        Reservation.tsx 안에서 <Stack.Screen options={...}/>로
                        제목/뒤로가기/전화 버튼을 동적으로 덮어씁니다 */}
                          <Stack.Screen
                            name="reservation"
                            options={screenHeaderOptions(
                              "VISIT RESERVATION",
                              "방문 예약",
                            )}
                          />
                          <Stack.Screen
                            name="notification"
                            options={screenHeaderOptions(
                              "NOTIFICATIONS",
                              "알림",
                            )}
                          />
                          {/* ai-chat: 봇 아이콘 + 온라인 상태 점이 있는 다크 헤더를
                        그대로 살리고 싶어서 공용 헤더 대신 자체 헤더 유지 */}
                          <Stack.Screen
                            name="ai-chat"
                            options={{ headerShown: false }}
                          />
                          <Stack.Screen
                            name="review-guide"
                            options={screenHeaderOptions(
                              "HOW TO REVIEW",
                              "리뷰 작성법",
                            )}
                          />
                          <Stack.Screen
                            name="review-write"
                            options={screenHeaderOptions(
                              "WRITE A REVIEW",
                              "리뷰 작성하기",
                            )}
                          />
                          <Stack.Screen
                            name="modal"
                            options={{ presentation: "modal", title: "Modal" }}
                          />
                        </Stack>
                        <FloatingActions />
                        <StatusBar style="auto" />
                      </ThemeProvider>
                    </NotificationProvider>
                  </ReviewProvider>
                </RoomsProvider>
              </ReservationProvider>
            </CartProvider>
          </VisitProvider>
        </ProfileProvider>
      </AuthProvider>
    </AdminProvider>
  );
}
