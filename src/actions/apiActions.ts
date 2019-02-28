import { ActionCreator } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { JSONAPIClient } from '../JSONAPIClient';
import { IJSONAPIDocument, IJSONAPIRelationships } from '../JSONAPIClient/types';
import {
  APIAction,
  APIActionStartStatus,
  APIActionStatus,
  FailedResponse,
  IFailedAPIAction,
  IGlobalState,
  IStartAPIAction,
  ISucceededAPIAction,
  SuccessfulResponse,
  ValueOf,
} from '../types';

export type APIActionThunk<T, P> =
  ThunkAction<Promise<APIAction<T, P>>, IGlobalState<P>, Promise<JSONAPIClient<P>>, APIAction<T, P>>;

const startAPIAction = <T, P>(
  type: T,
  status: APIActionStartStatus,
  resourceType: keyof P,
  resourceID?: string,
  payload?: IJSONAPIDocument<keyof P, ValueOf<P>>,
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
  payload: SuccessfulResponse<ValueOf<P>>,
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
) => Promise<SuccessfulResponse<ValueOf<P>>>;

export type PageLink = 'first' | 'last' | 'next' | 'prev';

export interface IAPIActionArgs<P> {
  id?: string;
  attributes?: P;
  relationships?: IJSONAPIRelationships;
  pageLink?: PageLink;
}

const toPayload = <P>(
  resourceType: keyof P,
  { id, attributes, relationships }: IAPIActionArgs<ValueOf<P>>,
): IJSONAPIDocument<keyof P, ValueOf<P>> | undefined => {
  if (attributes) {
    return {
      attributes,
      id,
      relationships: relationships || { },
      type: resourceType,
    };
  }
  return undefined;
}

export const apiAction = <T, P>(
  type: T,
  startStatus: APIActionStartStatus,
  resourceType: keyof P,
  asyncMethod: APIAsyncAction<P>,
): ActionCreator<APIActionThunk<T, P>> => {
  return (args?: IAPIActionArgs<ValueOf<P>>) => {
    return async (dispatch, getState, client: Promise<JSONAPIClient<P>>) => {
      if (args) {
        dispatch(startAPIAction<T, P>(
          type,
          startStatus,
          resourceType,
          args.id,
          toPayload(resourceType, args),
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
        const response = await asyncMethod(resolvedClient, getState(), args);
        if (args && args.id) {
          return dispatch(succeededAPIAction<T, P>(type, resourceType, response, args.id));
        } else {
          return dispatch(succeededAPIAction<T, P>(type, resourceType, response));
        }
      } catch (error) {
        if (args && args.id) {
          return dispatch(failedAPIAction<T, P>(type, resourceType, error, args.id));
        }
        return dispatch(failedAPIAction<T, P>(type, resourceType, error));
      }
    }
  }
};
