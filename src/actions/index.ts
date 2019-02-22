import { ActionCreator } from 'redux';

import { PageableResponse } from '../JSONAPIClient/PageableResponse';

import { apiAction, APIActionThunk } from './apiActions';
import * as constants from './constants';

export type ListAPIActionThunk<P> = APIActionThunk<constants.LIST_JSONAPI_RESOURCE, P>;

export const listAPIResource = <P>(resourceType: string): ActionCreator<ListAPIActionThunk<P>> => {
  return apiAction<constants.LIST_JSONAPI_RESOURCE, P>(
    constants.LIST_JSONAPI_RESOURCE,
    (client, _) => client.list<P>(resourceType),
  );
}

export type ShowAPIActionThunk<P> = APIActionThunk<constants.SHOW_JSONAPI_RESOURCE, P>;

export const showAPIResource = <P>(resourceType: string): ActionCreator<ShowAPIActionThunk<P>> => {
  return apiAction<constants.SHOW_JSONAPI_RESOURCE, P>(
    constants.SHOW_JSONAPI_RESOURCE,
    (client, _, id: string) => client.show<P>(resourceType, id),
  );
}

export type PageAPIResourceThunk<P> = APIActionThunk<constants.PAGE_JSONAPI_RESOURCE, P>;
export type PageLink = 'first' | 'last' | 'next' | 'prev';

export const pageAPIResource = <P>(resourceType: string): ActionCreator<PageAPIResourceThunk<P>> => {
  return apiAction<constants.PAGE_JSONAPI_RESOURCE, P>(
    constants.PAGE_JSONAPI_RESOURCE,
    (_, state, pageLink: PageLink) => {
      const resource = state.apiResources(resourceType).currentPaged as PageableResponse<P>;
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
