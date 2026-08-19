import { http, HttpResponse } from "msw";
import { MOCK_USER_ID } from "~features/auth/auth.mock";

export const MOCK_USER_PROFILE_ROW = {
  id: MOCK_USER_ID,
  name: '테스트 유저',
  avatar_url: null,
}

export default [
  http.get('*/rest/v1/user_profiles', ({ request }) => {
    const isSingle = request.headers.get('accept')?.includes('vnd.pgrst.object')
    return HttpResponse.json(isSingle ? MOCK_USER_PROFILE_ROW : [MOCK_USER_PROFILE_ROW])
  })
]