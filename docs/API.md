# API 명세서 (API Specification)

> 시장에 가면 (서문시장 RPG) | 2026 단디톤

본 문서는 '시장에 가면' 서비스의 프론트엔드와 백엔드 간 연동을 위한 공식 REST API 명세서입니다.  
Figma 13개 화면 디자인 및 프론트엔드 최신 구조(`frontend/src/api/market.js`, `frontend/src/api/exploration.js`), 팀에서 확정한 10대 개발 정책을 바탕으로 작성되었습니다.

---

## 1. API 기본 정보 및 정책

| 항목 | 내용 |
|---|---|
| Base URL | `http://localhost:8080/api/v1` (배포 시 도메인 교체) |
| 통신 형식 | JSON (`application/json; charset=UTF-8`) |
| 문자 인코딩 | UTF-8 |
| 인증 방식 (MVP) | 단일 게스트 유저 자동 로그인 (`userId: 1`, 닉네임: '승우', 기본 코인: 1,000) |
| 날짜/시간 형식 | ISO 8601 (`yyyy-MM-dd'T'HH:mm:ss`) |

### 핵심 비즈니스 규칙
1. **구매 횟수 집계**: 구매 수량이 아닌 **주문 성공 건수(주문 메뉴 건당 +1회)**를 누적 구매 횟수로 인정합니다.
2. **보상 카운트 반영 시점**: `POST /api/v1/orders` (코인 결제 성공) 즉시 해당 음식의 누적 횟수가 증가하고 장비/배지 달성 조건이 갱신됩니다.
3. **장비 획득 기준 (Figma 반영)**: 1회(모자), 3회(자켓), 5회(신발), 8회(목도리)
4. **배지 획득 기준 (PRD 반영)**: 3회(브론즈), 5회(실버), 10회(골드)
5. **조리 상태 3단계**: `cooking`(조리 중) → `ready`(조리 완료) → `reviewed`(리뷰 작성 완료)
   - 조리 완료(`ready`) 상태의 주문만 리뷰 작성이 활성화됩니다.
6. **혼잡도 구간 (`~이상 ~미만`)**:
   - `0분 이상 5분 미만`: 여유 (NPC 1~2명)
   - `5분 이상 10분 미만`: 보통 (NPC 3~5명)
   - `10분 이상 20분 미만`: 혼잡 (NPC 6~8명)
   - `20분 이상`: 매우 혼잡 (NPC 9명 이상)

---

## 2. 공통 응답 포맷 (Common Response Format)

모든 API 응답은 아래의 공통 래퍼(Wrapper) 구조를 사용합니다.

### 2.1 성공 응답 (HTTP 200 / 201)
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### 2.2 오류 응답 (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "보유 코인이 부족해요. 수량을 줄여 주세요."
  }
}
```

#### 공통 에러 코드
| 에러 코드 | HTTP Status | 설명 |
|---|---|---|
| `INVALID_INPUT_VALUE` | 400 | 요청 파라미터 또는 바디의 유효성 검증 실패 |
| `USER_NOT_FOUND` | 404 | 사용자를 찾을 수 없음 |
| `STORE_NOT_FOUND` | 404 | 가게를 찾을 수 없음 |
| `MENU_NOT_FOUND` | 404 | 메뉴를 찾을 수 없음 |
| `ORDER_NOT_FOUND` | 404 | 주문 건을 찾을 수 없음 |
| `INSUFFICIENT_BALANCE` | 400 | 코인 잔액 부족 |
| `INVALID_ORDER_STATUS` | 400 | 조리 완료 상태가 아닌 주문에 리뷰 작성 시도 등 |
| `EQUIPMENT_LOCKED` | 400 | 아직 획득하지 않은 장비 착용 시도 |
| `QUEST_NOT_COMPLETED` | 400 | 아직 완료되지 않았거나 이미 수령한 퀘스트 보상 요청 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |

---

## 3. API 엔드포인트 목록

### 3.1 사용자 및 프로필 (도메인 A - BE1 추천)
| 기능 | Method | Endpoint | 설명 |
|---|---|---|---|
| 내 정보 조회 | `GET` | `/api/v1/users/me` | 기본 정보, 잔액, 레벨, 착용 장비 |
| 닉네임 변경 | `PATCH` | `/api/v1/users/me/nickname` | 닉네임 수정 (MVP 선택) |
| 장비 목록 조회 | `GET` | `/api/v1/profile/equipments` | 가방 탭: 획득 및 착용 여부 |
| 장비 착용/해제 | `PATCH` | `/api/v1/profile/equipments/{id}/toggle` | 장비 착용 또는 해제 |
| 배지 목록 조회 | `GET` | `/api/v1/profile/badges` | 수집 음식 탭: 음식별 횟수/배지 |
| 전체 지도 구역 | `GET` | `/api/v1/map/zones` | 서문시장 전체 지구 목록 |

### 3.2 가게 및 결제/영수증/퀘스트 (도메인 B - BE2 추천)
| 기능 | Method | Endpoint | 설명 |
|---|---|---|---|
| 가게 목록 조회 | `GET` | `/api/v1/stores` | 가게 목록, 카테고리, 혼잡도 |
| 특정 가게 상세 | `GET` | `/api/v1/stores/{storeId}` | 가게 소개글, 메뉴 목록, 평점 |
| 코인 결제 및 주문 | `POST` | `/api/v1/orders` | 코인 차감, 주문 생성, 횟수 반영 |
| 영수증 목록 조회 | `GET` | `/api/v1/orders/receipts` | 내 영수증 및 조리 상태 확인 |
| 가게 리뷰 목록 | `GET` | `/api/v1/stores/{storeId}/reviews` | 가게별 작성된 리뷰 조회 |
| 리뷰 작성 | `POST` | `/api/v1/reviews` | 조리 완료 주문 건 리뷰 작성 |
| 퀘스트 목록 조회 | `GET` | `/api/v1/quests` | 일일 미션/퀘스트/이벤트 목록 |
| 퀘스트 보상 수령 | `POST` | `/api/v1/quests/{questId}/claim` | 완료된 퀘스트 코인 수령 |

---

## 4. API 상세 명세

### 4.1 내 정보 조회
- **Method**: `GET`
- **Endpoint**: `/api/v1/users/me`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "nickname": "승우",
    "balance": 1000,
    "level": 1,
    "exp": 30,
    "nextLevelExp": 100,
    "equipped": {
      "head": "tteok-hat",
      "body": "tteok-jacket",
      "feet": "tteok-shoes",
      "neck": null
    }
  },
  "error": null
}
```

---

### 4.2 닉네임 변경
- **Method**: `PATCH`
- **Endpoint**: `/api/v1/users/me/nickname`
- **Request Body**:
```json
{
  "nickname": "서문탐험가"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "nickname": "서문탐험가"
  },
  "error": null
}
```

---

### 4.3 장비 목록 및 착용 상태 조회 (가방 탭)
- **Method**: `GET`
- **Endpoint**: `/api/v1/profile/equipments`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "equipments": [
      {
        "id": "tteok-hat",
        "name": "모자",
        "slot": "head",
        "targetFoodId": "tteok",
        "targetFoodName": "떡볶이",
        "requiredCount": 1,
        "currentCount": 3,
        "unlocked": true,
        "isEquipped": true,
        "imageUrl": "/assets/profile-imgImage112.png"
      },
      {
        "id": "tteok-jacket",
        "name": "자켓",
        "slot": "body",
        "targetFoodId": "tteok",
        "targetFoodName": "떡볶이",
        "requiredCount": 3,
        "currentCount": 3,
        "unlocked": true,
        "isEquipped": true,
        "imageUrl": "/assets/profile-imgImage114.png"
      },
      {
        "id": "tteok-shoes",
        "name": "신발",
        "slot": "feet",
        "targetFoodId": "tteok",
        "targetFoodName": "떡볶이",
        "requiredCount": 5,
        "currentCount": 3,
        "unlocked": false,
        "isEquipped": false,
        "imageUrl": "/assets/profile-imgImage113.png"
      },
      {
        "id": "tteok-scarf",
        "name": "목도리",
        "slot": "neck",
        "targetFoodId": "tteok",
        "targetFoodName": "떡볶이",
        "requiredCount": 8,
        "currentCount": 3,
        "unlocked": false,
        "isEquipped": false,
        "imageUrl": "/assets/profile-imgImage123.png"
      }
    ]
  },
  "error": null
}
```

---

### 4.4 장비 착용 / 해제 토글
- **Method**: `PATCH`
- **Endpoint**: `/api/v1/profile/equipments/{id}/toggle`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "equipped": {
      "head": "tteok-hat",
      "body": null,
      "feet": "tteok-shoes",
      "neck": null
    }
  },
  "error": null
}
```

---

### 4.5 수집한 음식 및 배지 현황 조회 (수집 음식 탭)
- **Method**: `GET`
- **Endpoint**: `/api/v1/profile/badges`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "foods": [
      {
        "foodId": "tteok",
        "foodName": "떡볶이",
        "purchaseCount": 3,
        "badges": [
          { "tier": "BRONZE", "name": "브론즈", "required": 3, "earned": true },
          { "tier": "SILVER", "name": "실버", "required": 5, "earned": false },
          { "tier": "GOLD", "name": "골드", "required": 10, "earned": false }
        ],
        "nextBadge": {
          "tier": "SILVER",
          "name": "실버",
          "remainingCount": 2
        }
      }
    ]
  },
  "error": null
}
```

---

### 4.6 전체 지도 구역 목록 조회
- **Method**: `GET`
- **Endpoint**: `/api/v1/map/zones`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "zones": [
      { "id": "zone-1", "name": "1지구", "desc": "섬유 한복" },
      { "id": "zone-2", "name": "2지구", "desc": "먹거리 타운" },
      { "id": "zone-dongsan", "name": "동산상가", "desc": "패션 의류" },
      { "id": "zone-night", "name": "야시장", "desc": "야간 먹거리" }
    ]
  },
  "error": null
}
```

---

### 4.7 가게 목록 및 혼잡도 조회
- **Method**: `GET`
- **Endpoint**: `/api/v1/stores`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "stores": [
      {
        "id": "seomun",
        "name": "서문분식",
        "category": "분식",
        "waitTimeMinutes": 5,
        "crowdLevel": "CALM",
        "crowdLabel": "여유",
        "npcCount": 2,
        "tags": ["#매콤달콤", "#가성비", "#줄서는맛집", "#시장대표메뉴"]
      },
      {
        "id": "noodle",
        "name": "시장칼국수",
        "category": "면요리",
        "waitTimeMinutes": 10,
        "crowdLevel": "NORMAL",
        "crowdLabel": "보통",
        "npcCount": 4,
        "tags": ["#따끈한육수", "#수제면", "#든든한한끼"]
      },
      {
        "id": "hotteok",
        "name": "달콤호떡",
        "category": "간식",
        "waitTimeMinutes": 15,
        "crowdLevel": "CROWDED",
        "crowdLabel": "혼잡",
        "npcCount": 7,
        "tags": ["#갓구운호떡", "#달콤한간식", "#씨앗가득"]
      },
      {
        "id": "coffee",
        "name": "골목카페",
        "category": "카페",
        "waitTimeMinutes": 22,
        "crowdLevel": "VERY_CROWDED",
        "crowdLabel": "매우 혼잡",
        "npcCount": 10,
        "tags": ["#커피한잔", "#달콤디저트", "#잠깐의휴식"]
      }
    ]
  },
  "error": null
}
```

---

### 4.8 특정 가게 상세 정보 및 메뉴 조회
- **Method**: `GET`
- **Endpoint**: `/api/v1/stores/{storeId}`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "seomun",
    "name": "서문분식",
    "category": "분식",
    "description": "40년 전통의 서문시장 대표 떡볶이! 매콤달콤한 양념과 쫄깃한 떡이 어우러진 추억의 맛을 즐겨보세요.",
    "greeting": "어서 오이소~\n매콤~한 떡볶이\n드시고 가이소!",
    "rating": 4.0,
    "reviewCount": 348,
    "tags": ["#매콤달콤", "#가성비", "#줄서는맛집", "#시장대표메뉴"],
    "menus": [
      {
        "id": "tteok",
        "name": "떡볶이",
        "price": 300,
        "description": "매콤달콤한 양념이 매력적인 떡볶이",
        "isFeatured": true,
        "imageUrl": "/assets/75-189-imgImage32.png"
      },
      {
        "id": "sundae",
        "name": "순대",
        "price": 300,
        "description": "쫄깃한 식감의 고소한 순대",
        "isFeatured": false,
        "imageUrl": "/assets/75-189-imgImage33.png"
      },
      {
        "id": "fried",
        "name": "튀김 세트",
        "price": 500,
        "description": "바삭한 튀김 5종 세트",
        "isFeatured": false,
        "imageUrl": "/assets/75-189-imgImage34.png"
      },
      {
        "id": "fish",
        "name": "오뎅",
        "price": 300,
        "description": "따뜻한 국물의 길거리 오뎅",
        "isFeatured": false,
        "imageUrl": "/assets/75-189-imgImage35.png"
      }
    ]
  },
  "error": null
}
```

---

### 4.9 코인 Mock 결제 및 주문 생성
- **Method**: `POST`
- **Endpoint**: `/api/v1/orders`
- **Request Body**:
```json
{
  "storeId": "seomun",
  "items": [
    {
      "menuId": "tteok",
      "quantity": 1
    }
  ]
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "orderId": "ord-20261101-001",
    "storeId": "seomun",
    "totalPrice": 300,
    "remainingBalance": 700,
    "status": "cooking",
    "readyAfterSeconds": 15,
    "items": [
      {
        "menuId": "tteok",
        "menuName": "떡볶이",
        "quantity": 1,
        "price": 300
      }
    ]
  },
  "error": null
}
```

---

### 4.10 영수증 목록 조회
- **Method**: `GET`
- **Endpoint**: `/api/v1/orders/receipts`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "receipts": [
      {
        "orderId": "ord-20261101-001",
        "storeId": "seomun",
        "storeName": "서문분식",
        "menuId": "tteok",
        "menuName": "떡볶이",
        "quantity": 1,
        "status": "cooking",
        "canReview": false,
        "orderedAt": "2026-11-01T13:00:00"
      },
      {
        "orderId": "ord-20261101-002",
        "storeId": "seomun",
        "storeName": "서문분식",
        "menuId": "fried",
        "menuName": "튀김 세트",
        "quantity": 1,
        "status": "ready",
        "canReview": true,
        "orderedAt": "2026-11-01T12:45:00"
      },
      {
        "orderId": "ord-20261101-003",
        "storeId": "seomun",
        "storeName": "서문분식",
        "menuId": "fish",
        "menuName": "오뎅",
        "quantity": 1,
        "status": "reviewed",
        "canReview": false,
        "orderedAt": "2026-11-01T12:00:00"
      }
    ]
  },
  "error": null
}
```

---

### 4.11 가게 리뷰 목록 조회
- **Method**: `GET`
- **Endpoint**: `/api/v1/stores/{storeId}/reviews`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "rev-1",
        "authorName": "승우",
        "rating": 4,
        "text": "진짜 서문시장 오면 무조건 먹어야 해요! 매콤달콤한 양념이 너무 맛있고 튀김이랑 같이 먹으니까 조합 최고에요!",
        "date": "2026. 10. 12",
        "photos": true,
        "imageUrls": [
          "/assets/85-581-imgImage52.png",
          "/assets/85-581-imgImage54.png",
          "/assets/85-581-imgImage59.png"
        ]
      }
    ]
  },
  "error": null
}
```

---

### 4.12 리뷰 작성
- **Method**: `POST`
- **Endpoint**: `/api/v1/reviews`
- **Request Body**:
```json
{
  "orderId": "ord-20261101-002",
  "rating": 5,
  "text": "튀김이 정말 바삭바삭하고 떡볶이 국물에 찍어먹으니 환상이에요!",
  "imageUrls": []
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "reviewId": "rev-new-001",
    "orderId": "ord-20261101-002",
    "rating": 5,
    "text": "튀김이 정말 바삭바삭하고 떡볶이 국물에 찍어먹으니 환상이에요!",
    "authorName": "승우",
    "date": "2026. 11. 01"
  },
  "error": null
}
```

---

### 4.13 퀘스트 목록 조회
- **Method**: `GET`
- **Endpoint**: `/api/v1/quests`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "daily": [
      {
        "id": "visit-3",
        "title": "서문시장 가게 3곳 방문하기",
        "current": 1,
        "target": 3,
        "rewardCoin": 300,
        "status": "IN_PROGRESS"
      },
      {
        "id": "review-1",
        "title": "서문 분식 방문 후 리뷰 작성하기",
        "current": 1,
        "target": 2,
        "rewardCoin": 200,
        "status": "IN_PROGRESS"
      },
      {
        "id": "photo-1",
        "title": "사진 1장 찍기",
        "current": 1,
        "target": 1,
        "rewardCoin": 100,
        "status": "COMPLETED"
      }
    ],
    "achievement": [],
    "event": []
  },
  "error": null
}
```

---

### 4.14 퀘스트 보상 수령
- **Method**: `POST`
- **Endpoint**: `/api/v1/quests/{questId}/claim`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "questId": "photo-1",
    "rewardCoin": 100,
    "currentBalance": 1100
  },
  "error": null
}
```
