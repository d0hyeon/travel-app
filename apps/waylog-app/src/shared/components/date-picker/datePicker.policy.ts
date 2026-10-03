export const DATE_INPUT_MIN_MAX_LIMIT_UNIT = {
  Months: true,
  Days: true,
  Hours: true,
  /**
   * 실효성이 낮아서 분단위는 min max 입력 제한을 구현하지 않는다.
   * 단 추후 기능이 필요할때 놓치지 않도록, 구현이 필요한 모듈에 throw NotImplementedError를 걸어둔다.
   */
  Minutes: false,
} as const
export const 날짜_입력_제한_기능_제공_정책 = DATE_INPUT_MIN_MAX_LIMIT_UNIT

interface NotImplementedErrorOptions {
  features: string
  details?: string
}
export class NotImplementedError extends Error {
  features: string
  details?: string

  constructor({ features, details }: NotImplementedErrorOptions) {
    const label = details != null ? `${features}의 ${details}` : features
    const message = `${label} 기능이 구현되지 않았습니다. 기능을 구현해주세요`

    super(message)
    this.features = features
    this.details = details
  }
}
