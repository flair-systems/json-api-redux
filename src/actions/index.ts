import { ActionCreator } from 'redux';

import {
  APICreateActionThunk,
  APIReadAction,
  APIReadActionThunk,
  createAPIAction,
  failedAPIAction,
  readApiAction,
  succeededAPIAction,
} from './apiActions';
import * as constants from './constants';

import { JSONAPIClient } from '../JSONAPIClient';
import { IJSONAPIRelationships } from '../JSONAPIClient/types';

export type APIAction<P> =
  APIReadAction<constants.LIST_JSONAPI_RESOURCE, P> |
  APIReadAction<constants.SHOW_JSONAPI_RESOURCE, P> |
  APIReadAction<constants.PAGE_JSONAPI_RESOURCE, P>;

export type ListAPIActionThunk<P> = APIReadActionThunk<constants.LIST_JSONAPI_RESOURCE, P>;

export const listAPIResource = <P>(resourceType: string): ActionCreator<ListAPIActionThunk<P>> => {
  return readApiAction<constants.LIST_JSONAPI_RESOURCE, P>(
    constants.LIST_JSONAPI_RESOURCE,
    (client, _) => client.list(resourceType),
  );
}

export type ShowAPIActionThunk<P> = APIReadActionThunk<constants.SHOW_JSONAPI_RESOURCE, P>;

export const showAPIResource = <P>(resourceType: string): ActionCreator<ShowAPIActionThunk<P>> => {
  return readApiAction<constants.SHOW_JSONAPI_RESOURCE, P>(
    constants.SHOW_JSONAPI_RESOURCE,
    (client, _, id: string) => client.show(resourceType, id),
  );
}

export type PageAPIResourceThunk<P> = APIReadActionThunk<constants.PAGE_JSONAPI_RESOURCE, P>;
export type PageLink = 'first' | 'last' | 'next' | 'prev';

export const pageAPIResource = <P>(resourceType: string): ActionCreator<PageAPIResourceThunk<P>> => {
  return readApiAction<constants.PAGE_JSONAPI_RESOURCE, P>(
    constants.PAGE_JSONAPI_RESOURCE,
    (_, state, pageLink: PageLink) => {
      const resource = state[resourceType] ? state[resourceType].currentPaged : null;
      if (!resource) {
        throw new Error('Resource does not exist.');
      }
      switch(pageLink) {
        case 'first':
          return resource.firstPage();
        case 'last':
          return resource.lastPage();
        case 'next':
          return resource.nextPage();
        case 'prev':
          return resource.prevPage();
      }
    },
  );
}

export const createAPIResource = <P>(type: string): ActionCreator<APICreateActionThunk<P>> => {
  return (attributes: P, relationships?: IJSONAPIRelationships, id?: string) => {
    return async (dispatch, _, client: JSONAPIClient) => {
      dispatch(createAPIAction({
        attributes,
        id,
        relationships: relationships ? relationships : {},
        type,
      }));
      try {
        const response = await client.create<P>(type, attributes, relationships, id);
        return dispatch(succeededAPIAction<constants.CREATE_JSONAPI_RESOURCE,P>(constants.CREATE_JSONAPI_RESOURCE, response));
      } catch (error) {
        return dispatch(failedAPIAction<constants.CREATE_JSONAPI_RESOURCE>(constants.CREATE_JSONAPI_RESOURCE, error));
      }
    }
  }
}

