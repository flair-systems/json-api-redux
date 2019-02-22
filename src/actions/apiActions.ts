import { Action, ActionCreator } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { JSONAPIClient } from '../JSONAPIClient';
import { APIError, APINetworkError } from '../JSONAPIClient/errors';
import { PageableResponse } from '../JSONAPIClient/PageableResponse';
import { IJSONAPIDocument, IJSONAPIResponse } from '../JSONAPIClient/types';

export interface IJSONAPIStateResource<T> {
  currentPaged?: PageableResponse<T>;
  loading: boolean;
  error?: FailedResponse;
  resources: {
    [key: string]: {
      loading: boolean;
      error?: FailedResponse;
      resource: IJSONAPIDocument<T>;
    };
  };
}

export interface IJSONAPIState {
  apiResources: <T>(resourceType: string) => IJSONAPIStateResource<T>;
}

export enum APIActionStatus {
  INITIALIZED = 'INITIALIZED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export type SuccessfulResponse<P> = IJSONAPIResponse<P> | PageableResponse<P>;
export type FailedResponse = APIError | APINetworkError;

export interface IStartedAPIAction<T> extends Action {
  type: T;
  status: APIActionStatus.IN_PROGRESS;
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

export type APIAction<T, P> = IStartedAPIAction<T> | ISucceededAPIAction<T, P> | IFailedAPIAction<T>;

export type APIActionThunk<T, P> = ThunkAction<Promise<APIAction<T, P>>, IJSONAPIState, JSONAPIClient, APIAction<T, P>>;

const startedAPIAction = <T>(type: T): IStartedAPIAction<T> => {
  return {
    status: APIActionStatus.IN_PROGRESS,
    type,
  };
};

const succeededAPIAction = <T, P>(type: T, payload: SuccessfulResponse<P>): ISucceededAPIAction<T, P> => {
  return {
    payload,
    status: APIActionStatus.SUCCEEDED,
    type,
  };
};

const failedAPIAction = <T>(type: T, payload: FailedResponse): IFailedAPIAction<T> => {
  return {
    payload,
    status: APIActionStatus.FAILED,
    type,
  };
};

export const apiAction = <T, P>(
  type: T,
  asyncMethod: (client: JSONAPIClient, state: IJSONAPIState, ...args: any[]) => Promise<SuccessfulResponse<P>>,
): ActionCreator<APIActionThunk<T, P>> => {
  return (...args: any[]) => {
    return async (dispatch, getState, client: JSONAPIClient) => {
      dispatch(startedAPIAction<T>(type));
      try {
        const response = await asyncMethod(client, getState(), ...args);
        return dispatch(succeededAPIAction<T, P>(type, response));
      } catch (error) {
        return dispatch(failedAPIAction<T>(type, error));
      }
    }
  }
};
