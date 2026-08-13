import { GOVERNMENT_API_SERVICE_KEY } from "~app/env";
import { createHttpClient } from "~shared/libs/createHttpClient";
import { withQueryParams } from "~shared/utils/urls";

export const governmentApi = createHttpClient({
  baseUrl: "https://apis.data.go.kr",
  beforeRequest: (request) => {
    const url = withQueryParams(request.url, {
      ServiceKey: GOVERNMENT_API_SERVICE_KEY,
      serviceKey: GOVERNMENT_API_SERVICE_KEY,
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
