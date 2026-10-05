# 배포 절차

앱을 배포할 때 반복하는 절차를 모은 문서다. 출시 전 한 번만 하는 일은 [`release-checklist.md`](./release-checklist.md)에 있다.

## 버전

| 이름 | 위치 | 누가 보나 | 올리는 시점 |
| --- | --- | --- | --- |
| `version` | `app.config.ts` | 사용자, 스토어 | 네이티브가 바뀌는 릴리스 |
| `buildNumber` / `versionCode` | EAS가 관리 | 스토어 | 빌드마다 자동(`autoIncrement`) |
| `runtimeVersion` | `version`에서 파생(`appVersion` 정책) | OTA 서버 | `version`을 올리면 같이 바뀐다 |

OTA는 런타임 버전과 채널이 같은 앱에만 번들을 보낸다. `version`을 올리면 이후 OTA는 새 버전 앱에만 가고, 옛 버전 앱은 스토어에서 새 앱을 받아야 한다.

## 어떤 배포인가

네이티브가 바뀌었는지로 가른다.

- JS만 바꿨다 → OTA
- 네이티브 모듈 추가·변경, 권한·아이콘·스플래시·번들 ID 등 네이티브 설정 변경, Expo SDK 업그레이드 → 스토어 배포

네이티브를 바꿨는데 `version`을 올리지 않으면 새 JS가 옛 네이티브 앱에 내려가 크래시할 수 있다.

## OTA 배포

바꾸는 버전은 없다.

```bash
eas update --channel production --message "채팅 목록 버그 수정"
```

- 앱은 켤 때 새 번들을 받아 두고 다음 실행에 적용한다.
- 받은 직후 재시작시키려면 필수 업데이트로 게시한다.

  ```bash
  BUNDLE_IS_MANDATORY=true eas update --channel production --message "..."
  ```

- 먼저 확인하려면 `--channel preview`로 게시하고 preview 빌드가 설치된 기기에서 본다.

## 스토어 배포

1. `app.config.ts`의 `version`을 올리고 커밋한다.
2. 빌드한다.

   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```

3. 스토어로 올린다. `eas build`는 파일을 만들 뿐 스토어에 올리지 않는다.

   ```bash
   eas submit --platform ios --latest
   eas submit --platform android --latest
   ```

4. iOS는 TestFlight로 확인한 뒤 App Store Connect에서 심사에 제출한다. Android는 Play Console에서 트랙을 골라 출시한다.

심사가 반려되면 `version`은 그대로 두고 코드를 고쳐 2번부터 다시 한다. 빌드 번호만 올라간다.

## GitHub Actions 자동화

[`app-cd.yml`](../.github/workflows/app-cd.yml)이 위 절차 중 일부를 대신한다.

| 상황 | 자동으로 하는 일 |
| --- | --- |
| `main` 대상 PR (앱·`packages` 변경) | `pr-<번호>` 브랜치로 OTA 게시(preview 환경) |
| `main` push (앱·`packages`·lock 변경) | 테스트 후 `production` 브랜치로 OTA 게시 |
| `main` push에서 `app.config.ts`의 `version`이 직전 push보다 바뀜 | iOS 빌드 요청, 성공 후 `app-v<version>` GitHub Release(태그 포함, 자동 노트) 생성 |
| 수동 실행(`workflow_dispatch`) | `main`에서 실행했을 때만 `production` 브랜치로 OTA 게시. `build` 입력을 켜면 iOS 빌드도 요청 |

- 스토어 배포는 `version`을 올린 PR을 머지하면 시작된다. 태그를 직접 만들지 않는다.
- OTA를 필수 업데이트로 보내려면 머지되는 PR에 `mandatory` 라벨을 달거나, 수동 실행에서 `is_mandatory`를 켠다.
- 같은 `version`으로 TestFlight만 다시 빌드하려면 수동 실행에서 `build`를 켠다. 이 경우 릴리스는 만들지 않는다.
- 빌드는 `--no-wait`로 EAS 큐에 넣기만 한다. 릴리스는 빌드 요청이 성공했다는 뜻이지 빌드 완료나 스토어 출시를 뜻하지 않는다.
- 자동 제출은 없다. 빌드가 끝나면 `pnpm submit-package`(iOS)로 직접 올린다.
- 릴리스 노트는 웹 PR까지 섞여 나온다.

## 강제 업데이트

두 종류가 있다.

### OTA 강업

JS 수정만으로 해결되는 치명적인 버그에 쓴다. 필수 업데이트로 게시하면 앱이 번들을 받은 직후 재시작한다.

```bash
BUNDLE_IS_MANDATORY=true eas update --channel production --message "..."
```

네이티브가 바뀐 경우에는 쓸 수 없다.

### 스토어 강업

옛 버전 앱을 아예 못 쓰게 하고 스토어로 보낼 때 쓴다. 네이티브 변경이나 서버 API 호환이 깨질 때가 해당한다.

1. 새 버전이 두 스토어에서 사용자에게 받아질 수 있는 상태인지 확인한다. 받을 수 없는 버전을 최소 버전으로 올리면 모든 사용자가 막힌다.
2. Supabase 대시보드의 `app_version_policies`에서 막을 플랫폼 행의 `minimum_version`을 올린다. `ios`와 `android`가 따로 있다.

   ```sql
   update app_version_policies set minimum_version = '1.2.0', updated_at = now() where platform = 'ios';
   ```

앱은 켤 때마다 이 테이블을 읽으므로 배포는 필요 없고 바로 반영된다. 설치된 `version`이 `minimum_version`보다 낮은 앱은 시작 화면 대신 닫을 수 없는 업데이트 화면을 보여 준다. 조회에 실패하거나 3초 안에 응답이 없거나 행이 없으면 사용자를 막지 않는다.

되돌리려면 `minimum_version`을 내리면 된다.
