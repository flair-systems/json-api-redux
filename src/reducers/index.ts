import {
  APIAction,
  APIActionStatus,
  APIResourceAction ,
  IJSONAPIState,
  IJSONAPIStateResource,
  ResourceMap,
  ValueOf,
} from '../types';

import * as constants from '../actions/constants';

import { IJSONAPIDocument } from '../JSONAPIClient/types';

export const initialState = <P>(): IJSONAPIState<keyof P, ValueOf<P>> => {
  return {
    resources: {},
    status: APIActionStatus.INITIALIZED,
  }
}

const updateResources = <P>(
  indexResources: {[key: string]: IJSONAPIStateResource<keyof P, ValueOf<P>>},
  newResource: IJSONAPIDocument<keyof P, ValueOf<P>>,
): {[key: string]: IJSONAPIStateResource<keyof P, ValueOf<P>>} => {
  if (newResource.id) {
    indexResources[newResource.id] = {
      resource: newResource,
      status: APIActionStatus.SUCCEEDED,
    };
  }
  return indexResources;
}

const reduceAPIShow = <P>(
  resource: IJSONAPIStateResource<keyof P, ValueOf<P>>,
  action: APIAction<constants.SHOW_JSONAPI_RESOURCE, P>,
): IJSONAPIStateResource<keyof P, ValueOf<P>> => {
  switch (action.status) {
    case APIActionStatus.READING:
      if (resource.status !== APIActionStatus.INITIALIZED && resource.resource.id) {
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
      const { data } = action.payload;
      if (Array.isArray(data)) {
        throw new Error('Something went wrong.');
      } else {
        return {
          resource: data,
          status: APIActionStatus.SUCCEEDED,
        }
      }
    case APIActionStatus.FAILED:
      return {
        ...resource,
        error: action.payload,
        status: APIActionStatus.FAILED,
      };
    default:
      return { ...resource };
  }
}

const reduceAPIList = <P>(
  resource: IJSONAPIState<keyof P, ValueOf<P>>,
  action: APIAction<constants.LIST_JSONAPI_RESOURCE, P> | APIAction<constants.PAGE_JSONAPI_RESOURCE, P>,
): IJSONAPIState<keyof P, ValueOf<P>> => {
  switch (action.status) {
    case APIActionStatus.READING:
      return { ...resource, status: APIActionStatus.READING };
    case APIActionStatus.SUCCEEDED:
      const { data } = action.payload;
      if (Array.isArray(data)) {
        return {
          pagingMeta: action.payload.meta,
          resources: data.reduce(updateResources, { ...resource.resources }),
          status: APIActionStatus.SUCCEEDED,
        };
      } else {
        return {
          pagingMeta: action.payload.meta,
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
  resource: IJSONAPIStateResource<keyof P, ValueOf<P>>,
  action: APIAction<constants.CREATE_JSONAPI_RESOURCE, P>,
): IJSONAPIStateResource<keyof P, ValueOf<P>> => {
  switch (action.status) {
    case APIActionStatus.CREATING:
      return {
        resource: action.payload,
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
        ...resource,
        error: action.payload,
        status: APIActionStatus.FAILED,
      };
    default:
      return { ...resource };
  }
}

const getResource = <P>(
  state: IJSONAPIState<keyof P, ValueOf<P>>,
  action: APIResourceAction<P>,
): IJSONAPIStateResource<keyof P, ValueOf<P>> => {
  if (action.resourceID && state.resources[action.resourceID]) {
    return { ...state.resources[action.resourceID] };
  }
  return {
    resource: {},
    status: APIActionStatus.INITIALIZED,
  };
}

export const reduceAPIResource = <P>(
  state: IJSONAPIState<keyof P, ValueOf<P>> = initialState<P>(),
  action: APIResourceAction<P>,
): IJSONAPIState<keyof P, ValueOf<P>> => {
  switch (action.type) {
    case constants.LIST_JSONAPI_RESOURCE:
      return reduceAPIList<P>(state, action);
    case constants.PAGE_JSONAPI_RESOURCE:
      return reduceAPIList<P>(state, action);
    case constants.SHOW_JSONAPI_RESOURCE:
      if (action.resourceID) {
        const newResource = { [action.resourceID]: reduceAPIShow<P>(getResource(state, action), action) }
        const resources = { ...state.resources, ...newResource }
        return {...state, resources}
      }
      return state;
    case constants.CREATE_JSONAPI_RESOURCE:
      if (action.resourceID) {
        const newResource = { [action.resourceID]: reduceAPICreate<P>(getResource(state, action), action) };
        const resources = { ...state.resources, ...newResource }
        if (action.status === APIActionStatus.SUCCEEDED && action.resourceID) {
          resources[action.idMap[action.resourceID]] = resources[action.resourceID];
        }
        return {...state, resources};
      }
      return {...state};
    default:
      return {...state};
  }
}

export const initAPIResources = <S>(...types: Array<keyof S>): ResourceMap<S> => {
  return types.reduce((obj, type) => {
    return {
      [type]: {
        resources: {},
        status: APIActionStatus.INITIALIZED,
      },
      ...obj,
    };
  }, {} as ResourceMap<S>);
};

export const apiResources = <S>(initState: ResourceMap<S>) => {
    return (
      state: ResourceMap<S> = initState,
      action: APIResourceAction<S>,
    ): ResourceMap<S> => {
      if (action && action.resourceType) {
        return Object.assign({}, state, {
          [action.resourceType]: reduceAPIResource<S>(state[action.resourceType], action),
        });
      }
      return {...state};
    }
}
