#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/select-option.sh"

select_option "환경 선택" production preview
environment=$selected

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
