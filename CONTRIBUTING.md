# 🤝 CONTRIBUTING | 시장에 가면

> 2026 단디톤 해커톤 GitHub 협업 가이드

본 문서는 '시장에 가면' 프로젝트의 원활한 협업을 위한 공통 규칙을 정의합니다.

팀원들은 작업 전 본 문서를 확인하고, 일관된 방식으로 Issue, Branch, Commit, Pull Request를 관리합니다.

※ 본 문서는 초기 협업 규칙 초안이며, 브랜치 및 코드 리뷰 정책은 개발팀 협의 후 최종 확정합니다.

---

## 1. 프로젝트 협업 구조

### 1.1 팀 구성

| 파트 | 인원 | 주요 역할 |
|---|---|---|
| PM | 1명 | 기획, 요구사항 관리, 일정 관리 |
| Design | 1명 | UI/UX, Figma, 디자인 에셋 |
| Frontend | 2명 | 모바일 앱 및 게임 화면 구현 |
| Backend | 2명 | API, DB, 게임 로직, 서버 배포 |

### 1.2 Repository 구조

본 프로젝트는 하나의 Repository에서 여러 파트의 코드와 문서를 관리하는 Monorepo 방식을 사용합니다.

```text
dandithon-2026/
├── frontend/          # Frontend
├── backend/           # Backend
├── design/            # UI/UX 디자인
├── docs/              # 기획 및 기술 문서
├── .github/           # GitHub 협업 설정
├── AGENTS.md          # AI 에이전트 지침
├── CLAUDE.md          # Claude Code 지침
├── CONTRIBUTING.md    # 협업 가이드
└── README.md          # 프로젝트 소개
```

※ 실제 디렉터리 구성은 개발팀의 환경 설정에 따라 변경될 수 있습니다.

---

## 2. 브랜치 전략

### 2.1 기본 브랜치

| 브랜치 | 용도 |
|---|---|
| `main` | 안정적인 코드 및 최종 배포 기준 |
| `feat/*` | 신규 기능 개발 |
| `fix/*` | 버그 수정 |
| `docs/*` | 문서 작성 및 수정 |
| `chore/*` | 프로젝트 설정 및 기타 작업 |

본 프로젝트는 짧은 개발 기간을 고려하여 **main 기반의 간단한 Feature Branch 전략**을 우선 제안합니다.

※ `develop` 브랜치 도입 여부는 개발팀 협의 후 결정합니다.

### 2.2 브랜치 네이밍 규칙

```text
타입/파트-작업명
```

예시:

```text
feat/fe-market-map
feat/fe-shop-detail
feat/be-coin-payment
feat/be-quest-api

fix/fe-map-position
fix/be-payment-error

docs/update-prd
docs/update-readme

chore/setup-frontend
chore/setup-backend
```

**규칙**

- 브랜치명은 영어 소문자 사용
- 단어 구분은 하이픈(`-`) 사용
- 작업 목적을 짧고 명확하게 표현
- 하나의 브랜치에서는 하나의 주요 작업만 진행

---

## 3. Commit Message 규칙

### 3.1 기본 형식

```text
type: 작업 내용
```

예시:

```text
feat: add market map
fix: resolve coin deduction error
docs: update PRD
refactor: simplify quest logic
style: update shop UI
test: add payment tests
chore: configure project settings
```

### 3.2 Commit Type

| Type | 설명 |
|---|---|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 작성 및 수정 |
| `style` | 코드 동작에 영향을 주지 않는 스타일 변경 |
| `refactor` | 기능 변경 없는 코드 구조 개선 |
| `test` | 테스트 코드 추가 및 수정 |
| `chore` | 설정 및 기타 작업 |

### 3.3 Commit 작성 원칙

- 하나의 Commit에는 관련된 변경 사항을 묶습니다.
- Commit Message는 변경 내용을 명확하게 작성합니다.
- API Key, 비밀번호, `.env` 등 민감한 정보를 Commit하지 않습니다.
- 불필요한 빌드 파일이나 임시 파일을 포함하지 않습니다.

※ Commit Message는 영어 사용을 권장하며, 팀 협의 후 변경할 수 있습니다.

---

## 4. GitHub Issues

### 4.1 Issue 작성 원칙

새로운 기능 개발, 버그 수정, 문서 작업 등은 GitHub Issue로 등록합니다.

Issue에는 다음 내용을 포함합니다.

- 작업 목적
- 작업 내용
- 완료 조건
- 담당자
- 관련 문서 또는 참고 자료

### 4.2 Issue 제목 규칙

```text
[파트] 작업 내용
```

예시:

```text
[FE] 2D 시장 맵 구현
[FE] 가게 상호작용 UI 구현
[BE] 코인 Mock 결제 API 구현
[BE] 영수증 조회 API 구현
[Design] 프로필 화면 디자인
[Docs] PRD 업데이트
```

### 4.3 Issue 작업 흐름

```text
Issue 생성
    ↓
담당자 지정
    ↓
작업 시작
    ↓
PR 생성
    ↓
코드 리뷰
    ↓
Merge
    ↓
Issue 종료
```

### 4.4 Issue 관리

- 하나의 Issue는 가능한 한 하나의 작업 단위로 작성합니다.
- 작업 전 관련 Issue를 확인합니다.
- 작업 도중 요구사항이 변경되면 Issue에 내용을 기록합니다.
- 작업 완료 후 관련 PR을 연결합니다.

---

## 5. Pull Request (PR)

### 5.1 PR 작성 원칙

기능 개발 및 수정 작업은 별도 브랜치에서 진행한 뒤 PR을 생성합니다.

PR에는 다음 내용을 작성합니다.

- 변경 목적
- 주요 변경 사항
- 테스트 및 확인 내용
- 관련 Issue 번호
- UI 변경 시 스크린샷 (해당하는 경우)

### 5.2 PR 제목 규칙

```text
[파트] 작업 내용
```

예시:

```text
[FE] 시장 맵 및 캐릭터 이동 구현
[BE] 가상 코인 결제 기능 구현
[Design] 상점 UI 에셋 추가
[Docs] 서비스 기획서 수정
```

### 5.3 PR 리뷰 및 Merge

- `main` 브랜치에 직접 Push하지 않는 것을 원칙으로 합니다.
- PR 생성 후 다른 팀원의 리뷰를 받습니다.
- 리뷰에서 발견된 문제를 수정한 뒤 Merge합니다.
- 충돌이 발생하면 관련 작업 담당자와 협의하여 해결합니다.
- Merge 후 불필요한 작업 브랜치는 삭제하는 것을 권장합니다.

※ 필수 승인 인원, Merge 방식, 자동 테스트 필수 여부는 개발팀과 협의 후 확정합니다.

---

## 6. 파트별 협업 규칙

### 6.1 Frontend

- `frontend/` 디렉터리를 중심으로 작업합니다.
- 공통 UI 컴포넌트는 팀원 간 협의하여 수정합니다.
- Backend API 변경 사항을 확인하고 반영합니다.
- UI 구현 시 Figma 디자인을 참고합니다.

### 6.2 Backend

- `backend/` 디렉터리를 중심으로 작업합니다.
- API 명세를 기준으로 기능을 구현합니다.
- API 변경 시 Frontend 담당자에게 공유합니다.
- DB 구조 및 공통 로직 변경 시 팀원 간 협의합니다.

### 6.3 Design

- Figma를 통해 UI/UX 디자인을 관리합니다.
- 주요 화면 및 에셋 변경 사항을 Frontend 담당자에게 공유합니다.
- 디자인 변경으로 기능 흐름에 영향이 발생하면 PM과 협의합니다.

### 6.4 PM

- `docs/PRD.md`를 중심으로 서비스 요구사항을 관리합니다.
- GitHub Issues 및 Projects를 통해 전체 진행 상황을 확인합니다.
- 기능 변경 및 우선순위 조정 사항을 팀원들과 공유합니다.
- 개발 결과가 기획 요구사항을 충족하는지 확인합니다.

---

## 7. AI 코딩 도구 활용 규칙

본 프로젝트에서는 Codex 및 Claude Code 등의 AI 코딩 도구를 활용할 수 있습니다.

### 공통 원칙

- AI를 활용하기 전 현재 작업 범위와 관련 문서를 확인합니다.
- AI가 작성한 코드는 담당 개발자가 검토합니다.
- AI가 요청 범위 외의 파일을 수정하지 않도록 주의합니다.
- API 및 데이터 구조 변경 시 관련 담당자와 협의합니다.
- AI가 생성한 코드도 프로젝트의 협업 규칙을 따릅니다.
- API Key 및 개인정보를 AI 도구에 불필요하게 입력하지 않습니다.

### AI 작업 지침 문서

| 파일 | 용도 |
|---|---|
| `AGENTS.md` | Codex 등 AI 에이전트 작업 지침 |
| `CLAUDE.md` | Claude Code 작업 지침 |

※ AI 도구별 세부 설정 및 개발 규칙은 개발팀에서 작성합니다.

---

## 8. 작업 진행 및 일정 관리

### GitHub Projects 상태

| 상태 | 의미 |
|---|---|
| `Todo` | 작업 예정 |
| `In Progress` | 작업 진행 중 |
| `Review` | PR 검토 및 테스트 중 |
| `Done` | 작업 완료 |

### 진행 원칙

1. 작업 시작 전 Issue 확인
2. 담당 작업을 `In Progress`로 변경
3. 기능 개발 및 테스트
4. PR 생성 후 `Review`로 변경
5. Merge 및 검수 완료 후 `Done`으로 변경

프로젝트 전체 일정과 주요 작업 목록은 `docs/TASKS.md`를 참고합니다.

---

## 9. 문서 관리

### 프로젝트 문서

| 문서 | 용도 |
|---|---|
| `README.md` | 프로젝트 소개 |
| `docs/PRD.md` | 서비스 기획 및 요구사항 |
| `docs/TASKS.md` | 작업 목록 및 일정 |
| `docs/ARCHITECTURE.md` | 시스템 구조 |
| `docs/API.md` | API 명세 |
| `CONTRIBUTING.md` | 협업 규칙 |

### 문서 수정 원칙

- 요구사항 변경 시 PRD를 업데이트합니다.
- API 변경 시 API 명세서를 업데이트합니다.
- 시스템 구조 변경 시 ARCHITECTURE 문서를 업데이트합니다.
- 개발 및 기획 문서가 실제 구현 내용과 일치하도록 관리합니다.

---

## 10. 보안 및 주의사항

- API Key, 비밀번호, Access Token 등을 GitHub에 업로드하지 않습니다.
- `.env` 파일 등 민감한 설정 파일은 `.gitignore`로 관리합니다.
- 테스트용 개인정보는 실제 사용자 정보 대신 가상 데이터를 사용합니다.
- Public Repository 전환 전 민감한 정보가 없는지 확인합니다.
- AI가 생성한 코드도 보안 및 기능 검토 후 사용합니다.

---

## 11. 기타

- 협업 규칙은 프로젝트 진행 중 팀원 협의에 따라 변경할 수 있습니다.
- 개발 일정이 짧은 만큼 불필요하게 복잡한 절차는 지양합니다.
- 중요한 기술적 변경 사항은 관련 담당자와 사전에 공유합니다.
- 협업 중 발생한 문제는 GitHub Issue 또는 팀 커뮤니케이션 채널에서 논의합니다.

---

**시장에 가면 | 2026 단디톤**
