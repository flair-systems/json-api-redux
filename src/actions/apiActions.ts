import { Action, ActionCreator } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { JSONAPIClient } from '../JSONAPIClient';
import { APIActionStatus, FailedResponse, IJSONAPIState, SuccessfulResponse } from '../types';

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
