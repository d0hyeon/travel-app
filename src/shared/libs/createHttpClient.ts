import { withQueryParams } from "~shared/utils/urls";

interface Options {  
  baseUrl?: string;
  beforeRequest?: (request: Request) => Request;
}

type RequestOptions<Data = any> = Omit<RequestInit, 'headers' | 'signal' | 'body'> & {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  signal?: AbortSignal;
  parse?: (response: Response) => Promise<Data>;
  body?: any;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export function createHttpClient({ baseUrl = '', beforeRequest }: Options = {}) {
  function createRequestFn<Method extends HttpMethod , Data>(method: Method) {
    return async (
      path: string,
      requestOptions?: Method extends 'GET'
        ? (RequestOptions<Data> & { body: never })
        : RequestOptions<Data>
    ) => {
      const { params, body, parse = parseResponse } = requestOptions ?? {}
      const url = withQueryParams(`${baseUrl}${path}`, params);
      const request = new Request(url, {
        body: serializeBody(body),
        ...requestOptions,
      });
      const response = await fetch(
        beforeRequest ? beforeRequest(request) : request,
      );
      
      if (!response.ok) {
        const error = await response.clone().json();
        throw error;
      }
      
      return await parse(response);
    }
  }

  return {
    get: createRequestFn('GET'),
    post: createRequestFn('POST'),
    put: createRequestFn('PUT'),
    patch: createRequestFn('PATCH'),
    delete: createRequestFn('DELETE'),
  }
}


async function parseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return await response.json();
  } 
  
  if (contentType.includes('text/')) {
    return await response.text();
  } 
  
  if (
    contentType.includes('image/') || 
    contentType.includes('application/octet-stream') ||
    contentType.includes('application/pdf')
  ) {
    return await response.blob(); 
  }

  return null; 
}

const serializeBody = (body: unknown): BodyInit | null | undefined => {
  if (body == null) return body as null | undefined;
  
  // fetch가 그대로 수용할 수 있는 객체들인 경우
  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    typeof body === 'string'
  ) {
    return body as BodyInit;
  }
  
  // 일반 객체나 배열은 JSON으로 변환
  return JSON.stringify(body);
};