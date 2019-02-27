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

const fetchAPIRootAndInitClient = async (
  apiRootURL: string,
  apiPrefix?: string,
  fetch = defaultFetch,
  defaultHeaders = {},
  defaultFetchArgs = {},
): Promise<JSONAPIClient> => {
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
  const apiRoot = (await rootResponse.json()) as IAPIRoot;
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
