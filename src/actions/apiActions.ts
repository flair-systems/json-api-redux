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
} from '../types';

export type APIActionThunk<T, P> =
  ThunkAction<Promise<APIAction<T, P>>, IGlobalState<P>, Promise<JSONAPIClient>, APIAction<T, P>>;

const startAPIAction = <T, P>(
  type: T,
  status: APIActionStartStatus,
  resourceType: string,
  resourceID?: string,
  payload?: IJSONAPIDocument<P>,
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
  resourceType: string,
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

const failedAPIAction = <T>(
  type: T,
  resourceType: string,
  payload: FailedResponse,
  resourceID?: string,
): IFailedAPIAction<T> => {
  return {
    payload,
    resourceID,
    resourceType,
    status: APIActionStatus.FAILED,
    type,
  };
};

export type APIAsyncAction<P> = (
  client: JSONAPIClient,
  state: IGlobalState<P>,
  ...args: any[]
) => Promise<SuccessfulResponse<P>>;

export type PageLink = 'first' | 'last' | 'next' | 'prev';

export interface IAPIActionArgs<P> {
  id?: string;
  attributes?: P;
  relationships?: IJSONAPIRelationships;
  pageLink?: PageLink;
}

const toPayload = <P>(
  resourceType: string,
  { id, attributes, relationships }: IAPIActionArgs<P>,
): IJSONAPIDocument<P> | undefined => {
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
  resourceType: string,
  asyncMethod: APIAsyncAction<P>,
): ActionCreator<APIActionThunk<T, P>> => {
  return (args?: IAPIActionArgs<P>) => {
    return async (dispatch, getState, client: Promise<JSONAPIClient>) => {
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
          return dispatch(failedAPIAction<T>(type, resourceType, error, args.id));
        }
        return dispatch(failedAPIAction<T>(type, resourceType, error));
      }
    }
  }
};
