# [1] 모노레포 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 단일 패키지 레포를 pnpm 워크스페이스로 전환하고, 기존 웹 앱 전체를 `apps/waylog-web`으로 이동한다. 웹 앱의 동작·빌드·배포는 이전과 완전히 동일해야 한다.

**Architecture:** 공유 패키지는 아직 만들지 않는다. 이 단계는 **순수한 파일 이동과 설정 경로 수정**이다. 소스 코드(`src/**`)는 단 한 줄도 바뀌지 않는다. 루트에는 워크스페이스 설정과 레포 전역 파일만 남고, 앱에 종속된 모든 설정은 `apps/waylog-web`으로 내려간다.

**Tech Stack:** pnpm 10.33 workspace, Vite 7, React Router 7, Vitest 3, Playwright, Vercel

**Spec:** `docs/2026-08-19-monorepo-react-native-design.md`

## Global Constraints

- 패키지 매니저는 pnpm 10.33.0 고정 (`packageManager` 필드 유지)
- 앱 디렉토리명은 `apps/waylog-web` (스펙 결정 사항)
- `src/**` 내부 소스 코드는 **수정하지 않는다.** 이 단계에서 코드 변경은 [3] 패키지 이전으로 미룬다
- `~*` alias는 이 단계에서 유지한다. `@waylog/*` 전환은 [3]에서 한다
- 루트 `.npmrc`에 `public-hoist-pattern[]=*react-native*`, `public-hoist-pattern[]=*expo*`를 넣는다. [2]에서 필요하지만 워크스페이스 설정과 함께 두는 것이 자연스럽다
- 모든 작업 후 `docs/codebase.md`를 갱신한다 (CLAUDE.md 규칙)
- 커밋 메시지는 한글, 스코프 활용

## 이동 대상 정리

**`apps/waylog-web`으로 이동:**

| 대상 | 비고 |
| --- | --- |
| `src/` | 통째로 |
| `e2e/` | Playwright 스펙 |
| `public/` | 정적 자산 + 서비스워커 산출물 |
| `api/` | **빈 디렉토리 — 삭제한다** (git 미추적) |
| `vite.config.ts` | |
| `vite.sw.config.ts` | |
| `vitest.config.ts` | |
| `playwright.config.ts` | |
| `react-router.config.ts` | |
| `vercel.ts` | 내용 변경 불필요 (경로가 전부 URL 기준) |
| `tsconfig.app.json` / `tsconfig.node.json` / `tsconfig.sw.json` | |
| `.env` / `.env.test` | gitignore 대상이지만 물리적으로 옮겨야 Vite가 찾는다 |

**루트에 남는 것:**

| 대상 | 이유 |
| --- | --- |
| `pnpm-workspace.yaml` (신규) | 워크스페이스 정의 |
| `.npmrc` (신규) | 호이스팅 설정 |
| `package.json` | 워크스페이스 루트로 재작성 |
| `pnpm-lock.yaml` | 워크스페이스 전체 lockfile |
| `tsconfig.json` | 프로젝트 레퍼런스 루트 |
| `eslint.config.js` | 레포 전역 lint |
| `tools/` | eslint 커스텀 룰 |
| `supabase/` | DB 마이그레이션·엣지 함수. 앱이 아니라 백엔드 |
| `docs/`, `.github/`, `CLAUDE.md`, `AGENTS.md`, `README.md` | 레포 전역 |

**정리 대상 (git 추적 중이나 불필요):**

- `stats.html` (6MB 번들 분석 산출물), `yarn-error.log`, `reviews-codex.md`, `dev-dist/`
- 이번 작업 범위에서 벗어나므로 **건드리지 않는다.** 별도 정리 커밋으로 남긴다

---

### Task 1: pnpm 워크스페이스 골격 생성

루트에 워크스페이스 설정을 만들고 앱 디렉토리를 준비한다. 아직 파일을 옮기지 않아서
이 시점에는 워크스페이스가 빈 상태다. 다음 태스크의 이동이 곧바로 유효해지도록 골격만 세운다.

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `.npmrc`

**Interfaces:**
- Consumes: 없음
- Produces: `apps/*`, `packages/*` 워크스페이스 글롭. Task 2가 `apps/waylog-web`을 여기에 채운다

- [ ] **Step 1: `pnpm-workspace.yaml` 생성**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 2: `.npmrc` 생성**

`node-linker`는 기본(심링크)을 유지하고 RN/Expo 관련 패키지만 호이스팅한다.
CocoaPods와 Gradle은 pnpm을 모르는 외부 도구라 중첩 심링크에서 경로 해석이 깨질 수 있다.

```
public-hoist-pattern[]=*react-native*
public-hoist-pattern[]=*expo*
```

- [ ] **Step 3: 설정이 읽히는지 확인**

Run: `pnpm ls --depth -1`
Expected: 에러 없이 현재 패키지 정보가 출력된다. (워크스페이스에 아직 패키지가 없어 경고가 나올 수 있으나 실패는 아니다)

- [ ] **Step 4: 커밋**

```bash
git add pnpm-workspace.yaml .npmrc
git commit -m "chore(workspace): pnpm 워크스페이스 설정 추가"
```

---

### Task 2: 웹 앱 파일을 apps/waylog-web으로 이동

파일을 물리적으로 옮긴다. 설정 파일 내용은 **아직 고치지 않는다.**
이 태스크가 끝난 시점에는 빌드가 깨진 상태가 정상이다. Task 3에서 경로를 고친다.

이동과 경로 수정을 나누는 이유는, `git mv`로 인한 대량 변경과 실제 내용 변경을
같은 커밋에 섞으면 리뷰에서 무엇이 바뀌었는지 분간할 수 없기 때문이다.

**Files:**
- Move: `src/`, `e2e/`, `public/` → `apps/waylog-web/`
- Move: `vite.config.ts`, `vite.sw.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `react-router.config.ts`, `vercel.ts` → `apps/waylog-web/`
- Move: `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.sw.json` → `apps/waylog-web/`
- Move: `.env`, `.env.test` → `apps/waylog-web/` (git 미추적, 수동 이동)
- Delete: `api/` (빈 디렉토리)

**Interfaces:**
- Consumes: Task 1의 `apps/*` 글롭
- Produces: `apps/waylog-web/` 아래의 전체 웹 앱 트리. Task 3이 이 경로를 전제로 설정을 고친다

- [ ] **Step 1: 앱 디렉토리 생성 후 git 추적 파일 이동**

`git mv`를 쓰면 git이 이동을 rename으로 인식해 히스토리가 보존된다.

```bash
mkdir -p apps/waylog-web
git mv src e2e public apps/waylog-web/
git mv vite.config.ts vite.sw.config.ts vitest.config.ts apps/waylog-web/
git mv playwright.config.ts react-router.config.ts vercel.ts apps/waylog-web/
git mv tsconfig.app.json tsconfig.node.json tsconfig.sw.json apps/waylog-web/
```

- [ ] **Step 2: gitignore 대상 파일 수동 이동**

`.env`는 git에 없으므로 `git mv`가 안 된다. Vite는 프로젝트 루트에서 `.env`를 찾으므로
앱 디렉토리로 내려가야 한다. 이동하지 않으면 dev 서버에서 Supabase 환경변수가 비어
앱이 동작하지 않는다.

```bash
mv .env .env.test apps/waylog-web/
```

- [ ] **Step 3: 빈 `api/` 디렉토리 삭제**

Vercel Serverless Function 용도로 만들었으나 파일이 없다. 앱이 `apps/waylog-web`으로
내려가면 루트에 남을 이유가 없다.

```bash
rmdir api
```

- [ ] **Step 4: 이동 결과 확인**

Run: `ls apps/waylog-web && ls`
Expected:
- `apps/waylog-web`에 `src`, `e2e`, `public`, 각종 `*.config.ts`, `tsconfig.*.json`, `.env`가 있다
- 루트에 `src`, `e2e`, `public`, `api`가 **없다**
- 루트에 `package.json`, `tsconfig.json`, `eslint.config.js`, `tools`, `supabase`, `docs`는 **그대로 있다**

- [ ] **Step 5: 커밋**

이 시점에 빌드는 깨져 있다. 의도된 상태이며 다음 태스크에서 고친다.

```bash
git add -A
git commit -m "chore(workspace): 웹 앱을 apps/waylog-web으로 이동"
```

---

### Task 3: 앱 package.json 분리 및 설정 경로 수정

루트 `package.json`을 워크스페이스 루트용으로 축소하고, 앱용 `package.json`을 새로 만든다.
설정 파일들의 경로를 앱 기준으로 고친다.

**Files:**
- Create: `apps/waylog-web/package.json`
- Modify: `package.json` (루트 — 워크스페이스 루트로 축소)
- Modify: `tsconfig.json` (루트 — 레퍼런스 경로)
- Modify: `apps/waylog-web/tsconfig.app.json` (tsBuildInfoFile 경로)
- Modify: `apps/waylog-web/tsconfig.node.json` (tsBuildInfoFile 경로)
- Modify: `apps/waylog-web/tsconfig.sw.json` (tsBuildInfoFile 경로)

**Interfaces:**
- Consumes: Task 2가 만든 `apps/waylog-web/` 트리
- Produces:
  - `waylog-web` 패키지 (name 필드). 루트에서 `pnpm --filter waylog-web <script>`로 호출 가능
  - 루트 스크립트 `dev`, `build`, `test`, `test:e2e`, `lint`, `ts-check` — CI가 이 이름을 그대로 쓴다

- [ ] **Step 1: 앱 `package.json` 생성**

기존 루트 `package.json`의 `dependencies`, `devDependencies`, `scripts`, `msw` 필드를
그대로 옮긴다. `packageManager`는 루트에만 남긴다.

`@aws-sdk/*`, `dotenv`, `tsx`, `supabase`, `glob`, `minimatch`처럼 스크립트·도구용
의존성도 지금은 함께 옮긴다. 이 단계의 목표는 재분류가 아니라 **동작 보존**이다.

```json
{
  "name": "waylog-web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build:sw": "vite build --config vite.sw.config.ts",
    "build": "pnpm build:sw && react-router build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "ts-check": "tsc -b --noEmit",
    "gen-types": "supabase gen types typescript --project-id feubgswdgmxrbpbfbqje > src/api/_database.types.ts"
  },
  "msw": {
    "workerDirectory": ["public"]
  }
}
```

`dependencies`와 `devDependencies`는 **기존 루트 `package.json`에서 그대로 복사한다.**
버전을 임의로 바꾸지 않는다.

이 태스크를 시작하는 시점에는 루트 `package.json`이 아직 원본 상태이므로 그대로 읽으면 된다.
이미 축소한 뒤라면 다음으로 원본을 되찾는다.

```bash
git show $(git log --format=%H -1 --diff-filter=M -- package.json)~1:package.json
```

- [ ] **Step 2: 루트 `package.json` 축소**

워크스페이스 루트는 의존성을 갖지 않는다. 스크립트는 앱으로 위임한다.
CI(`.github/workflows/ci.yml`)가 `pnpm ts-check`, `pnpm test`, `pnpm test:e2e`를
루트에서 호출하므로 **같은 스크립트 이름을 유지해야 한다.**

```json
{
  "name": "waylog",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "pnpm --filter waylog-web dev",
    "build": "pnpm --filter waylog-web build",
    "test": "pnpm --filter waylog-web test",
    "test:e2e": "pnpm --filter waylog-web test:e2e",
    "lint": "eslint .",
    "ts-check": "pnpm --filter waylog-web ts-check"
  },
  "packageManager": "pnpm@10.33.0"
}
```

- [ ] **Step 3: 루트 `tsconfig.json` 레퍼런스 경로 수정**

```json
{
  "files": [],
  "references": [
    { "path": "./apps/waylog-web/tsconfig.app.json" },
    { "path": "./apps/waylog-web/tsconfig.node.json" },
    { "path": "./apps/waylog-web/tsconfig.sw.json" }
  ]
}
```

- [ ] **Step 4: 각 tsconfig의 `tsBuildInfoFile` 확인**

세 파일 모두 `"tsBuildInfoFile": "./node_modules/.tmp/..."` 를 갖는다.
이 경로는 tsconfig 파일 자신을 기준으로 해석되므로 `apps/waylog-web/node_modules/.tmp/`가 된다.
pnpm 워크스페이스는 앱마다 `node_modules`를 만들므로 **수정 불필요하다.**

`tsconfig.node.json`의 `include`는 `["vite.config.ts", "playwright.config.ts"]`인데
두 파일이 tsconfig와 같은 디렉토리로 함께 이동했으므로 **수정 불필요하다.**

`tsconfig.app.json`의 `paths`는 `{"~*": ["./src/*"]}`이고 `src`도 함께 이동했으므로
**수정 불필요하다.**

변경할 것이 없음을 확인만 하고 넘어간다.

- [ ] **Step 5: 의존성 재설치**

```bash
pnpm install
```

Expected: `apps/waylog-web/node_modules`가 생성되고 lockfile이 워크스페이스 구조로 갱신된다.

- [ ] **Step 6: 타입 체크로 검증**

Run: `pnpm ts-check`
Expected: PASS. 에러 0건.

실패하면 경로 문제다. 에러 메시지의 파일 경로를 보고 어느 설정이 잘못된 위치를
가리키는지 확인한다.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "chore(workspace): 루트와 앱 package.json 분리"
```

---

### Task 4: eslint 설정을 워크스페이스에 맞게 수정

`eslint.config.js`가 루트에 남는데, `package/import` 커스텀 룰이 `'~': './src'` alias를
레포 루트 기준으로 해석한다. 앱이 내려갔으므로 경로가 어긋난다.

**Files:**
- Modify: `eslint.config.js`

**Interfaces:**
- Consumes: Task 2의 이동 결과
- Produces: 루트에서 `pnpm lint`가 `apps/waylog-web/src`를 올바르게 검사

- [ ] **Step 1: 현재 룰이 alias를 어떻게 쓰는지 확인**

Run: `cat tools/eslint/package-import.js`
`aliases: { '~': './src' }` 옵션이 어떻게 해석되는지 파악한다.
상대 경로를 어느 기준으로 resolve하는지가 핵심이다.

- [ ] **Step 2: `globalIgnores`에 워크스페이스 산출물 추가**

앱이 내려가면서 무시 경로도 바뀐다.

```js
globalIgnores([
  '**/dist',
  '**/dev-dist',
  '**/.react-router',
  '**/node_modules',
]),
```

- [ ] **Step 3: alias 경로 수정**

Step 1에서 확인한 해석 방식에 따라 둘 중 하나를 적용한다.

**(a) 룰이 프로세스 CWD 기준으로 해석하는 경우** — alias 값을 앱 경로로 바꾼다.

```js
'package/import': ['error', { aliases: { '~': './apps/waylog-web/src' }}],
```

**(b) 룰이 lint 대상 파일 기준으로 해석하는 경우** — 변경 불필요하다.

- [ ] **Step 4: lint 실행으로 검증**

Run: `pnpm lint`
Expected: 이동 전과 동일한 결과. 새로운 `package/import` 에러가 **생기지 않아야 한다.**

이동 전 기준값이 필요하면 다음으로 확인한다.

```bash
git stash && pnpm lint 2>&1 | tail -5 && git stash pop
```

- [ ] **Step 5: 커밋**

```bash
git add eslint.config.js
git commit -m "chore(workspace): eslint 경로를 워크스페이스 구조에 맞게 수정"
```

---

### Task 5: CI 워크플로우 경로 수정

`.github/workflows/ci.yml`이 루트 기준 경로를 쓰는 지점을 고친다.
스크립트 호출(`pnpm ts-check` 등)은 Task 3에서 루트 스크립트를 유지했으므로 그대로 동작한다.

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Task 3이 만든 루트 위임 스크립트
- Produces: 워크스페이스 구조에서 통과하는 CI

- [ ] **Step 1: Playwright 리포트 업로드 경로 수정**

`e2e-test` 잡의 아티팩트 경로가 루트 기준이다. 리포트는 앱 디렉토리에서 생성된다.

```yaml
          path: |
            apps/waylog-web/playwright-report/
            apps/waylog-web/test-results/
```

- [ ] **Step 2: lint 잡의 파일 경로 확인**

`lint-check` 잡은 `git diff`로 변경 파일을 뽑아 `pnpm exec eslint`에 넘긴다.
`git diff --name-only`는 **레포 루트 기준 경로**를 출력하고 `pnpm exec eslint`도
루트에서 실행되므로 **수정 불필요하다.**

확인만 하고 넘어간다.

- [ ] **Step 3: 환경변수 위치 확인**

`test`, `e2e-test` 잡의 `env:` 블록에 `VITE_*` 값이 있다. GitHub Actions의 env는
프로세스 환경변수로 주입되고 Vite는 `.env` 파일뿐 아니라 프로세스 환경변수도 읽는다.
`pnpm --filter`로 자식 프로세스를 띄워도 환경변수는 상속되므로 **수정 불필요하다.**

확인만 하고 넘어간다.

- [ ] **Step 4: 커밋**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: 아티팩트 경로를 워크스페이스 구조에 맞게 수정"
```

---

### Task 6: 전체 검증

앱이 이전과 동일하게 동작하는지 확인한다. 이 단계의 완료 기준이다.

**Files:**
- 없음 (검증만)

**Interfaces:**
- Consumes: Task 1~5의 모든 결과
- Produces: 없음

- [ ] **Step 1: 타입 체크**

Run: `pnpm ts-check`
Expected: PASS

- [ ] **Step 2: 유닛 테스트**

Run: `pnpm test`
Expected: 이동 전과 동일한 테스트 수가 통과한다.

이동 전 기준값이 필요하면 `git stash` 후 실행해 비교한다.

- [ ] **Step 3: 프로덕션 빌드**

Run: `pnpm build`
Expected: PASS. `apps/waylog-web/dist/`에 산출물이 생성된다.

서비스워커 빌드(`build:sw`)가 먼저 돌아 `apps/waylog-web/public/`에 `*.sw.js`를 쓰고,
이어서 `react-router build`가 실행된다.

- [ ] **Step 4: dev 서버 기동 확인**

```bash
pnpm dev
```

Expected: `http://localhost:5173`에서 앱이 뜬다. 브라우저에서 접속해
**로그인 화면이 정상 렌더되는지** 확인한다.

`.env`가 Task 2 Step 2에서 옮겨지지 않았다면 Supabase 환경변수가 비어 콘솔에
`Supabase 환경변수가 설정되지 않았습니다` 경고가 뜬다. 그 경우 `.env` 위치를 확인한다.

확인 후 서버를 종료한다.

- [ ] **Step 5: E2E 테스트**

Run: `pnpm test:e2e`
Expected: 이동 전과 동일하게 통과한다.

`playwright.config.ts`의 `webServer.command`가 `pnpm dev --mode test`인데, 이 설정은
`apps/waylog-web`에서 실행되므로 앱의 `dev` 스크립트를 직접 호출한다. 정상이다.

- [ ] **Step 6: 검증 결과 기록**

각 단계의 실제 출력을 남긴다. 통과 주장만으로는 완료로 보지 않는다.

---

### Task 7: 문서 갱신

CLAUDE.md 규칙에 따라 `docs/codebase.md`를 갱신한다.

**Files:**
- Modify: `docs/codebase.md`

**Interfaces:**
- Consumes: Task 1~6의 결과
- Produces: 없음

- [ ] **Step 1: 디렉토리 구조 섹션 갱신**

`docs/codebase.md`의 "디렉토리 구조" 섹션이 `src/`를 레포 루트 기준으로 설명한다.
워크스페이스 구조를 반영한다.

```
apps/
├── waylog-web/                 # 웹 앱 (React Router 7 + Vite)
│   ├── src/                    # 아래 구조는 기존과 동일
│   ├── e2e/
│   ├── public/
│   └── vite.config.ts 등 앱 설정
packages/                       # 공유 패키지 (아직 비어 있음 — [3]에서 채운다)
supabase/                       # DB 마이그레이션·엣지 함수
tools/                          # eslint 커스텀 룰
```

- [ ] **Step 2: 파일 경로 표기 갱신**

문서 내 `src/features/...` 형태의 경로가 이제 `apps/waylog-web/src/features/...`다.
문서 전반의 경로 표기를 확인하고, 루트 기준 경로가 필요한 곳을 갱신한다.

Run: `grep -n "src/" docs/codebase.md | head -40`

- [ ] **Step 3: 기술 스택 표에 워크스페이스 추가**

```
| Monorepo  | pnpm workspace                     |
```

- [ ] **Step 4: 커밋**

```bash
git add docs/codebase.md
git commit -m "docs: 워크스페이스 구조를 코드베이스 문서에 반영"
```

---

## 완료 기준

- `pnpm ts-check` 통과
- `pnpm test` — 이동 전과 동일한 결과
- `pnpm build` 성공, `apps/waylog-web/dist/` 생성
- `pnpm dev`로 앱이 뜨고 로그인 화면 렌더
- `pnpm test:e2e` — 이동 전과 동일한 결과
- `src/**` 소스 코드 변경 0건 (`git diff --stat`으로 확인 시 rename만 존재)

## 수동 조치 (코드 외부)

플랜 실행으로 처리할 수 없는 항목이다. 병합 전에 사람이 처리한다.

- **Vercel 대시보드에서 Root Directory를 `apps/waylog-web`으로 변경한다.**
  변경 전에 배포하면 빌드가 실패한다. `vercel.ts`의 내용은 경로가 전부 URL 기준이라
  수정할 필요가 없다.

## 이 단계에서 하지 않는 것

- 공유 패키지(`@waylog/domains`, `@waylog/react`) 생성 → [3]
- `import.meta.env` 제거, Proxy 지연 초기화 → [3]
- `~*` alias를 `@waylog/*`로 교체 → [3]
- RN 앱 스캐폴딩 → [2]
- `stats.html`, `yarn-error.log`, `reviews-codex.md`, `dev-dist/` 정리 → 별도 커밋
