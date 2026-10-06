# 약관 동의 가입 플로우 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. 플랜에는 인터페이스와 검증 케이스 제목까지만 담는다. 테스트 본문은 실행 시점에 채운다.

**Goal:** 카카오 신규 가입자에게 약관 동의를 받고, 동의 이력을 `user_profiles`에 남긴다. (Apple 로그인은 별도 브랜치)

**Architecture:** 가입 완료 = `user_profiles` 행 존재. 세션은 있으나 프로필이 없으면 "가입 대기"이고 `SignUpGate`가 동의 화면을 띄운다. 동의하면 프로필을 동의 필드와 함께 insert하고, 거절하면 Edge Function이 방금 만들어진 `auth.users`를 삭제한다. 충돌(23505) 무시로 신규/기존을 가르던 `createProfileIfAbsent`는 제거한다.

**Tech Stack:** Supabase(Postgres, Edge Function/Deno), React Query, React Router 7(web), React Navigation(app), react-native-webview

## Decisions

- 기존 유저는 마이그레이션에서 현재 약관 버전으로 일괄 동의 처리한다.
- 마케팅 수신 동의는 받지 않는다. 필수 동의는 이용약관, 개인정보 수집·이용, 만 14세 이상 확인.
- 위치기반서비스 약관은 만들지 않는다. 현재 좌표는 `place-search` 호출 시 카카오로 전달될 뿐 서버에 저장하지 않는다. 처리방침에 한 조항으로 고지한다.
- 약관 본문은 웹 `/terms`, `/privacy`(비로그인 접근 가능). 앱은 웹뷰로 연다.
- 운영자 정보(운영자명, 문의 메일, 보호책임자, 시행일)는 미정이라 `legal.config.ts`에 모은다.

## File Map

| 파일 | 책임 |
| --- | --- |
| `supabase/migrations/20260930100000_user_profile_terms_consent.sql` | `terms_version`, `terms_agreed_at` 컬럼 + 기존 유저 백필 + NOT NULL |
| `supabase/functions/cancel-sign-up/index.ts` | 프로필이 없는 유저만 `auth.users`에서 삭제 |
| `packages/domains/src/modules/terms/terms.types.ts` | `TERMS_VERSION` |
| `packages/domains/src/modules/user-profile/user-profile.api.ts` | `signUp` (프로필 + 동의 기록 insert), `createProfileIfAbsent` 제거 |
| `packages/domains/src/gateways/auth/auth.api.ts` | `cancelSignUp` |
| `packages/domains/src/gateways/auth/usePendingSignUp.ts` | 세션은 있으나 프로필 없는 사용자 |
| `packages/domains/src/gateways/auth/SignUpGate.tsx` | 가입 대기 시 fallback 렌더 |
| `packages/domains/src/gateways/auth/useAuth.ts` | `AuthStateSync`에서 자동 insert 제거 |
| `packages/routes/src/appRoute.ts` | `이용약관`, `개인정보처리방침` |
| `apps/waylog-web/src/features/legal/*` | 약관·처리방침 페이지와 운영자 정보 |
| `apps/waylog-web/src/features/auth/SignUpConsent.tsx` | 웹 동의 화면 |
| `apps/waylog-app/src/features/auth/SignUpConsentScreen.tsx` | 앱 동의 화면 + 약관 웹뷰 |

## Interfaces

```ts
// terms.types.ts
export const TERMS_VERSION = '2026-10-01'

// user-profile.api.ts
export async function signUp(input: { id: string; name?: string; avatar?: string }): Promise<void>

// auth.api.ts
export async function cancelSignUp(): Promise<void>

// usePendingSignUp.ts
export function usePendingSignUp(): AuthUser | null

// SignUpGate.tsx
export function SignUpGate(props: { fallback: ReactNode; children: ReactNode }): JSX.Element
```

## Tasks (웨이브)

1. **웨이브 1 (병렬)**: 마이그레이션 / Edge Function / 법률 문서 페이지
2. **웨이브 2**: 도메인(`signUp`, `cancelSignUp`, `usePendingSignUp`, `SignUpGate`, `AuthStateSync` 정리)
3. **웨이브 3 (병렬)**: 웹 동의 화면 / 앱 동의 화면
4. **마무리**: `docs/codebase.md`, 통합 검증

### 검증 케이스

- `signUp`: 프로필을 동의 버전·시각과 함께 insert한다 / 이미 프로필이 있으면 에러를 그대로 던진다
- `cancelSignUp`: 함수 호출 후 로그아웃한다 / 함수가 실패하면 로그아웃하지 않고 에러를 던진다
- `usePendingSignUp`, `SignUpGate`, UI: 컴포넌트 테스트 인프라가 없어 빌드·타입체크·실제 확인으로 검증

## Review Focus

- 동의 거절 후 재로그인 시 다시 동의 화면이 뜬다 (고아 유저가 남지 않는다)
- 동의 화면에서 앱 종료 시 프로필 없는 세션이 남아도 재실행하면 동의 화면으로 돌아온다
- 프로필이 있는 유저가 `cancel-sign-up`을 호출해도 삭제되지 않는다
- 개발용 이메일 로그인 유저도 프로필이 없으면 동의 화면을 거친다
