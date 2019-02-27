import thunk from 'redux-thunk';

import * as actions from './actions';
import fetchAPIRootAndInitClient from './JSONAPIClient';
import { fetch as defaultFetch } from './JSONAPIClient/fetch';
import { IGlobalState, JSONAPIMiddleware } from './types';

export const jsonapiResourceActionSet = <P>(
  resourceType: string,
) => {
  return {
    create: actions.createAPIResource<P>(resourceType),
    list: actions.listAPIResource<P>(resourceType),
    page: actions.pageAPIResource<P>(resourceType),
    show: actions.showAPIResource<P>(resourceType),
  };
};

export const jsonapi = <S extends IGlobalState<P>, P>(
  apiRoot: string,
  apiPrefix?: string,
  fetch = defaultFetch,
  defaultHeaders = {},
  defaultFetchArgs = {},
): JSONAPIMiddleware<S, P> => {
  const client = fetchAPIRootAndInitClient(apiRoot, apiPrefix, fetch, defaultHeaders, defaultFetchArgs);
  return thunk.withExtraArgument(client)
}

export { apiResources } from './reducers';