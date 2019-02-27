import { ActionCreator } from 'redux';

import {
  apiAction,
  APIActionThunk,
} from './apiActions';
import * as constants from './constants';

import { APIActionStatus } from '../types';

export type ListAPIActionThunk<P> = APIActionThunk<constants.LIST_JSONAPI_RESOURCE, P>;

export const listAPIResource = <P>(resourceType: string): ActionCreator<ListAPIActionThunk<P>> => {
  return apiAction<constants.LIST_JSONAPI_RESOURCE, P>(
    constants.LIST_JSONAPI_RESOURCE,
    APIActionStatus.READING,
    resourceType,
    (client, _) => client.list<P>(resourceType),
  );
}

export type ShowAPIActionThunk<P> = APIActionThunk<constants.SHOW_JSONAPI_RESOURCE, P>;

export const showAPIResource = <P>(resourceType: string): ActionCreator<ShowAPIActionThunk<P>> => {
  return apiAction<constants.SHOW_JSONAPI_RESOURCE, P>(
    constants.SHOW_JSONAPI_RESOURCE,
    APIActionStatus.READING,
    resourceType,
    (client, _, { id }) => client.show<P>(resourceType, id),
  );
}

export type PageAPIResourceThunk<P> = APIActionThunk<constants.PAGE_JSONAPI_RESOURCE, P>;

export const pageAPIResource = <P>(resourceType: string): ActionCreator<PageAPIResourceThunk<P>> => {
  return apiAction<constants.PAGE_JSONAPI_RESOURCE, P>(
    constants.PAGE_JSONAPI_RESOURCE,
    APIActionStatus.READING,
    resourceType,
    (_, state, { pageLink }) => {
      const resource = state.apiResources[resourceType] ?
        state.apiResources[resourceType].currentPaged : null;
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
        default:
          throw new Error('No or non-existant PageLink supplied.');
      }
    },
  );
}

export type CreateAPIResourceThunk<P> = APIActionThunk<constants.CREATE_JSONAPI_RESOURCE, P>;

export const createAPIResource = <P>(resourceType: string): ActionCreator<CreateAPIResourceThunk<P>> => {
  return apiAction<constants.CREATE_JSONAPI_RESOURCE, P>(
    constants.CREATE_JSONAPI_RESOURCE,
    APIActionStatus.CREATING,
    resourceType,
    (client, _, { id, attributes, relationships }) => client.create<P>(
      resourceType, attributes, relationships, id,
    ),
  );
}
