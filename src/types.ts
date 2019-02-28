import { Action } from 'redux';
import { ThunkMiddleware } from 'redux-thunk';

import * as constants from './actions/constants';
import { JSONAPIClient } from './JSONAPIClient';
import { APIError, APINetworkError } from './JSONAPIClient/errors';
import { PageableResponse } from './JSONAPIClient/PageableResponse';
import { IJSONAPIDocument, IJSONAPIResponse  } from './JSONAPIClient/types';

export type SuccessfulResponse<P> =
  IJSONAPIResponse<keyof P, ValueOf<P>> |
  PageableResponse<keyof P, ValueOf<P>>;
export type FailedResponse = APIError | APINetworkError;

interface IAPIAction<T, P> extends Action {
  resourceID?: string;
  resourceType: keyof P;
  status: APIActionStatus;
  type: T,
}

export type APIActionStartStatus =
  APIActionStatus.READING |
  APIActionStatus.CREATING |
  APIActionStatus.UPDATING |
  APIActionStatus.DELETING;

export interface IStartAPIAction<T, P> extends IAPIAction<T, P> {
  payload?: IJSONAPIDocument<keyof P, ValueOf<P>>;
  status: APIActionStartStatus;
}

export interface ISucceededAPIAction<T, P> extends IAPIAction<T, P> {
  payload: SuccessfulResponse<P>;
  idMap: {[currentID: string]: string}
  status: APIActionStatus.SUCCEEDED;
}

export interface IFailedAPIAction<T, P> extends IAPIAction<T, P> {
  payload: FailedResponse;
  status: APIActionStatus.FAILED;
}

export type APIAction<T, P> = IStartAPIAction<T, P> | ISucceededAPIAction<T, P> | IFailedAPIAction<T, P>;

export type APIResourceAction<P> =
  APIAction<constants.LIST_JSONAPI_RESOURCE, P> |
  APIAction<constants.SHOW_JSONAPI_RESOURCE, P> |
  APIAction<constants.PAGE_JSONAPI_RESOURCE, P> |
  APIAction<constants.CREATE_JSONAPI_RESOURCE, P>;

export interface IJSONAPIStateResource<T> {
  error?: FailedResponse;
  resource?: Partial<IJSONAPIDocument<keyof T, ValueOf<T>>>;
  status: APIActionStatus;
}

export interface IJSONAPIState<T> {
  currentPaged?: PageableResponse<keyof T, ValueOf<T>>;
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

export type ValueOf<T> = T[keyof T];

export type ResourceMap<S> = {[P in keyof S]: IJSONAPIState<S>};

export interface IGlobalState<S> {
  apiResources: ResourceMap<S>;
};

export type JSONAPIMiddleware<S extends IGlobalState<P>, P> =
  ThunkMiddleware<S, APIResourceAction<P>, Promise<JSONAPIClient<P>>>;
