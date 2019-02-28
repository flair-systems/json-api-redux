import {
  apiAction,
  APIActionThunk,
  IAPIActionArgs,
} from './apiActions';
import * as constants from './constants';

import { APIActionStatus, ValueOf } from '../types';

type APIActionCreator<P, A> = (args?: IAPIActionArgs<ValueOf<P>>) => A

export type ListAPIActionThunk<P> = APIActionThunk<constants.LIST_JSONAPI_RESOURCE, P>;

export const listAPIResource = <P>(resourceType: keyof P): APIActionCreator<P, ListAPIActionThunk<P>> => {
  return apiAction<constants.LIST_JSONAPI_RESOURCE, P>(
    constants.LIST_JSONAPI_RESOURCE,
    APIActionStatus.READING,
    resourceType,
    (client, _) => client.list<ValueOf<P>>(resourceType),
  );
}

export type ShowAPIActionThunk<P> = APIActionThunk<constants.SHOW_JSONAPI_RESOURCE, P>;

export const showAPIResource = <P>(resourceType: keyof P): APIActionCreator<P, ShowAPIActionThunk<P>> => {
  return apiAction<constants.SHOW_JSONAPI_RESOURCE, P>(
    constants.SHOW_JSONAPI_RESOURCE,
    APIActionStatus.READING,
    resourceType,
    (client, _, { id }) => client.show<ValueOf<P>>(resourceType, id),
  );
}

export type PageAPIResourceThunk<P> = APIActionThunk<constants.PAGE_JSONAPI_RESOURCE, P>;

export const pageAPIResource = <P>(resourceType: keyof P): APIActionCreator<P, PageAPIResourceThunk<P>> => {
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

export const createAPIResource = <P>(resourceType: keyof P): APIActionCreator<P, CreateAPIResourceThunk<P>> => {
  return apiAction<constants.CREATE_JSONAPI_RESOURCE, P>(
    constants.CREATE_JSONAPI_RESOURCE,
    APIActionStatus.CREATING,
    resourceType,
    (client, _, { id, attributes, relationships }) => client.create<ValueOf<P>>(
      resourceType, attributes, relationships, id,
    ),
  );
}
