# 시장에 가면 — BE1·BE2 백엔드

Java 21 / Spring Boot 4.1.2 / Gradle Groovy / JPA / Flyway / springdoc 3.2.0.

## 실행

JDK 21을 사용한다. macOS에서는 `export JAVA_HOME=$(/usr/libexec/java_home -v 21)`로 선택할 수 있다.
`backend/`에서 다음을 실행한다.

```sh
./gradlew bootRun
```

- Swagger: http://127.0.0.1:8080/swagger-ui/index.html
- 내 정보: http://127.0.0.1:8080/api/v1/users/me
- 기본 local 프로필은 `backend/data/dandithon.mv.db`에 데이터를 보관한다. Docker 불필요.
- 최초 시작에만 userId 1 / 닉네임 승우 / 1,000코인 생성. 재시작 시 덮어쓰지 않는다.
- 장비·구매 횟수는 처음에 비어 있다. 문서 예시의 샘플 구매를 실제 기록으로 넣지 않는다.
- Initial level 1, exp 0, next threshold 100. Existing main-branch experience and level-up logic is preserved.
- 개인 API는 선택한 게스트별로 처리하고 AI 대기열은 공용이다. 인증 기능이 아니며 기본적으로 localhost에만 바인딩한다.

## 테스트와 빌드

```sh
./gradlew test bootJar
```

자동 테스트는 메모리 H2를 사용하므로 개발 DB를 지우지 않는다.
테스트 리포트: `build/reports/tests/test/index.html`.
패키징 파일: `build/libs/`의 실행 jar.

## 구현한 API

`../docs/API.md`의 BE1·BE2 응답 형식과 주소를 따른다.

| Method | 경로 |
|---|---|
| GET | /api/v1/users/me |
| PATCH | /api/v1/users/me/nickname |
| GET | /api/v1/profile/equipments |
| PATCH | /api/v1/profile/equipments/{id}/toggle |
| GET | /api/v1/profile/badges |
| GET | /api/v1/map/zones |
| GET | /api/v1/stores |
| GET | /api/v1/stores/{storeId} |
| POST | /api/v1/orders |
| GET | /api/v1/orders/receipts |
| GET | /api/v1/stores/{storeId}/reviews |
| POST | /api/v1/reviews |
| GET | /api/v1/quests |
| POST | /api/v1/quests/{questId}/claim |

닉네임은 앞뒤 공백 제거 후 Unicode 코드포인트 1~8자이며 제어문자는 거부한다.
장비 조건은 떡볶이 1/3/5/8회, 배지는 음식별 3/5/10회다.
장비 ID 오류는 기존 계약의 INVALID_INPUT_VALUE, 미획득 장비는 EQUIPMENT_LOCKED를 사용한다.
조회·오류·착용·해제는 구매 횟수나 잔액을 바꾸지 않는다.

## BE2 API 및 처리 정책

가게 목록/상세, 가게 리뷰, 주문, 영수증, 리뷰 등록, 퀘스트 목록/보상 등 BE2 8개 API를 구현했다. 전체 26개 경로는 Swagger에서 확인할 수 있다.

- Catalog: four stores and 16 menus in `market-catalog.json`, with `mock: true`. Fixed waits remain the default; Seomun synthetic ETA is opt-in (see below).
- 가상 구매: 단일 가게 주문, 메뉴당 수량 1~99. 필수 `Idempotency-Key`로 재시도 중복 차감을 방지한다. 같은 구매 재시도에 같은 키를 보내고, 새로운 구매에는 새 키를 사용한다.
- 사용자 행 잠금 아래 코인 차감·주문·구매 횟수가 함께 커밋된다. 실패하면 모두 롤백된다. 수량이 아닌 주문 메뉴 행마다 구매 횟수 +1. 장비/배지에 즉시 반영된다.
- Receipts: new user orders are instantly ready for the demo. AI estimates belong to a separate fictional general-customer queue. Reviews are immediate. Existing legacy deadlines are preserved; no real food order is placed.
- 리뷰: 주문 전체에 1개. 별점 1~5, 내용 1~500자, 이미지 URL 최대 5개. 업로드 기능은 없다. 평점/리뷰 수는 저장된 리뷰로 계산한다.
- 일일 미션: 한국시간 자정 초기화. 당일 서문분식 리뷰 1개 작성 시 200코인, 하루 1회 수령. 동시 수령에도 중복 지급되지 않는다.
- 가게 3곳 둘러보기: 당일 서로 다른 가게 상세 진입 3곳, 300코인. `POST /api/v1/stores/{storeId}/browse`로 기록한다. 실제 방문 인증이 아니다.
- 모자 착용해보기: 당일 떡볶이 모자 착용 성공 시 100코인. 해제 후에도 완료 기록 유지. 새 날에는 다시 착용해야 한다. 사진 미션은 제거했다. 업적/이벤트 목록은 비어 있다. 경험치/레벨업 정책은 추가하지 않았다.
- DB는 V1~V6 Flyway로 생성한다. V1을 이미 실행한 DB에도 미적용 마이그레이션만 추가 적용되며 기존 프로필은 유지된다.

### 주문 예시

```sh
curl -X POST http://127.0.0.1:8080/api/v1/orders \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: example-order-1' \
  -d '{"storeId":"seomun","items":[{"menuId":"tteok","quantity":1}]}'
```

프로필 구매 집계는 `PurchaseProgressService`를 주문과 같은 트랜잭션에서 호출한다. 구매 이벤트 식별자는 `주문UUID:메뉴ID`로 안정적으로 생성한다.
프로필 음식 목록과 주문 카탈로그의 ID·이름 일치는 통합 테스트로 검증한다.

## MySQL 전환 준비

```sh
export SPRING_PROFILES_ACTIVE=mysql
export DB_URL='jdbc:mysql://127.0.0.1:3306/dandithon?characterEncoding=UTF-8'
export DB_USERNAME='팀에서 정한 사용자'
export DB_PASSWORD='로컬 환경에서 입력'
./gradlew bootRun
```

MySQL 드라이버·프로필과 Flyway 마이그레이션을 포함했다. JPA는 ddl-auto=validate라 임의로 스키마를 수정하지 않는다.
V1~V6는 H2/MySQL 공통 SQL이다. **실제 MySQL 실행 검증은 별도로 필요하다.** H2 데이터는 자동 이관하지 않는다.
자격 증명·DB 파일은 커밋하지 않는다. 현재 H2 개발 DB는 로컬 전용이며 공개 서비스용이 아니다.
DB 계정·네트워크·사용자 격리·인증은 실제 배포 전에 별도 확정해야 한다.

## 범위 밖 / 남은 작업

- Real GPS/photo verification and real-store AI accuracy validation remain outside this implementation.
- 실제 MySQL 동시성·스키마 검증 필요.
- frontend 및 Figma 원본은 변경하지 않았다.

## 일일 미션 배포 순서
V3 daily_activities 테이블과 browse API를 포함한 백엔드를 먼저 배포하고 프론트를 배포한다. 기존 V1/V2나 운영 기록을 삭제하지 않는다. 운영 MariaDB에서 V3 적용 확인은 배포 담당자가 수행한다. X-User-Id로 선택한 게스트별 진행도·잔액을 분리한다. 헤더가 없으면 기본 사용자 1이다.

시연 초기화 API는 주문·리뷰·구매 진행도·보상 수령 내역과 함께 가게 둘러보기·모자 착용 활동 기록도 삭제한다. 초기화 후 미션은 0부터 다시 진행한다.

## 서문분식 AI 준비시간 시제품
합성 주문 5,000건 학습·평가·재현 방법은 [모델 설명](ml/README.md)을 참고한다. `GET/POST /api/v1/stores/seomun/eta`로 현재 대기열 및 주문 전 견적을 확인할 수 있다. 운영 시 Python 서버는 불필요하며 학습된 트리 JSON을 Spring이 직접 읽는다.

사용자 주문은 즉시 `ready`, `readyAfterSeconds=0`이며 리뷰 가능하다. AI 대기열은 별도 가상 일반 주문으로 구성한다. `POST /api/v1/demo/seomun/queue/seed`로 NPC 약 7명(모델 합계 약 20분)을 구성하고 페이지를 새로고침한다. 코인·사용자 영수증·미션에는 영향을 주지 않는다. 자동 생성은 하지 않는다.

`SEOMUN_ETA_ENABLED=true`, `SEOMUN_ETA_SECONDS_PER_MINUTE=60`이 기본이다. 빠른 시연은 배속을 5로 설정하고 다시 seed한다. `DELETE /api/v1/demo/seomun/queue`는 가상 줄만 비우며 개인 demo/reset은 공용 가상 줄을 유지한다. 프론트 파일은 수정하지 않았다. V6는 가상 대기열 테이블을 추가한다. 상세 설명은 docs/API.md 및 ml/README.md 참조.
