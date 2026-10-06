#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/select-option.sh"

select_option "환경 선택" production preview
environment=$selected

# if [ "$environment" = "production" ]; then
#   if [ "$(git branch --show-current)" != "main" ]; then
#     echo "production은 main 브랜치에서만 배포할 수 있습니다." >&2
#     exit 1
#   fi
#   if [ -n "$(git status --porcelain)" ]; then
#     echo "커밋하지 않은 변경이 있습니다." >&2
#     exit 1
#   fi
#   git fetch --quiet origin main
#   if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
#     echo "로컬 main이 origin/main과 다릅니다." >&2
#     exit 1
#   fi
# fi

select_option "강제 업데이트로 배포할까요?" 아니오 예
mandatory_answer=$selected
read -r -p "메시지 (비우면 커밋 SHA): " message
message=${message:-$(git rev-parse HEAD)}

if [ "$environment" = "production" ]; then
  pnpm test
fi

if [ "$mandatory_answer" = "예" ]; then
  export BUNDLE_IS_MANDATORY=true
fi
pnpm eas update --branch "$environment" --environment "$environment" --message "$message" --non-interactive
