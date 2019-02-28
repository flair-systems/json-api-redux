import thunk from 'redux-thunk';

import * as actions from './actions';
import fetchAPIRootAndInitClient from './JSONAPIClient';
import { fetch as defaultFetch } from './JSONAPIClient/fetch';
import { IGlobalState, JSONAPIMiddleware } from './types';

export const jsonAPIResourceActionSet = <P>(
  resourceType: keyof P,
) => {
  return {
    create: actions.createAPIResource<P>(resourceType),
    list: actions.listAPIResource<P>(resourceType),
    page: actions.pageAPIResource<P>(resourceType),
    show: actions.showAPIResource<P>(resourceType),
  };
};

export const jsonAPI = <S extends IGlobalState<P>, P>(
  apiRoot: string,
  apiPrefix?: string,
  fetch: (url: RequestInfo, init?: RequestInit) => Promise<Response> = defaultFetch,
  defaultHeaders = {},
  defaultFetchArgs = {},
): JSONAPIMiddleware<S, P> => {
  const client = fetchAPIRootAndInitClient<P>(apiRoot, apiPrefix, fetch, defaultHeaders, defaultFetchArgs);
  return thunk.withExtraArgument(client)
}

export { apiResources, initAPIResources } from './reducers';

export { APIActionStatus, IGlobalState, IJSONAPIState, IJSONAPIStateResource } from './types';
