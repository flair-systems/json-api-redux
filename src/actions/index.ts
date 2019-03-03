import {
  apiAction,
  APIActionThunk,
  createAction,
  IAPIActionArgs,
  pageAction,
  PageLink,
} from './apiActions';
import * as constants from './constants';

import { APIActionStatus, ValueOf } from '../types';

type ReadActionCreator<A> = (id?: string) => A
type PageActionCreator<A> = (pageLink: PageLink) => A
type CreateActionCreator<P, A> = (args?: IAPIActionArgs<ValueOf<P>>) => A

export type ListAPIActionThunk<P> = APIActionThunk<constants.LIST_JSONAPI_RESOURCE, P>;

export const listAPIResource = <P>(resourceType: keyof P): ReadActionCreator<ListAPIActionThunk<P>> => {
  return apiAction<constants.LIST_JSONAPI_RESOURCE, P>(
    constants.LIST_JSONAPI_RESOURCE,
    APIActionStatus.READING,
    resourceType,
    (client, _) => client.list<ValueOf<P>>(resourceType),
  );
}

export type ShowAPIActionThunk<P> = APIActionThunk<constants.SHOW_JSONAPI_RESOURCE, P>;

export const showAPIResource = <P>(resourceType: keyof P): ReadActionCreator<ShowAPIActionThunk<P>> => {
  return apiAction<constants.SHOW_JSONAPI_RESOURCE, P>(
    constants.SHOW_JSONAPI_RESOURCE,
    APIActionStatus.READING,
    resourceType,
    (client, _, id) => client.show<ValueOf<P>>(resourceType, id),
  );
}

export type PageAPIResourceThunk<P> = APIActionThunk<constants.PAGE_JSONAPI_RESOURCE, P>;

export const pageAPIResource = <P>(resourceType: keyof P): PageActionCreator<PageAPIResourceThunk<P>> => {
  return pageAction<P>(
    resourceType,
    (client, state, pageLink) => {
      const resource = state.apiResources[resourceType] ?
        state.apiResources[resourceType].pagingMeta: null;
      if (!resource) {
        throw new Error('Resource does not exist.');
      }
      switch(pageLink) {
        case 'first':
          return client.firstPage(resource);
        case 'last':
          return client.lastPage(resource);
        case 'next':
          return client.nextPage(resource);
        case 'prev':
          return client.prevPage(resource);
        default:
          throw new Error('No or non-existant PageLink supplied.');
      }
    },
  );
}

export type CreateAPIResourceThunk<P> = APIActionThunk<constants.CREATE_JSONAPI_RESOURCE, P>;

export const createAPIResource = <P>(resourceType: keyof P): CreateActionCreator<P, CreateAPIResourceThunk<P>> => {
  return createAction<P>(
    resourceType,
    (client, _, { id, attributes, relationships }) => client.create<ValueOf<P>>(
      resourceType, attributes, relationships, id,
    ),
  );
}
