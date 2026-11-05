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
5. **영수증 표시 상태**: `cooking`(조리 중), `ready`(조리 완료), `reviewed`(리뷰 작성 완료). 조리 중에도 리뷰 작성 시 `reviewed`로 표시하며, 실제 시연 대기열은 별도 완료 시각을 따른다.
   - 주문 성공 직후부터 리뷰를 작성할 수 있습니다. 조리 완료 여부와 무관하며 주문당 리뷰 1개만 허용합니다.
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
| `INVALID_ORDER_STATUS` | 400 | 이미 리뷰가 작성된 주문에 중복 리뷰 작성 시도 등 |
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
| 코인 충전 | `POST` | `/api/v1/users/me/charge` | 시연용 코인 충전 (기본 100,000 코인) |
| 경험치 획득/레벨업 | `POST` | `/api/v1/users/me/exp` | 경험치 획득 및 자동 레벨업 (주문 시 10% 자동 지급) |
| 즐겨찾기 목록 조회 | `GET` | `/api/v1/users/me/favorites` | 내 즐겨찾기 가게 ID 목록 |
| 즐겨찾기 토글 | `PATCH` | `/api/v1/users/me/favorites/{storeId}` | 특정 가게 즐겨찾기 등록/해제 토글 |
| 데모 초기화 | `POST` | `/api/v1/demo/reset` | 발표 시연용 데이터 초기화 (코인 1,000 복구) |
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
| 리뷰 작성 | `POST` | `/api/v1/reviews` | 주문 성공 직후 리뷰 작성 (주문당 1개) |
| 리뷰 삭제 | `DELETE` | `/api/v1/reviews/{reviewId}` | 작성한 리뷰 삭제 및 주문 상태 복구 |
| 가게 둘러보기 기록 | `POST` | `/api/v1/stores/{storeId}/browse` | 가게 상세 진입 시 당일 고유 가게 집계 |
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

### 4.2-1 코인 충전 (시연 및 테스트용)
- **Method**: `POST`
- **Endpoint**: `/api/v1/users/me/charge`
- **Request Body (선택, 생략 시 기본 100,000 충전)**:
```json
{
  "amount": 100000
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "nickname": "최수연",
    "balance": 100000,
    "level": 1,
    "exp": 0,
    "nextLevelExp": 100,
    "equipped": {
      "head": null,
      "body": null,
      "feet": null,
      "neck": null
    }
  },
  "error": null
}
```

---

### 4.2-2 경험치 획득 및 자동 레벨업
- **Method**: `POST`
- **Endpoint**: `/api/v1/users/me/exp`
- **설명**: 사용자가 경험치를 획득하며, `nextLevelExp` 도달 시 자동으로 레벨이 증가하고 다음 목표 경험치가 갱신됩니다. (음식 주문 시에도 결제 금액의 10%가 자동 적립됩니다.)
- **Request Body (선택, 생략 시 기본 50 exp)**:
```json
{
  "exp": 50
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "nickname": "최수연",
    "balance": 200000,
    "level": 2,
    "exp": 10,
    "nextLevelExp": 200,
    "equipped": {
      "head": null,
      "body": null,
      "feet": null,
      "neck": null
    }
  },
  "error": null
}
```

---

### 4.2-3 시연용 데모 데이터 초기화 (발표 전 리셋)
- **Method**: `POST`
- **Endpoint**: `/api/v1/demo/reset`
- **설명**: 주문 내역, 리뷰, 구매 횟수(배지 진행도), 즐겨찾기를 전부 초기화하고 유저 코인을 1,000으로 원상복구합니다.
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "nickname": "승우",
    "balance": 1000,
    "level": 1,
    "exp": 0,
    "nextLevelExp": 100,
    "equipped": {
      "head": null,
      "body": null,
      "feet": null,
      "neck": null
    },
    "favorites": []
  },
  "error": null
}
```

---

### 4.2-4 즐겨찾기 가게 목록 조회
- **Method**: `GET`
- **Endpoint**: `/api/v1/users/me/favorites`
- **설명**: 현재 사용자가 즐겨찾기한 가게 ID 목록을 반환합니다.
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "favorites": ["seomun", "coffee"]
  },
  "error": null
}
```

---

### 4.2-5 특정 가게 즐겨찾기 등록/해제 토글
- **Method**: `PATCH`
- **Endpoint**: `/api/v1/users/me/favorites/{storeId}`
- **설명**: 해당 가게가 즐겨찾기에 없으면 추가(`favorite: true`), 이미 있으면 제거(`favorite: false`)합니다.
- **Path Variable**:
  - `storeId` (String): 가게 식별자 (`seomun`, `noodle`, `hotteok`, `coffee`)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "storeId": "seomun",
    "favorite": true,
    "favorites": ["seomun"]
  },
  "error": null
}
```
- **오류 응답**:
  - `404 Not Found`: 존재하지 않는 가게 ID인 경우 (`STORE_NOT_FOUND`)

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
        "crowdLevel": "NORMAL",
        "crowdLabel": "보통",
        "npcCount": 4,
        "tags": ["#매콤달콤", "#가성비", "#줄서는맛집", "#시장대표메뉴"]
      },
      {
        "id": "noodle",
        "name": "시장칼국수",
        "category": "면요리",
        "waitTimeMinutes": 10,
        "crowdLevel": "CROWDED",
        "crowdLabel": "혼잡",
        "npcCount": 7,
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

- **필수 헤더**: `Idempotency-Key: <주문별 고유 키>` (영문·숫자·`_`·`-`, 1~128자). 구매 버튼 1회에 키 1개를 생성하고 네트워크 재시도에는 같은 키를 보낸다. 같은 키와 같은 메뉴/수량은 같은 주문을 반환하며 재차 차감하지 않는다. 다른 주문에 키를 재사용하면 400이다.
- 한 주문에는 한 가게의 메뉴만 포함한다. 수량은 정수 1~99, 메뉴 행은 1~16개이며 같은 메뉴를 여러 행에 중복 입력하면 400이다. 가격은 서버 카탈로그로 계산한다.
- 코인 차감·주문·메뉴별 구매 횟수는 한 트랜잭션이다. 동시 요청도 잔액이 음수가 되거나 중복 집계되지 않는다.
- 재시도 응답의 `remainingBalance`는 해당 주문 결제 당시 잔액이고, 현재 잔액은 `/users/me`로 조회한다. `status`는 조회 시점 상태, `readyAfterSeconds`는 총 시연 조리 시간 15초다.

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

한 주문에 여러 메뉴가 있으면 메뉴별 영수증 행이 생성되며 같은 `orderId`를 공유한다. 리뷰는 **주문 전체에 1개**이며 작성하면 해당 주문의 모든 행이 `reviewed`가 된다. 주문 후 15초의 시연 시간이 지나면 `ready`가 된다. 실제 조리 상태가 아니다. 날짜는 한국시간이며 ISO 8601 소수 초가 포함될 수 있다.

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
        "canReview": true,
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

주문 전체당 1개만 작성한다. 별점은 정수 1~5, 내용은 앞뒤 공백 제거 후 Unicode 코드포인트 1~500자다. `imageUrls`는 생략 또는 빈 배열을 허용하며 최대 5개, 각 2,048자 이내의 `/assets/` 경로 또는 HTTPS 주소를 받는다. 파일 업로드·사진 인증 기능은 포함하지 않는다. 이미 리뷰를 작성한 주문에는 `INVALID_ORDER_STATUS`를 반환한다. 리뷰 별점·개수는 저장된 리뷰에서 계산하며 최초에는 0이다. 작성자 닉네임은 작성 당시 값으로 보관한다.

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

### 4.12-2 작성한 리뷰 삭제
- **Method**: `DELETE`
- **Endpoint**: `/api/v1/reviews/{reviewId}`
- **설명**: 본인이 작성했던 리뷰를 삭제합니다. 리뷰가 삭제되면 연관된 주문의 `reviewed` 상태가 `false`(`ready`)로 되돌아가, 필요 시 재작성할 수 있습니다.
- **Path Variable**:
  - `reviewId` (String): 리뷰 식별자
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "reviewId": "rev-new-001",
    "deleted": true
  },
  "error": null
}
```
- **오류 응답**:
  - `404 Not Found`: 존재하지 않는 리뷰 ID (`REVIEW_NOT_FOUND`)
  - `403 Forbidden`: 타인이 작성한 리뷰를 삭제하려 할 경우 (`FORBIDDEN`)

---

### 4.13 퀘스트 목록 조회

- 일일 기준은 **한국시간 자정**이다. 리뷰 등록 날짜 기준으로 당일 서문분식 리뷰 1개를 작성하면 `review-1`이 완료되며 200코인을 한 번 수령할 수 있다.
- `status`: `IN_PROGRESS`, `COMPLETED`, `CLAIMED`. 다음 날에는 진행도가 0부터 계산되고 다시 수령할 수 있다. 이전 날짜 보상은 이월되지 않는다.
- `visit-3`: **가게 3곳 둘러보기**, 당일 서로 다른 가게 상세 화면 3곳 진입 시 300코인. 실제 위치/방문 인증이 아니다. 동일 가게 재진입은 1곳으로 집계한다.
- `review-1`: **서문분식 리뷰 1개 작성하기**, 당일 서문분식 리뷰 등록 성공 시 200코인. 다른 가게 리뷰는 제외한다.
- `equip-hat`: **모자 착용해보기**, 당일 잠금 해제된 `tteok-hat` 착용 성공 시 100코인. 구매/획득만으로 완료되지 않으며, 해제해도 완료 기록은 유지한다. 전날부터 착용 중이어도 다음 날 자동 완료하지 않는다. 해제 후 재착용이 필요하다.
- 세 미션은 각각 한국시간 자정에 초기화하고 하루 한 번 수령한다. `verificationPending`은 모두 false다. 조회만으로 행동 기록을 생성하지 않는다.
- 기존 `visit-3`, `review-1` ID는 유지한다. `photo-1`은 삭제하고 `equip-hat`으로 대체한다. 기존 리뷰 보상 수령 기록은 유지하므로 조건 완화로 당일 보상이 재지급되지 않는다.
- 프론트는 서버가 반환한 제목/목표/진행도를 사용한다. 모자 착용 후 퀘스트를 다시 조회한다. 문서 예시는 형식 설명이며 초기 상태는 모두 0이다.

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
        "title": "가게 3곳 둘러보기",
        "current": 1,
        "target": 3,
        "rewardCoin": 300,
        "status": "IN_PROGRESS"
      },
      {
        "id": "review-1",
        "title": "서문분식 리뷰 1개 작성하기",
        "current": 1,
        "target": 1,
        "rewardCoin": 200,
        "status": "COMPLETED"
      },
      {
        "id": "equip-hat",
        "title": "모자 착용해보기",
        "current": 0,
        "target": 1,
        "rewardCoin": 100,
        "status": "IN_PROGRESS",
        "verificationPending": false
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
    "questId": "review-1",
    "rewardCoin": 200,
    "currentBalance": 600
  },
  "error": null
}
```


## 5. BE2 구현 상태와 연동 유의사항

- 가게 4곳·메뉴 16개는 기존 프론트 fixture를 옮긴 **시연 카탈로그**다. 목록/상세의 추가 필드 `mock: true`로 표시한다. 대기시간은 고정 샘플이며 AI 예측이 아니다. 기타 가게 메뉴 이미지는 아직 없으므로 `imageUrl: null`이다.
- 혼잡도는 본 문서 1절 경계값을 따른다. 5분=보통, 10분=혼잡이다. 기존 FE Mock 함수와 경계값이 달라 HTTP 연결 시 맞춰야 한다.
- 샘플 리뷰·주문·방문 기록을 실제 DB 초기 데이터로 생성하지 않는다. 위 응답 예시의 주문 번호/평점/진행도는 예시이며 API 실제 값이 우선이다.
- FE는 아직 localStorage Mock API를 사용한다. 이번 작업은 서버 API 구현이며 FE HTTP 연결은 별도다. 특히 혼합 가게 장바구니를 가게별 요청으로 나누고 필수 Idempotency-Key를 전달해야 한다.
- 전 API는 인증 없는 공용 게스트 userId 1이다. 실제 서비스 공개 전 사용자별 인증·데이터 분리가 필요하다.


### 가게 둘러보기 기록 (2026-11-05)
- **Method**: `POST`
- **Endpoint**: `/api/v1/stores/{storeId}/browse`
- 요청 본문 없음. 가게 상세 진입 이벤트마다 호출한다. 같은 날 같은 가게는 중복 집계하지 않는다.
- 응답: HTTP 200, `data`는 `GET /quests`와 같은 `daily`, `achievement`, `event` 구조다. 프론트는 반환값으로 퀘스트 상태를 갱신한다.
- 잘못된 가게는 `STORE_NOT_FOUND`(404). 실패 시 가게 진입을 성공 처리하지 않고 재시도할 수 있다.
- GPS 좌표나 실제 위치를 받지 않는다. 현재 공용 게스트 기준이며, 접속자별 독립 진행도는 사용자 구분 기능 도입 후 가능하다.
- 백엔드 V3 마이그레이션과 browse API를 먼저 배포한 뒤 프론트를 배포한다. 구 버전 서버는 이 경로가 없으므로 새 프론트의 가게 진입이 실패한다.

시연 초기화(`POST /api/v1/demo/reset`) 시 `daily_activities`의 가게 둘러보기·모자 착용 기록도 삭제한다. 기존 주문·리뷰·수령 내역과 함께 초기화하므로 당일 미션은 진행도 0으로 돌아가며, 새 행동으로 다시 완료할 수 있다.

## 서문분식 AI 가상 대기열 / 사용자 즉시 완료 (2026-11-05)

### 사용자 주문
`POST /api/v1/orders`로 성공한 사용자 주문은 **모든 가게에서 시연용 우선 처리로 즉시 조리 완료**한다. `status=ready`, `readyAfterSeconds=0`이며 영수증 `canReview=true`다. 주문당 리뷰 1개·입력 검증·코인 차감·구매 집계·멱등성은 유지한다. 리뷰 작성 후 false, 삭제 후 다시 true다. 조리 상태와 무관하게 리뷰를 허용한다.

사용자 주문은 아래 가상 일반 대기열에 추가되지 않는다. “일반 주문의 AI 예상 대기시간”과 “시연 사용자 즉시 완료”를 구분한다. 기존 DB 주문의 V5 완료 시각은 소급 변경하지 않는다.

### 가상 일반 주문 생성
`POST /api/v1/demo/seomun/queue/seed` (본문 없음)

기존 가상 대기열을 **교체**하고 튀김·떡볶이·순대·튀김·오뎅·떡볶이·튀김 각 1개, 총 7건을 넣는다. 학습 모델의 준비시간을 순서대로 더한 약 19.9분 → NPC 7명. 실제 손님 7명이 아니라 대기시간 3분당 1명의 시각적 표시다. 중복/동시 요청도 7건만 유지되며, 의도적인 재호출은 시연 시계를 새로 시작한다. 사용자 주문·코인·경험치·리뷰·미션을 변경하지 않는다. 자동 생성/자동 재시드는 없다.

### 가상 대기열 조회
`GET /api/v1/stores/seomun/eta`

```json
{
  "success":true,
  "data":{
    "storeId":"seomun",
    "activeOrders":7,
    "waitTimeMinutes":19.95,
    "npcCount":7,
    "source":"SYNTHETIC_DEMO_QUEUE",
    "modelVersion":"seomun-rf-synthetic-v1",
    "synthetic":true,
    "secondsPerSimulatedMinute":60,
    "appliedToOrders":false
  },
  "error":null
}
```

예시는 seed 직후의 값이며 실제 시간 경과에 따라 달라진다. `waitTimeMinutes`는 가상 일반 주문을 모두 처리하기까지 남은 가상 분이다. NPC는 0분 0명, 양수 ceil(분/3), 최대 10명. activeOrders는 남은 가상 주문 수로 NPC 수와 항상 같지는 않다. `appliedToOrders=false`는 사용자 주문에 이 ETA를 적용하지 않음을 뜻한다.

### 가상 일반 주문의 추가 견적
`POST /api/v1/stores/seomun/eta`

```json
{"items":[{"menuId":"tteok","quantity":1},{"menuId":"fried","quantity":1}]}
```

새 일반 주문을 넣는다는 가정으로 `queueWaitMinutes`, 모델의 `preparationMinutes`, 합계 `estimatedMinutes`, 배속을 적용한 `readyAfterSeconds`, 해당 견적의 `npcCount`와 모델/합성 메타데이터를 반환한다. **조회 전용이며 사용자 주문의 완료시간 견적이 아니다.** 실제 주문 생성/차감은 하지 않는다. 메뉴 1~4행, 수량 1~99 정수, 중복 메뉴 거부. 미지원 가게는 INVALID_INPUT_VALUE(400), 없는 가게 STORE_NOT_FOUND(404), 잘못된 메뉴 MENU_NOT_FOUND(404).

### 초기화
- `DELETE /api/v1/demo/seomun/queue`: 가상 일반 대기열만 비움. 사용자 주문/잔액은 유지.
- 기존 `POST /api/v1/demo/reset`: 사용자 데이터 초기화에 더해 가상 일반 대기열도 비움.

### 표시 / 설정 / FE 전달
- `SEOMUN_ETA_ENABLED=true` 기본: `/stores`의 서문분식 대기시간·NPC 수는 가상 일반 대기열을 반영한다. false면 예전 고정 시연값 유지. 사용자 즉시 완료는 설정과 무관하다.
- `SEOMUN_ETA_SECONDS_PER_MINUTE=60` 기본, 5로 설정하면 가상 1분을 실제 5초로 진행한다. 진행 중 설정 변경 후에는 seed를 다시 호출한다.
- `/stores`의 서문분식 `waitTimeSource=SYNTHETIC_DEMO_QUEUE`, `synthetic=true`, `mock=true`, `modelVersion`, `secondsPerSimulatedMinute`를 제공한다. 타 가게의 고정 시연값은 유지한다.
- 기존 FE는 서버 `npcCount`를 읽으므로 **seed 후 페이지 새로고침하면 7명 표시 가능**하다. 이번 작업에서 frontend 파일은 수정하지 않는다. 자동 갱신은 추후 폴링 연결 필요.
- 화면/발표에서 일반 손님 줄은 “합성 데이터 기반 시연 대기열”, 사용자 주문은 “시연용 우선 즉시 완료”로 설명한다. 실제 매장 혼잡도나 실측 정확도로 주장하지 않는다.
- V5 기존 주문 보존, V6 가상 일반 주문 전용 테이블. 운영 MariaDB 마이그레이션 및 seed는 배포 후 확인한다.

### 리뷰
주문 직후 canReview=true, 이미 리뷰가 있으면 false. 중복 리뷰는 INVALID_ORDER_STATUS(400). 리뷰 작성/삭제는 가상 대기열과 무관하다. 프론트의 기존 ready 제한은 신규 주문이 즉시 ready이므로 별도 수정 없이 통과한다.
