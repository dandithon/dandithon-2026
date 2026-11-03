# 시장에 가면 — BE1 백엔드

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
- 레벨 1 / 경험치 0 / 다음 기준 100은 초기 표시값이다. 경험치 지급·레벨업은 미구현이다.
- 모든 API는 같은 게스트 사용자다. 인증 기능이 아니며 기본적으로 localhost에만 바인딩한다.

## 테스트와 빌드

```sh
./gradlew test bootJar
```

자동 테스트는 메모리 H2를 사용하므로 개발 DB를 지우지 않는다.
테스트 리포트: `build/reports/tests/test/index.html`.
패키징 파일: `build/libs/`의 실행 jar.

## 구현한 API

`../docs/API.md`의 BE1 응답 형식과 주소를 따른다.

| Method | 경로 |
|---|---|
| GET | /api/v1/users/me |
| PATCH | /api/v1/users/me/nickname |
| GET | /api/v1/profile/equipments |
| PATCH | /api/v1/profile/equipments/{id}/toggle |
| GET | /api/v1/profile/badges |
| GET | /api/v1/map/zones |

닉네임은 앞뒤 공백 제거 후 Unicode 코드포인트 1~8자이며 제어문자는 거부한다.
장비 조건은 떡볶이 1/3/5/8회, 배지는 음식별 3/5/10회다.
장비 ID 오류는 기존 계약의 INVALID_INPUT_VALUE, 미획득 장비는 EQUIPMENT_LOCKED를 사용한다.
조회·오류·착용·해제는 구매 횟수나 잔액을 바꾸지 않는다.

## BE2와의 연결

주문/결제/리뷰/퀘스트 API는 구현하지 않았다. `PurchaseProgressService`는 HTTP로 노출하지 않는다.
BE2는 성공 주문의 **메뉴 행마다** `recordSuccessfulPurchase(userId, stableOrderLineId, foodId)`를 호출한다.
주문 생성·코인 차감과 **동일한 Spring 트랜잭션 안에서** 호출해야 한다 (MANDATORY).
수량이 아니라 고유 주문 메뉴 행당 1회 누적한다. 재시도 때 같은 행 ID를 넘기면 중복 누적하지 않는다.
다른 음식에 같은 ID를 쓰면 실패하며, 주문 트랜잭션이 실패하면 횟수와 이벤트도 함께 롤백된다.
사용자 행을 먼저 잠그므로 BE2의 구매 처리도 같은 사용자 잠금 순서를 지켜야 한다.
API의 주문 번호만으로 여러 메뉴 행을 구분할 수 없으므로 주문 행 ID 규격은 BE2와 합의해야 한다.

프로필용 음식 ID 목록은 현재 프론트의 16개 메뉴와 맞췄다. 실제 메뉴 카탈로그가 만들어지면 단일 기준으로 합칠 필요가 있다.
장비·배지 획득 상태는 저장된 누적 횟수에서 계산하며 별도 중복 지급을 하지 않는다.
토글 API는 계약대로 두 번 호출하면 착용 후 해제된다. 클라이언트는 자동 재시도하면 안 된다.

## MySQL 전환 준비

```sh
export SPRING_PROFILES_ACTIVE=mysql
export DB_URL='jdbc:mysql://127.0.0.1:3306/dandithon?characterEncoding=UTF-8'
export DB_USERNAME='팀에서 정한 사용자'
export DB_PASSWORD='로컬 환경에서 입력'
./gradlew bootRun
```

MySQL 드라이버·프로필과 Flyway 마이그레이션을 포함했다. JPA는 ddl-auto=validate라 임의로 스키마를 수정하지 않는다.
V1은 H2/MySQL 공통 SQL이다. **실제 MySQL 실행 검증은 별도로 필요하다.** H2 데이터는 자동 이관하지 않는다.
자격 증명·DB 파일은 커밋하지 않는다. 현재 H2 개발 DB는 로컬 전용이며 공개 서비스용이 아니다.
DB 계정·네트워크·사용자 격리·인증은 실제 배포 전에 별도 확정해야 한다.

## 범위 밖 / 남은 작업

- FE HTTP 연결, BE2 주문 연동, 코인 변경, 레벨업, GPS, AI, 공개 배포 미구현.
- 실제 MySQL 동시성·스키마 검증 필요.
- frontend 및 Figma 원본은 변경하지 않았다.
