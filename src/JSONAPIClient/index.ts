import { fetch as defaultFetch, Headers } from './fetch'

import { APIRootFailure } from './errors';
import { JSONAPIClient } from './JSONAPIClient';
import { IAPIRoot } from './types';

const determinePrefix = (rootURL: string, apiPrefix?: string) => {
  if (apiPrefix) {
    return apiPrefix;
  }
  const url = new URL(rootURL);

  return `${url.protocol}//${url.host}`;
}

const fetchAPIRootAndInitClient = async <R>(
  apiRootURL: string,
  apiPrefix?: string,
  fetch: (url: RequestInfo, init?: RequestInit) => Promise<Response> = defaultFetch,
  defaultHeaders = {},
  defaultFetchArgs = {},
): Promise<JSONAPIClient<R>> => {
  const headers = new Headers({
    'Accept': 'application/json',
    ...defaultHeaders,
  });

  const rootResponse = await fetch(apiRootURL, {
    headers,
    ...defaultFetchArgs,
  });

  if (!rootResponse.ok) {
    throw new APIRootFailure(apiRootURL, rootResponse);
  }
  const apiRoot = (await rootResponse.json()) as IAPIRoot<R>;
  return new JSONAPIClient(
    apiRoot,
    fetch,
    determinePrefix(apiRootURL, apiPrefix),
    defaultHeaders,
    defaultFetchArgs,
  );
}

export { JSONAPIClient };
export default fetchAPIRootAndInitClient;
