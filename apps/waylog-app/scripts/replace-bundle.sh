#!/usr/bin/env bash
set -euo pipefail

environment=${1:-}
if [ -z "$environment" ]; then
  read -r -p "환경 (production/preview): " environment
fi
if [ "$environment" != "production" ] && [ "$environment" != "preview" ]; then
  echo "환경은 production 또는 preview여야 합니다." >&2
  exit 1
fi

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
  if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo "로컬 main이 origin/main과 다릅니다." >&2
    exit 1
  fi
fi

read -r -p "강제 업데이트로 배포할까요? (y/N) " mandatory_answer
read -r -p "메시지 (비우면 커밋 SHA): " message
message=${message:-$(git rev-parse HEAD)}

if [ "$environment" = "production" ]; then
  pnpm test
fi

if [ "$mandatory_answer" = "y" ]; then
  export BUNDLE_IS_MANDATORY=true
fi
pnpm eas update --branch "$environment" --environment "$environment" --message "$message" --non-interactive
