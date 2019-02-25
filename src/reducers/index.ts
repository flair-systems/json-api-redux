import { APIActionStatus, IJSONAPIState, IJSONAPIStateResource } from '../types';

import { APIAction } from '../actions';
import * as constants from '../actions/constants';

import { IJSONAPIDocument } from '../JSONAPIClient/types';

export const initialState = <P>(): IJSONAPIState<P> => {
  return {
    resources: {},
    status: APIActionStatus.INITIALIZED,
  }
}

const updateResources = <P>(
  indexResources: {[key: string]: IJSONAPIStateResource<P>},
  newResource: IJSONAPIDocument<P>,
) => {
  if (newResource.id) {
    indexResources[newResource.id] = {
      resource: newResource,
      status: APIActionStatus.SUCCEEDED,
    };
  }
  return indexResources;
}

const reduceAPIShow = <P>(resource: IJSONAPIState<P>, action: APIAction<P>) => {
  switch (action.status) {
    case APIActionStatus.READING:
      return { status: APIActionStatus.READING, ...resource };
    case APIActionStatus.SUCCEEDED:
      const { data } = action.payload;
      if (Array.isArray(data)) {
        const resources = data.reduce(updateResources, { ...resource.resources });
        return {
          resources,
          status: APIActionStatus.SUCCEEDED,
        };
      } else {
        return {
          resources: updateResources({ ...resource.resources }, data),
          status: APIActionStatus.SUCCEEDED,
        }
      }
    case APIActionStatus.FAILED:
      return { error: action.payload, status: APIActionStatus.FAILED, ...resource }
    default: return { ...resource };
  }
}

const reduceAPIList = <P>(resource: IJSONAPIState<P>, action: APIAction<P>) => {
  switch (action.status) {
    case APIActionStatus.READING:
      return { ...resource, status: APIActionStatus.READING };
    case APIActionStatus.SUCCEEDED:
      const { data } = action.payload;
      if (Array.isArray(data)) {
        const resources = data.reduce(updateResources, { ...resource.resources });
        return {
          currentPaged: action.payload,
          resources,
          status: APIActionStatus.SUCCEEDED,
        };
      } else {
        return {
          currentPaged: action.payload,
          resources: updateResources({ ...resource.resources }, data),
          status: APIActionStatus.SUCCEEDED,
        }
      }
    case APIActionStatus.FAILED:
      return { ...resource, error: action.payload, status: APIActionStatus.FAILED }
    default: return { ...resource };
  }
}

export const reduceAPIResource = <P>(
  state: IJSONAPIState<P> = initialState<P>(),
  action: APIAction<P>,
) => {
  switch (action.type) {
    case constants.LIST_JSONAPI_RESOURCE:
      return reduceAPIList<P>(state, action);
    case constants.SHOW_JSONAPI_RESOURCE:
      return reduceAPIShow<P>(state, action);
    case constants.PAGE_JSONAPI_RESOURCE:
      return reduceAPIList<P>(state, action);
    default:
      return state;
  }
}
