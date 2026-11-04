# 프론트엔드 시연 배포 준비

현재는 **정적 파일 배포가 가능한 Mock 빌드**다. 프론트엔드는 Vercel에 배포하고, 백엔드는 기존 Cloudtype 서버를 유지한다. 프론트엔드 배포와 실제 API 연동은 별도 작업이며, 배포만으로 서버 데이터가 연결되지 않는다.

## 배포 이후 필수 작업: 실제 API 연동

- Backend Base URL: https://port-0-dandithon-backend-mw1mk9y6e7f0b691.sel3.cloudtype.app
- Swagger: https://port-0-dandithon-backend-mw1mk9y6e7f0b691.sel3.cloudtype.app/swagger-ui/index.html
- [ ] 강보성: 공통 HTTP 요청·오류 처리·서버/Mock 전환과 가게·구매·영수증·리뷰·퀘스트 API 연결
- [ ] 조웅: 사용자 초기 로딩·프로필·닉네임·장비·배지·구매 횟수·대기시간을 실제 API에 연결하고 구매·리뷰·보상 이후 관련 화면 갱신
- [ ] 공동: 배포된 Vercel 주소에서 CORS와 사용자 식별 정책, 실패·재시도·새로고침 후 상태 유지 확인
- [ ] 공동: 배포 URL에서 시작→탐험→가게→구매→영수증→리뷰→퀘스트→프로필 통합 검증

현재 `market.js`와 `exploration.js`는 localStorage 기반이다. API 주소 환경 변수만 추가해서는 연결되지 않으며 HTTP 어댑터 구현이 필요하다. 서버 연동 후 기존 로컬 시연 데이터를 서버에 자동 업로드하거나 합산하지 않는다. GPS 기준점·방문 검증과 미제공 외형 에셋은 별도 미완료 항목으로 유지한다.

## Vercel 설정

### GitHub 자동 배포 설정 진행 상태

2026-11-04 GitHub 로그인 `Wooong-E` 연결을 확인했다. Vercel 프로젝트의 Root Directory는 `frontend`, Node.js는 `22.x`로 설정했고 Production·Preview 환경에 `VITE_DATA_MODE=mock`을 저장했다.

저장소 Git 연결은 아직 실패하며 프로젝트 `link`는 비어 있다. GitHub API 기준 저장소는 private이며 현재 계정은 push 권한은 있지만 admin 권한은 없다. 조직 관리자가 Vercel GitHub App에 `dandithon/dandithon-2026` 접근을 허용했는지 확인해야 한다. 로그인 연결만으로 조직 저장소 접근까지 보장되지는 않는다. 저장소 연결 후 Production Branch `main`을 확인하고 실제 push/PR로 자동 배포를 검증한다. 현재 자동 배포 완료로 간주하지 않는다.

### 모바일 너비 대응 수정 및 재배포 대기

휴대폰 세로 화면(너비 600px 이하)은 화면 너비에 맞춰 원본 비율로 확대한다. 짧은 화면에서는 세로 스크롤로 전체 조작 영역에 접근하며, 태블릿·데스크톱·가로 화면은 기존 화면 내 맞춤을 유지한다. 에셋 79개 검사·테스트 19개·프로덕션 빌드는 통과했다. 실기기 검수는 미완료다.

재배포 `dpl_7Q3iUiGcT5kxT9Ak4ALoNQQYSC3p`는 Vercel에서 커밋 작성자의 프로젝트 배포 권한 부족으로 Blocked 상태다. 이 수정은 공개 사이트에 아직 반영되지 않았다. Vercel 계정의 GitHub 연결 및 작성자 접근 권한 확인 후 다시 배포한다.

환경 변수는 `.env` 파일 업로드 대신 Vercel 프로젝트 Environment Variables에서 관리한다. 현재 CLI 배포는 `--build-env VITE_DATA_MODE=mock`을 사용한다. 향후 자동 배포에도 같은 변수를 등록해야 한다. 실제 API 주소는 HTTP 연동 구현과 함께 추가하며 DB 비밀번호 등 서버 비밀값은 프론트에 설정하지 않는다.

### 2026-11-04 최초 배포 기록

- 공개 URL: https://ifyougotothemarket.vercel.app
- Vercel 프로젝트: `wooong-e/dandithon-2026`
- 배포 ID: `dpl_E9E5EXwJVs6wudBLwMBCeShK8puh`
- 배포 방식: 로컬 소스를 Vercel CLI로 Production 배포, `VITE_DATA_MODE=mock`
- 검증: 로컬 에셋 참조 79개, 테스트 19개, 프로덕션 빌드 통과. Vercel 배포 READY 및 공개 URL HTTP 200 확인. 실제 휴대폰과 배포 화면의 전체 흐름 검수는 미완료.
- GitHub 자동 배포: 미연결. Vercel에서 GitHub Login Connection이 필요하다는 오류로 연결 실패. 계정에 GitHub를 연결한 뒤 프로젝트 Git 설정에서 `dandithon/dandithon-2026`과 Root Directory `frontend`를 지정해야 한다. 현재는 push만으로 재배포되지 않는다.
- 실제 백엔드 API는 아직 연결하지 않았다. 아래 필수 연동 작업을 완료해야 한다.

GitHub 저장소를 Import할 때 Framework Preset은 `Vite`, Root Directory는 `frontend`로 지정한다. 설치는 `npm ci`, 빌드는 `npm run verify`, Output Directory는 `dist`, Node.js는 22.x를 사용한다. 최초 배포는 `VITE_DATA_MODE=mock`인 팀 검수용 데모다. 현재 해시 경로를 사용하므로 SPA rewrite는 필요하지 않다.

CLI 배포는 `frontend/`에서 `npx vercel --prod`로 진행한다. GitHub 자동 배포 연결은 Vercel 프로젝트의 Git 설정에서 별도로 확인한다. `.vercel/`의 로컬 프로젝트 연결 정보는 커밋하지 않는다.

## 로컬 검증과 빌드

Node.js 22.12 이상에서 `frontend/`를 작업 디렉터리로 사용한다.

```sh
npm ci
npm run verify
npm run preview -- --host 127.0.0.1
```

`verify`는 로컬 이미지 참조 확인 → 테스트 → 프로덕션 빌드를 실행한다. 결과는 `dist/`에 생성된다. `preview`는 로컬 확인용이며 외부 서비스용 서버로 사용하지 않는다.

## 배포 설정

| 항목 | 값 |
|---|---|
| 저장소 | dandithon/dandithon-2026 |
| 작업 루트 | frontend |
| 설치 | npm ci |
| 빌드 | npm run verify |
| 정적 파일 경로 | dist |
| 환경 변수 | VITE_DATA_MODE=mock |
| URL 구성 | 도메인 루트(`/`)에 배포 |
| HTTPS | 활성화. 위치 권한 검증에 필요 |

에셋 경로가 `/assets/`, `/fonts/`이므로 하위 경로(`/프로젝트명/`) 호스팅은 현재 지원하지 않는다. 하위 경로가 필요한 경우 Vite base와 모든 절대 에셋 경로를 함께 수정한 후 검증한다.

`.env.example`은 공개 가능한 설정 이름만 제공한다. Vite 환경 변수는 빌드에 포함되므로 DB 접속 정보·서버 전용 토큰을 넣지 않는다. 현재 `mock` 외 모드는 초기 화면에서 명시적으로 실패하며 실제 API로 자동 연결되지 않는다.

## 배포 URL에서 확인할 항목

- 시작 화면 및 이미지·폰트가 정상 로딩되는지 확인한다.
- `/`와 `/#store/seomun` 직접 진입·새로고침을 확인한다.
- 전체 지도→가게→구매→영수증→리뷰→프로필의 데이터 반영을 확인한다.
- 장비 잠금·착용 저장·수집 음식 배지가 브라우저 새로고침 후 유지되는지 확인한다.
- 모바일 확대·이동·팝업·작은 화면·안전 영역을 확인한다.
- GPS 권한 허용/거부/위치 수신을 확인한다. 기준점 미설정 상태에서는 캐릭터가 임의로 이동하지 않아야 한다.
- 실제 주문/결제가 없는 시연임을 표시한다. localStorage는 브라우저별이며 사용자 계정 간 동기화되지 않는다.

## 실제 API 연결 및 복구

실제 API 계약 확정 후 강보성 담당 공통 요청 모듈과 조웅 담당 화면을 연결하고, HTTPS API 주소·CORS·세션 정책을 BE와 확인한다. 연결되지 않은 상태에서 환경 변수만 바꾸어 운영 완료로 처리하지 않는다.

배포마다 검증된 커밋과 호스팅 배포 ID를 기록한다. 오류 시 호스팅의 이전 정상 배포를 복원하거나 해당 커밋의 `dist/`를 재배포한다. 복구를 위해 사용자 브라우저 데이터를 일괄 삭제하지 않는다.

Vercel의 GitHub 자동 배포 연결 여부와 공개 URL은 실제 배포 후 기록한다. `.github/` 자동화 구성은 강보성 담당과 함께 반영한다.
