import { Action } from 'redux';
import { ThunkMiddleware } from 'redux-thunk';

import * as constants from './actions/constants';
import { JSONAPIClient } from './JSONAPIClient';
import { APIError, APINetworkError } from './JSONAPIClient/errors';
import { PageableResponse } from './JSONAPIClient/PageableResponse';
import { IJSONAPIDocument, IJSONAPIResponse  } from './JSONAPIClient/types';

export type SuccessfulResponse<P> = IJSONAPIResponse<P> | PageableResponse<P>;
export type FailedResponse = APIError | APINetworkError;

interface IAPIAction<T> extends Action {
  resourceID?: string;
  resourceType: string;
  status: APIActionStatus;
  type: T,
}

export type APIActionStartStatus =
  APIActionStatus.READING |
  APIActionStatus.CREATING |
  APIActionStatus.UPDATING |
  APIActionStatus.DELETING;

export interface IStartAPIAction<T, P> extends IAPIAction<T> {
  payload?: IJSONAPIDocument<P>;
  status: APIActionStartStatus;
}

export interface ISucceededAPIAction<T, P> extends IAPIAction<T> {
  payload: SuccessfulResponse<P>;
  idMap: {[currentID: string]: string}
  status: APIActionStatus.SUCCEEDED;
}

export interface IFailedAPIAction<T> extends IAPIAction<T> {
  payload: FailedResponse;
  status: APIActionStatus.FAILED;
}

export type APIAction<T, P> = IStartAPIAction<T, P> | ISucceededAPIAction<T, P> | IFailedAPIAction<T>;

export type APIResourceAction<P> =
  APIAction<constants.LIST_JSONAPI_RESOURCE, P> |
  APIAction<constants.SHOW_JSONAPI_RESOURCE, P> |
  APIAction<constants.PAGE_JSONAPI_RESOURCE, P> |
  APIAction<constants.CREATE_JSONAPI_RESOURCE, P>;

export interface IJSONAPIStateResource<T> {
  error?: FailedResponse;
  resource?: Partial<IJSONAPIDocument<T>>;
  status: APIActionStatus;
}

export interface IJSONAPIState<T> {
  currentPaged?: PageableResponse<T>;
  error?: FailedResponse;
  resources: {
    [key: string]: IJSONAPIStateResource<T>;
  };
  status: APIActionStatus;
}

export enum APIActionStatus {
  INITIALIZED = 'INITIALIZED',
  CREATING = 'CREATING',
  UPDATING = 'UPDATING',
  DELETING = 'DELETING',
  READING = 'READING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export interface IGlobalState<P> {
  apiResources: {
    [key: string]: IJSONAPIState<P>;
  };
};

export type JSONAPIMiddleware<S extends IGlobalState<P>, P> =
  ThunkMiddleware<S, APIResourceAction<P>, Promise<JSONAPIClient>>;
