#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/select-option.sh"

select_option "환경 선택" production preview
environment=$selected

sha=$(git rev-parse HEAD)

if [ "$environment" = "production" ]; then
  if [ "$(git branch --show-current)" != "main" ]; then
    echo "production은 main 브랜치에서만 배포할 수 있습니다." >&2
    exit 1
  fi
  if [ -n "$(git status --porcelain)" ]; then
    echo "커밋하지 않은 변경이 있습니다." >&2
    exit 1
  fi
  git fetch --quiet origin main
  if [ "$sha" != "$(git rev-parse origin/main)" ]; then
    echo "로컬 main이 origin/main과 다릅니다." >&2
    exit 1
  fi
fi

version=$(sed -nE 's/^  version: "([^"]+)".*/\1/p' app.config.ts | head -n1)
if [ -z "$version" ]; then
  echo "app.config.ts에서 version을 읽지 못했습니다." >&2
  exit 1
fi
echo "version $version 으로 빌드합니다."

mandatory_answer=아니오
if [ "$environment" = "production" ]; then
  select_option "강제 업데이트로 배포할까요?" 아니오 예
  mandatory_answer=$selected
fi
read -r -p "메시지 (비우면 커밋 SHA): " message
message=${message:-$sha}

pnpm eas build --platform ios --profile "$environment" --message "$message" --non-interactive --no-wait

if [ "$environment" != "production" ]; then
  exit 0
fi

step=1
echo
echo "빌드를 요청했습니다. 아래 순서로 이어서 진행하세요."
echo "$step. EAS 대시보드에서 빌드가 끝나길 기다립니다."
step=$((step + 1))
echo "$step. 스토어로 올립니다: pnpm submit-package"
step=$((step + 1))
echo "$step. TestFlight로 확인하고 App Store Connect에서 심사에 제출합니다."
step=$((step + 1))
if ! gh release view "app-v$version" >/dev/null 2>&1; then
  echo "$step. 릴리스를 만듭니다: gh release create app-v$version --target $sha --title app-v$version --generate-notes"
  step=$((step + 1))
fi
if [ "$mandatory_answer" = "예" ]; then
  echo "$step. Supabase에서 minimum_version을 올립니다:"
  echo "   update app_version_policies set minimum_version = '$version', updated_at = now() where platform = 'ios';"
fi
