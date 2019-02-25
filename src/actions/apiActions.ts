import { Action, ActionCreator } from 'redux';
import { ThunkAction } from 'redux-thunk';

import * as constants from './constants';

import { JSONAPIClient } from '../JSONAPIClient';
import { IJSONAPIDocument } from '../JSONAPIClient/types';
import { APIActionStatus, FailedResponse, IJSONAPIState, SuccessfulResponse } from '../types';

export interface IReadAPIAction<T> extends Action {
  type: T;
  status: APIActionStatus.READING;
}

export interface ICreateAPIAction<P> extends Action {
  type: constants.CREATE_JSONAPI_RESOURCE;
  status: APIActionStatus.CREATING;
  payload: IJSONAPIDocument<P>;
}

export interface ISucceededAPIAction<T, P> extends Action {
  payload: SuccessfulResponse<P>
  type: T;
  status: APIActionStatus.SUCCEEDED;
}

export interface IFailedAPIAction<T> extends Action {
  payload: FailedResponse;
  type: T;
  status: APIActionStatus.FAILED;
}

export interface IGlobalState<P> {
  [key: string]: IJSONAPIState<P>;
};

export type APIReadAction<T, P> = IReadAPIAction<T> | ISucceededAPIAction<T, P> | IFailedAPIAction<T>;
export type APICreateAction<P> =
  ICreateAPIAction<P> |
  ISucceededAPIAction<constants.CREATE_JSONAPI_RESOURCE, P> |
  IFailedAPIAction<constants.CREATE_JSONAPI_RESOURCE>;

export type APIReadActionThunk<T, P> = ThunkAction<Promise<APIReadAction<T, P>>, IGlobalState<P>, JSONAPIClient, APIReadAction<T, P>>;
export type APICreateActionThunk<P> = ThunkAction<Promise<APICreateAction<P>>, IGlobalState<P>, JSONAPIClient, APICreateAction<P>>;

const readAPIAction = <T>(type: T): IReadAPIAction<T> => {
  return {
    status: APIActionStatus.READING,
    type,
  };
};

export const createAPIAction = <P>(payload: IJSONAPIDocument<P>): ICreateAPIAction<P> => {
  return {
    payload,
    status: APIActionStatus.CREATING,
    type: constants.CREATE_JSONAPI_RESOURCE,
  }
}

export const succeededAPIAction = <T, P>(type: T, payload: SuccessfulResponse<P>): ISucceededAPIAction<T, P> => {
  return {
    payload,
    status: APIActionStatus.SUCCEEDED,
    type,
  };
};

export const failedAPIAction = <T>(type: T, payload: FailedResponse): IFailedAPIAction<T> => {
  return {
    payload,
    status: APIActionStatus.FAILED,
    type,
  };
};

export const readApiAction = <T, P>(
  type: T,
  asyncMethod: (client: JSONAPIClient, state: IGlobalState<P>, ...args: any[]) => Promise<SuccessfulResponse<P>>,
): ActionCreator<APIReadActionThunk<T, P>> => {
  return (...args: any[]) => {
    return async (dispatch, getState, client: JSONAPIClient) => {
      dispatch(readAPIAction<T>(type));
      try {
        const response = await asyncMethod(client, getState(), ...args);
        return dispatch(succeededAPIAction<T, P>(type, response));
      } catch (error) {
        return dispatch(failedAPIAction<T>(type, error));
      }
    }
  }
};
