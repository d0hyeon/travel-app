# 신고·차단 운영

Apple 가이드라인 1.2 는 신고를 24시간 안에 처리하고, 차단이 개발자에게도 전달되기를 요구한다. 현재 코드는 저장까지만 하고 통지는 하지 않으므로 아래 절차로 운영한다.

## 조회

`reports` 는 클라이언트에서 조회할 수 없다. Supabase SQL Editor(service_role)에서 본다.

```sql
select r.created_at, r.target_type, r.target_id, r.reason, r.detail, r.reporter_id
from reports r
order by r.created_at desc;

select b.created_at, b.blocker_id, b.blocked_id
from user_blocks b
order by b.created_at desc;
```

## 조치

- 게시물: `delete from posts where id = '<target_id>';`
- 사용자: 게시물을 지우고 필요하면 Authentication > Users 에서 계정을 삭제한다.
- 처리한 신고는 지금은 별도 상태 컬럼이 없어 행을 그대로 둔다.

## 통지 (미구현)

새 신고와 차단을 메일이나 Slack 으로 받으려면 Supabase Database Webhooks 로 `reports`, `user_blocks` 의 INSERT 를 Edge Function 이나 웹훅 URL 에 연결한다. 연결하기 전에는 매일 위 쿼리로 확인해야 24시간 기준을 지킬 수 있다.

## 차단이 가리는 범위

- 게시물과 그 하위 데이터(사진, 장소, 좋아요, 댓글): `can_view_post` 가 제외한다.
- 공개 사진(`photos`): `photos_select` 가 제외한다.
- 프로필 기록 탭의 여행 요약과 탐색 대표 사진은 SECURITY DEFINER 함수라 아직 제외하지 않는다.
- 여행 채팅은 신고·차단 대상이 아니다.
