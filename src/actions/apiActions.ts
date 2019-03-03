import { ActionCreator } from 'redux';
import { ThunkAction } from 'redux-thunk';

import * as constants from './constants';

import { JSONAPIClient } from '../JSONAPIClient';
import { IJSONAPIRelationships, IJSONAPIRequestDocument } from '../JSONAPIClient/types';

import {
  APIAction,
  APIActionStartStatus,
  APIActionStatus,
  FailedResponse,
  ICreateAPIAction,
  IFailedAPIAction,
  IGlobalState,
  IStartAPIAction,
  ISucceededAPIAction,
  SuccessfulResponse,
  ValueOf,
} from '../types';

export type APIActionThunk<T, P> =
  ThunkAction<Promise<APIAction<T, P>>, IGlobalState<P>, Promise<JSONAPIClient<P>>, APIAction<T, P>>;

const createAPIAction = <P> (
  resourceType: keyof P,
  resourceID: string,
  payload: IJSONAPIRequestDocument<keyof P, ValueOf<P>>,
): ICreateAPIAction<P> => {
  return {
    payload,
    resourceID,
    resourceType,
    status: APIActionStatus.CREATING,
    type: constants.CREATE_JSONAPI_RESOURCE,
  };
};

const startAPIAction = <T, P>(
  type: T,
  status: APIActionStartStatus,
  resourceType: keyof P,
  resourceID?: string,
  payload?: IJSONAPIRequestDocument<keyof P, ValueOf<P>>,
): IStartAPIAction<T, P> => {
  return {
    payload,
    resourceID,
    resourceType,
    status,
    type,
  };
};

const succeededAPIAction = <T, P>(
  type: T,
  resourceType: keyof P,
  payload: SuccessfulResponse<P>,
  oldID?: string,
): ISucceededAPIAction<T, P> => {
  let resourceID;
  const idMap = {};
  if (!Array.isArray(payload.data) && payload.data.id) {
    resourceID = payload.data.id;
    if (oldID) {
      idMap[resourceID] = oldID;
    }
  }
  return {
    idMap,
    payload,
    resourceID,
    resourceType,
    status: APIActionStatus.SUCCEEDED,
    type,
  };
};

const failedAPIAction = <T, P>(
  type: T,
  resourceType: keyof P,
  payload: FailedResponse,
  resourceID?: string,
): IFailedAPIAction<T, P> => {
  return {
    payload,
    resourceID,
    resourceType,
    status: APIActionStatus.FAILED,
    type,
  };
};

export type APIAsyncAction<P> = (
  client: JSONAPIClient<P>,
  state: IGlobalState<P>,
  ...args: any[]
) => Promise<SuccessfulResponse<P>>;

export type PageLink = 'first' | 'last' | 'next' | 'prev';

export interface IAPIActionArgs<P> {
  id: string;
  attributes: Partial<P>;
  relationships?: IJSONAPIRelationships;
}

export const createAction = <P>(
  resourceType: keyof P,
  asyncMethod: APIAsyncAction<P>,
): ActionCreator<APIActionThunk<constants.CREATE_JSONAPI_RESOURCE, P>> => {
  return (args: IAPIActionArgs<ValueOf<P>>) => {
    return async (dispatch, getState, client: Promise<JSONAPIClient<P>>) => {
      const { id, attributes, relationships = { } } = args
      dispatch(createAPIAction<P>(
        resourceType,
        args.id,
        {
          attributes,
          id,
          relationships: relationships || { },
          type: resourceType,
        },
      ));
      const type = constants.CREATE_JSONAPI_RESOURCE;
      try {
        const resolvedClient = await client;
        const response = await asyncMethod(resolvedClient, getState(), args);
        return dispatch(succeededAPIAction<constants.CREATE_JSONAPI_RESOURCE, P>(
          type,
          resourceType,
          response,
          args.id,
        ));
      } catch (error) {
        return dispatch(failedAPIAction<constants.CREATE_JSONAPI_RESOURCE, P>(
          type,
          resourceType,
          error,
          args.id,
        ));
      }
    }
  };
};

export const pageAction = <P> (
  resourceType: keyof P,
  asyncMethod: APIAsyncAction<P>,
): ActionCreator<APIActionThunk<constants.PAGE_JSONAPI_RESOURCE, P>> => {
  return (pageLink: PageLink) => {
    return async (dispatch, getState, client: Promise<JSONAPIClient<P>>) => {
      const type = constants.PAGE_JSONAPI_RESOURCE;
      dispatch(startAPIAction<constants.PAGE_JSONAPI_RESOURCE, P>(
        type,
        APIActionStatus.READING,
        resourceType,
      ));
      try {
        const resolvedClient = await client;
        const response = await asyncMethod(resolvedClient, getState(), pageLink);
        return dispatch(succeededAPIAction<constants.PAGE_JSONAPI_RESOURCE, P>(
          type,
          resourceType,
          response,
        ));
      } catch (error) {
        return dispatch(failedAPIAction<constants.PAGE_JSONAPI_RESOURCE, P>(
          type,
          resourceType,
          error,
        ));
      }
    }
  }
}

export const apiAction = <T, P>(
  type: T,
  startStatus: APIActionStartStatus,
  resourceType: keyof P,
  asyncMethod: APIAsyncAction<P>,
): ActionCreator<APIActionThunk<T, P>> => {
  return (id?: string) => {
    return async (dispatch, getState, client: Promise<JSONAPIClient<P>>) => {
      if (id) {
        dispatch(startAPIAction<T, P>(
          type,
          startStatus,
          resourceType,
          id,
          {
            id,
            type: resourceType,
          },
        ));
      } else {
        dispatch(startAPIAction<T, P>(
          type,
          startStatus,
          resourceType,
        ));
      }
      try {
        const resolvedClient = await client;
        const response = await asyncMethod(resolvedClient, getState(), id);
        if (id) {
          return dispatch(succeededAPIAction<T, P>(type, resourceType, response, id));
        } else {
          return dispatch(succeededAPIAction<T, P>(type, resourceType, response));
        }
      } catch (error) {
        if (id) {
          return dispatch(failedAPIAction<T, P>(type, resourceType, error, id));
        }
        return dispatch(failedAPIAction<T, P>(type, resourceType, error));
      }
    }
  }
};
