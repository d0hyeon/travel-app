import { http, HttpResponse } from "msw";

export default [
  http.get('*/rest/v1/user_profiles', () => HttpResponse.json([]))
]