// constants/store.ts
// 성공식당 매장 관련 공용 상수

export const STORE_NAME = "성공식당";
export const STORE_ADDRESS = "대구 동구 팔공산로199길 12";

// 주소를 포함해 검색하면 "성공식당"만 검색하는 것보다 정확하게 매장이 나옵니다.
// 다만 이건 "검색 결과" 링크라, 정확한 플레이스 페이지로 한 번에 이동하는 건 아니에요.
//
// ▶ 더 정확한 링크를 원하시면:
// 1. 네이버 지도 앱에서 "성공식당" 검색 → 팔공산로199길 12 매장 선택
// 2. 매장 페이지 우측 상단 "공유" 버튼 → "링크 복사"
// 3. 복사한 링크(예: https://naver.me/xxxxxxxx)를 아래 NAVER_PLACE_URL에 붙여넣기
export const NAVER_PLACE_URL =
  "https://map.naver.com/p/search/" +
  encodeURIComponent(`${STORE_NAME} ${STORE_ADDRESS}`);

// 네이버 플레이스 리뷰 탭으로 바로 이동하고 싶다면, 정확한 place id를 알게 된 후
// 아래 형태로 바꿔주세요 (place id는 매장 페이지 URL 안의 숫자입니다).
// export const NAVER_REVIEW_URL = "https://m.place.naver.com/restaurant/12345678/review/visitor";
export const NAVER_REVIEW_URL = NAVER_PLACE_URL;
