import { createHttpClient } from "./createHttpClient";
import { withQueryParams } from "@waylog/utility";

// 앱이 initializeClient()로 주입한다. 공유 패키지는 환경변수를 직접 읽지 않는다.
let serviceKey = "";

export function setGovernmentApiServiceKey(key: string) {
  serviceKey = key;
}

export const governmentApi = createHttpClient({
  baseUrl: "https://apis.data.go.kr",
  beforeRequest: (request) => {
    const url = withQueryParams(request.url, {
      ServiceKey: serviceKey,
      serviceKey: serviceKey,
    });
    return new Request(url, request);
  },
});

export type GovernmentApiSuccessCode = "00";
export type GovernmentApiResponse<Data, ErrorCode = string> = {
  response:
    | {
        header: { resultCode: ErrorCode; resultMsg: string };
        body: never;
      }
    | {
        header: { resultCode: GovernmentApiSuccessCode; resultMsg: never };
        body: Data;
      };
};
