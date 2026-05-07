
export class AuthError extends Error {
  message = '로그인이 필요합니다.'

  static isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError;
  }
}