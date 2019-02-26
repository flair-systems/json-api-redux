import {
  APIActionStatus,
  IJSONAPIState,
  IJSONAPIStateResource,
  SuccessfulResponse,
} from '../types';

import { APIResourceAction } from '../actions';
import { APIAction } from '../actions/apiActions';
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

const reduceAPIShow = <P>(
  resource: IJSONAPIStateResource<P>,
  action: APIAction<constants.SHOW_JSONAPI_RESOURCE, P>,
): IJSONAPIStateResource<P> => {
  switch (action.status) {
    case APIActionStatus.READING:
      if (resource) {
        return { status: APIActionStatus.READING, ...resource };
      }
      return {
        resource: {
          id: action.resourceID,
          type: action.resourceType,
        },
        status: APIActionStatus.READING,
      };
    case APIActionStatus.SUCCEEDED:
      const { data } = (action.payload as SuccessfulResponse<P>);
      if (Array.isArray(data)) {
        throw new Error('Something went wrong.');
      } else {
        return {
          resource: data,
          status: APIActionStatus.SUCCEEDED,
        }
      }
    case APIActionStatus.FAILED:
      return { error: action.payload, status: APIActionStatus.FAILED, ...resource }
    default:
      return { ...resource };
  }
}

const reduceAPIList = <P>(
  resource: IJSONAPIState<P>,
  action: APIAction<constants.LIST_JSONAPI_RESOURCE, P> | APIAction<constants.PAGE_JSONAPI_RESOURCE, P>,
) => {
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

const reduceAPICreate = <P>(
  resource: IJSONAPIStateResource<P>,
  action: APIAction<constants.CREATE_JSONAPI_RESOURCE, P>,
) => {
  switch (action.status) {
    case APIActionStatus.CREATING:
      return {
        resource: {
          id: action.resourceID,
          type: action.resourceType,
        },
        status: APIActionStatus.CREATING,
      };
    case APIActionStatus.SUCCEEDED:
      const { data } = action.payload;
      if (Array.isArray(data)) {
        throw new Error('Something went wrong.');
      } else {
        return {
          resource: data,
          status: APIActionStatus.SUCCEEDED,
        };
      }
    case APIActionStatus.FAILED:
      return {
        error: action.payload,
        status: APIActionStatus.FAILED,
      };
    default:
      return { ...resource };
  }
}

const getResource = <P>(state: IJSONAPIState<P>, action: APIResourceAction<P>) => {
  if (action.resourceID) {
    return { ...state.resources[action.resourceID] };
  }
  return { status: APIActionStatus.INITIALIZED };
}

export const reduceAPIResource = <P>(
  state: IJSONAPIState<P> = initialState<P>(),
  action: APIResourceAction<P>,
) => {
  switch (action.type) {
    case constants.LIST_JSONAPI_RESOURCE:
      return reduceAPIList<P>(state, action);
    case constants.SHOW_JSONAPI_RESOURCE:
      if (action.resourceID) {
        return state.resources[action.resourceID] = reduceAPIShow<P>(getResource(state, action), action);
      }
      return state;
    case constants.PAGE_JSONAPI_RESOURCE:
      return reduceAPIList<P>(state, action);
    case constants.CREATE_JSONAPI_RESOURCE:
      if (action.resourceID) {
        return state.resources[action.resourceID] = reduceAPICreate<P>(getResource(state, action), action);
      }
      return state;
    default:
      return state;
  }
}
