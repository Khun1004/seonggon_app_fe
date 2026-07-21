// constants/roomImageFallback.ts
// 관리자가 아직 새 사진을 업로드하지 않은 "기존" 좌석들을 위한 대표 사진
// 매핑이에요. DB의 imageUrl이 비어있으면 이 로컬 사진을 대신 보여줍니다.
// (관리자가 사진을 새로 올리면 그때부터는 DB의 imageUrl이 우선이에요.)
// 새로 추가된 좌석(예: 10번)은 여기 없어서 기본 아이콘으로 보여요 — 정상입니다.
export const ROOM_IMAGE_FALLBACK: Record<string, any> = {
  "hall-1": require("../assets/seat_images/1F_1T_5T_6T.jpg"),
  "hall-2": require("../assets/seat_images/1F_2T_3T.jpg"),
  "hall-3": require("../assets/seat_images/1F_2T_3T.jpg"),
  "hall-4": require("../assets/seat_images/1F_4T.jpg"),
  "hall-5": require("../assets/seat_images/1F_1T_5T_6T.jpg"),
  "hall-6": require("../assets/seat_images/1F_1T_5T_6T.jpg"),
  "small-15": require("../assets/seat_images/1F_15R.jpg"),
  "small-16": require("../assets/seat_images/1F_16R.jpg"),
  "medium-13": require("../assets/seat_images/1F_13R.jpg"),
  "medium-14": require("../assets/seat_images/1F_14R.jpg"),
  "large-7": require("../assets/seat_images/1F_7R_7R.jpg"),
  "2f-1": require("../assets/seat_images/2F_1R.jpg"),
  "2f-2": require("../assets/seat_images/2F_2R.jpg"),
  "2f-5": require("../assets/seat_images/2F_5R.jpg"),
  "2f-6": require("../assets/seat_images/2F_6R_1.jpg"),
};

export const HALL_OVERVIEW_IMAGE = require("../assets/seat_images/1F_All.jpg");
