# 앱 배포 가이드

앱(`apps/waylog-app`) 배포 방법이다. 기본은 PR을 머지하면 GitHub Actions([`app-cd.yml`](../.github/workflows/app-cd.yml))가 배포하는 방식이고, Actions를 못 쓸 때만 직접 배포한다. 자동화와 스크립트는 iOS만 있다.

## 어떤 배포를 할까

| 바꾼 내용                                                                         | 배포    | `version` |
| --------------------------------------------------------------------------------- | ------- | --------- |
| JS만 (스토어에 출시된 버전과 `version`이 같을 때)                                  | OTA     | 그대로    |
| 네이티브 모듈, 권한·아이콘·스플래시·번들 ID 등 네이티브 설정, Expo SDK 업그레이드 | 앱 배포 | 올린다    |

## PR로 배포

### OTA

1. 앱 코드를 고치는 PR을 만든다.
2. PR을 열면 `pr-<번호>` 브랜치로 preview 번들이 올라간다. preview 빌드가 설치된 기기에서 확인한다.
3. `main`에 머지한다. `production`으로 자동 배포된다.

#### 강제 업데이트

PR의 Labels에서 `mandatory`를 선택한다.

### 앱 배포

1. 네이티브 변경과 함께 `app.config.ts`의 `version`을 올린 PR을 만든다.
2. `main`에 머지한다. iOS 빌드 요청과 `app-v<version>` GitHub Release가 자동으로 만들어진다.
3. EAS 대시보드에서 빌드가 끝나길 기다린다.
4. 빌드가 끝나면 `apps/waylog-app`에서 스토어로 올린다.

   ```bash
   pnpm submit-package
   ```

5. TestFlight로 확인하고 App Store Connect에서 심사에 제출한다.

반려되면 수정 PR을 머지한다. 자동으로 다시 빌드된다.

스토어에 출시되면 이후 JS 변경은 OTA로 나간다.

#### 강제 업데이트

패키지 심사 승인 후 Supabase 대시보드에서 `app_version_policies`의 `minimum_version`을 올린다.

```sql
update app_version_policies set minimum_version = '1.2.0', updated_at = now() where platform = 'ios';
```

## 수기 배포

### OTA

`apps/waylog-app`에서 스크립트를 실행한다.

```bash
pnpm replace-bundle
```

#### 강제 업데이트

강제 업데이트 여부에서 `예`를 선택한다.

### 앱 배포

1. `app.config.ts`의 `version`을 올려 `main`에 머지한다.
2. `apps/waylog-app`에서 스크립트를 실행한다.

   ```bash
   pnpm upload-package
   ```

3. 빌드 요청 후 출력되는 안내를 순서대로 진행한다.
   1. EAS 대시보드에서 빌드가 끝나길 기다린다.
   2. `pnpm submit-package`로 스토어에 올린다.
   3. TestFlight로 확인하고 App Store Connect에서 심사에 제출한다.
   4. `app-v<version>` 릴리스가 없으면 안내된 `gh release create` 명령을 실행한다.

#### 강제 업데이트

강제 업데이트 여부에서 `예`를 선택하면 안내에 `minimum_version`을 올리는 SQL이 나온다. 패키지 심사 승인 후 Supabase 대시보드에서 실행한다.

---

# 참고

## 버전

| 이름                          | 위치                                   | 누가 보나      | 올리는 시점                                 |
| ----------------------------- | -------------------------------------- | -------------- | ------------------------------------------- |
| `version`                     | `app.config.ts`                        | 사용자, 스토어 | 네이티브가 바뀌는 릴리스                    |
| `buildNumber` / `versionCode` | EAS가 관리(`appVersionSource: remote`) | 스토어         | `production` 빌드마다 자동(`autoIncrement`) |
| `runtimeVersion`              | `version`에서 파생(`appVersion` 정책)  | OTA 서버       | `version`을 올리면 같이 바뀐다              |

OTA는 런타임 버전과 채널이 같은 앱에만 간다. `version`을 올리면 이후 OTA는 새 버전 앱에만 가고, 옛 버전 앱은 스토어에서 새 앱을 받아야 한다.

## 자동화가 하는 일

| 상황                                         | 하는 일                                                                                                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main` 대상 PR                               | 직전 푸시에서 `apps/waylog-app`·`packages`가 바뀐 경우에만 `pr-<번호>`로 OTA 게시(preview 환경). 최초·재오픈·강제 푸시는 PR base 대비로 판단. 포크 PR 제외 |
| `main` push (앱·`packages`·lock 변경)        | `pnpm test` 후 `production`으로 OTA 게시. `version`이 스토어 버전과 다른 push는 OTA를 건너뜀                                                                             |
| `main` push에서 `version`이 App Store `Ready for Sale` 버전과 다름 | iOS 빌드 요청(`--no-wait`, 빌드가 같은 커밋의 번들을 내장), 요청 성공 후 `app-v<version>` 릴리스 생성                                                      |
| 수동 실행                                    | `main`에서만 `production` OTA 게시. `build`를 켜면 OTA 대신 iOS 빌드만 요청(릴리스 없음)                                                                   |

## 스토어 버전 비교

빌드 여부는 `app.config.ts`의 `version`과 App Store Connect의 `Ready for Sale` 버전을 비교해 정한다. `scripts/read-store-version.mjs`가 조회하고, 배포된 버전이 없으면(첫 출시 전) 빌드한다. 비교는 뒤쪽 `.0`을 무시해서 `1.0`과 `1.0.0`을 같게 본다.

GitHub Secrets에 `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY`(`.p8` 내용 전체)가 필요하다. 없으면 워크플로가 실패한다.

## 약속과 이유

**네이티브를 바꾸면 `version`을 올린다.** 올리지 않으면 새 JS가 옛 네이티브 앱에 내려가 크래시할 수 있다. 리뷰에서 네이티브 변경이 보이면 `version` 변경이 같이 있는지 본다.

**`mandatory` 라벨은 PR에 달린 것만 읽는다.** `main`에 직접 푸시했다면 라벨이 없으니 수동 실행의 `is_mandatory`를 쓴다. `version`을 올린 PR은 OTA가 나가지 않아 라벨이 의미 없다. 네이티브가 바뀐 경우 OTA 강업은 쓸 수 없고 앱 강업을 쓴다.

**`app.config.ts`의 `version` 줄 형식을 유지한다.** 워크플로가 `  version: "1.0.0"`(들여쓰기 2칸, 큰따옴표)를 정규식으로 읽는다. 형식이 바뀌면 버전을 못 읽고 워크플로가 실패한다.

**태그를 직접 만들지 않는다.** `app-v<version>` 태그는 릴리스와 함께 워크플로가 만든다. 같은 이름의 릴리스가 이미 있으면 워크플로는 릴리스 생성을 건너뛴다.

**`buildNumber`·`versionCode`는 손대지 않는다.** EAS가 빌드마다 올린다.

**`version`이 스토어 버전과 다른 동안에는 OTA가 없다.** 그 PR에 든 JS 수정도 새 빌드가 스토어를 거쳐 설치되기 전에는 사용자에게 가지 않는다.

**빌드 요청 성공은 출시가 아니다.** 릴리스는 빌드 요청이 성공했다는 뜻이다. 자동 제출은 없어서 빌드가 끝난 뒤 `pnpm submit-package`로 직접 올린다. `--latest`는 가장 최근 빌드를 고르므로 끝난 빌드가 맞는지 확인한다.

**릴리스 노트에는 웹 PR도 섞인다.** 필요하면 릴리스를 편집한다.

**반려되면 `version`은 그대로 둔다.** 코드를 고쳐 머지하면 스토어 버전과 여전히 달라 자동으로 다시 빌드한다. 빌드 번호만 올라간다.

## 수기 배포 참고

**스크립트가 먼저 확인하는 것(production만).** `main` 브랜치, 커밋 안 된 변경 없음, 로컬 `main`이 `origin/main`과 같음. OTA는 이어서 `pnpm test`도 돌린다. OTA와 빌드는 로컬 파일을 그대로 올리므로 하나라도 어긋나면 중단한다.

**OTA는 고른 환경(`--environment`)으로 올라간다.** expo.dev의 같은 이름 환경변수(`EXPO_PUBLIC_*`)가 번들에 들어간다. 로컬 `.env`는 쓰이지 않는다.

**`version`을 올린 커밋을 `main`에 머지하면 Actions가 이미 빌드를 요청했다.** 수기 앱 배포는 그 빌드가 실패했거나 다시 빌드해야 할 때만 한다. 둘 다 돌았다면 EAS 대시보드에서 한쪽을 취소한다.

**릴리스 단계는 `app-v<version>` 릴리스가 없을 때만 출력된다.** 자동 경로에서 이미 만들어졌으면 건너뛴다.

**앱 강업의 SQL은 스크립트가 실행하지 않는다.** Supabase 대시보드에서 직접 실행한다. 받을 수 없는 버전을 최소 버전으로 올리면 모든 사용자가 막히므로 새 버전이 스토어에서 받아지는지 먼저 확인한다. 앱은 켤 때마다 `app_version_policies`를 읽고, 설치된 `version`이 `minimum_version`보다 낮으면 닫을 수 없는 업데이트 화면을 보여 준다. 조회 실패, 3초 무응답, 행 없음이면 사용자를 막지 않는다.

**수기 경로에는 네이티브 변경 검증이 없다.** OTA로 올리기 전에 네이티브 변경이 없는지 직접 확인한다.
