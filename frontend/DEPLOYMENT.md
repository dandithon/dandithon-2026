# 프론트엔드 시연 배포 준비

현재 코드는 **Mock/live 모드를 선택할 수 있는 정적 빌드**다. 공개 사이트는 최초 Mock 배포 상태다. 프론트엔드는 Vercel에 배포하고, 백엔드는 기존 Cloudtype 서버를 유지한다. 프론트엔드 배포와 실제 API 연동은 별도 작업이며, 배포만으로 서버 데이터가 연결되지 않는다.

## 배포 이후 필수 작업: 실제 API 연동

- Backend Base URL: https://port-0-dandithon-backend-mw1mk9y6e7f0b691.sel3.cloudtype.app
- Swagger: https://port-0-dandithon-backend-mw1mk9y6e7f0b691.sel3.cloudtype.app/swagger-ui/index.html
- [x] 강보성 PR #14: 공통 HTTP 요청·오류 처리·서버/Mock 전환과 가게·구매·영수증·리뷰·퀘스트 API 기본 연결
- [x] 조웅: 기존 프로필 API 기반 위에서 구매·보상 후 프로필 갱신, 실패·재시도, 서버 음식·배지 및 혼잡도 누락 처리 보완 (로컬 검증)
- [ ] 공동: 배포된 Vercel 주소에서 CORS와 사용자 식별 정책, 실패·재시도·새로고침 후 상태 유지 확인
- [ ] 공동: 배포 URL에서 시작→탐험→가게→구매→영수증→리뷰→퀘스트→프로필 통합 검증

현재 `market.js`와 `exploration.js`는 localStorage 기반이다. PR #14에서 `service.js`와 `live.js`의 HTTP 어댑터가 추가됐다. live 빌드는 VITE_DATA_MODE=live 및 VITE_API_BASE_URL 설정과 통합 검증이 필요하다. 서버 연동 후 기존 로컬 시연 데이터를 서버에 자동 업로드하거나 합산하지 않는다. GPS 기준점·방문 검증과 미제공 외형 에셋은 별도 미완료 항목으로 유지한다.

## Vercel 설정

### GitHub 자동 배포 연결 (2026-11-05)

저장소가 Public으로 전환된 뒤 Vercel GitHub 연결이 성공했다. 연결 저장소는 `dandithon/dandithon-2026`, Production Branch는 `main`이다. GitHub Actions workflow 대신 Vercel 기본 Git 연동을 사용한다.

- `main` 변경: 테스트·빌드 성공 후 운영 도메인 https://ifyougotothemarket.vercel.app 에 반영.
- 기능 브랜치 push·PR: 별도 Preview 배포. 운영 화면과 분리.
- Root Directory `frontend`, Node.js `22.x`, 설치 `npm ci`, 빌드 `npm run verify`, 출력 `dist`.
- Production은 `VITE_DATA_MODE=live`와 Cloudtype `/api/v1` 주소를 사용한다. Preview는 `VITE_DATA_MODE=mock`으로 별도 검수한다.
- 기존 비공개 조직 저장소의 Hobby 제한은 Public 전환으로 이번 연결에서 해소됐다. 공개 전 검토 결과는 `docs/PUBLICATION_REVIEW.md` 참고.

주의: 수동 배포한 버튼·창 전환 효과는 아직 main에 병합되지 않았다. 다음 main 배포는 main의 코드를 그대로 반영하므로 해당 효과를 유지하려면 효과 커밋을 별도 PR로 병합해야 한다. 롤백한 책 페이지 넘김 효과는 반영하지 않는다.

### 모바일 너비 대응 수정 및 재배포 대기

휴대폰 세로 화면(너비 600px 이하)은 화면 너비에 맞춰 원본 비율로 확대한다. 짧은 화면에서는 세로 스크롤로 전체 조작 영역에 접근하며, 태블릿·데스크톱·가로 화면은 기존 화면 내 맞춤을 유지한다. 에셋 79개 검사·테스트 19개·프로덕션 빌드는 통과했다. 실기기 검수는 미완료다.

재배포 `dpl_7Q3iUiGcT5kxT9Ak4ALoNQQYSC3p`는 Vercel에서 커밋 작성자의 프로젝트 배포 권한 부족으로 Blocked 상태다. 이 수정은 공개 사이트에 아직 반영되지 않았다. Vercel 계정의 GitHub 연결 및 작성자 접근 권한 확인 후 다시 배포한다.

환경 변수는 `.env` 파일 업로드 대신 Vercel 프로젝트 Environment Variables에서 관리한다. 현재 프로젝트 Production·Preview에는 `VITE_DATA_MODE=mock`이 저장돼 있다. 실제 API 연결 배포 시 `VITE_DATA_MODE=live`와 `.env.example`의 `VITE_API_BASE_URL`을 함께 설정하고 다시 빌드한다. DB 비밀번호 등 서버 비밀값은 프론트에 설정하지 않는다.

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
| 환경 변수 | .env.example의 VITE_DATA_MODE 및 VITE_API_BASE_URL |
| URL 구성 | 도메인 루트(`/`)에 배포 |
| HTTPS | 활성화. 위치 권한 검증에 필요 |

에셋 경로가 `/assets/`, `/fonts/`이므로 하위 경로(`/프로젝트명/`) 호스팅은 현재 지원하지 않는다. 하위 경로가 필요한 경우 Vite base와 모든 절대 에셋 경로를 함께 수정한 후 검증한다.

`.env.example`의 공개 설정을 배포 환경에 입력한다. Vite 설정은 빌드에 포함되므로 변경 후 다시 빌드한다.

## 배포 URL에서 확인할 항목

- 시작 화면 및 이미지·폰트가 정상 로딩되는지 확인한다.
- `/`와 `/#store/seomun` 직접 진입·새로고침을 확인한다.
- 전체 지도→가게→구매→영수증→리뷰→프로필의 데이터 반영을 확인한다.
- 장비 잠금·착용 저장·수집 음식 배지가 브라우저 새로고침 후 유지되는지 확인한다.
- 모바일 확대·이동·팝업·작은 화면·안전 영역을 확인한다.
- GPS 권한 허용/거부/위치 수신을 확인한다. 기준점 미설정 상태에서는 캐릭터가 임의로 이동하지 않아야 한다.
- 실제 주문/결제가 없는 시연임을 표시한다. localStorage는 브라우저별이며 사용자 계정 간 동기화되지 않는다.

## 실제 API 연결 및 복구

live 모드는 /api/v1 경로의 서버를 사용한다. 배포 후 게스트 조회와 주문 헤더(Idempotency-Key)의 CORS 허용 여부를 확인한다.

배포마다 검증된 커밋과 호스팅 배포 ID를 기록한다. 오류 시 호스팅의 이전 정상 배포를 복원하거나 해당 커밋의 `dist/`를 재배포한다. 복구를 위해 사용자 브라우저 데이터를 일괄 삭제하지 않는다.

Vercel의 GitHub 자동 배포 연결 여부와 공개 URL은 실제 배포 후 기록한다. `.github/` 자동화 구성은 강보성 담당과 함께 반영한다.
