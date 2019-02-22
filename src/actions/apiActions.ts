import { Action, ActionCreator } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { JSONAPIClient } from '../JSONAPIClient';
import { APIActionStatus, FailedResponse, IJSONAPIState, SuccessfulResponse } from '../types';

export interface IReadAPIAction<T> extends Action {
  type: T;
  status: APIActionStatus.READING;
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

export type APIReadAction<T, P> = IReadAPIAction<T> | ISucceededAPIAction<T, P> | IFailedAPIAction<T>;

export type APIReadActionThunk<T, P> = ThunkAction<Promise<APIReadAction<T, P>>, IJSONAPIState<P>, JSONAPIClient, APIReadAction<T, P>>;

const readAPIAction = <T>(type: T): IReadAPIAction<T> => {
  return {
    status: APIActionStatus.READING,
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

export const readApiAction = <T, P>(
  type: T,
  asyncMethod: (client: JSONAPIClient, state: IJSONAPIState<P>, ...args: any[]) => Promise<SuccessfulResponse<P>>,
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
