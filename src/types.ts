import { Action, ActionCreator } from 'redux';
import { ThunkAction, ThunkMiddleware } from 'redux-thunk';

import * as constants from './actions/constants';
import { JSONAPIClient } from './JSONAPIClient';
import { APIError, APINetworkError } from './JSONAPIClient/errors';
import {
  IJSONAPIDocument,
  IJSONAPIMeta,
  IJSONAPIRequestDocument,
  IJSONAPIResponse,
} from './JSONAPIClient/types';

export type SuccessfulResponse<P> = IJSONAPIResponse<keyof P, ValueOf<P>>;
export type FailedResponse = APIError | APINetworkError;

interface IAPIAction<T, P> extends Action {
  resourceID?: string;
  resourceType: keyof P;
  status: APIActionStatus;
  type: T,
}

export type APIActionThunk<T, P> =
  ThunkAction<Promise<APIAction<T, P>>, IGlobalState<P>, Promise<JSONAPIClient<P>>, APIAction<T, P>>;

export type APIActionStartStatus =
  APIActionStatus.READING |
  APIActionStatus.UPDATING |
  APIActionStatus.DELETING;

export interface IStartAPIAction<T, P> extends IAPIAction<T, P> {
  payload?: IJSONAPIRequestDocument<keyof P, ValueOf<P>>;
  status: APIActionStartStatus;
}

export interface ICreateAPIAction<P> extends IAPIAction<constants.CREATE_JSONAPI_RESOURCE, P> {
  payload: IJSONAPIRequestDocument<keyof P, ValueOf<P>>;
  status: APIActionStatus.CREATING;
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

export type APIAction<T, P> =
  IStartAPIAction<T, P> |
  ICreateAPIAction<P> |
  ISucceededAPIAction<T, P> |
  IFailedAPIAction<T, P>;

export type APIResourceAction<P> =
  APIAction<constants.LIST_JSONAPI_RESOURCE, P> |
  APIAction<constants.SHOW_JSONAPI_RESOURCE, P> |
  APIAction<constants.PAGE_JSONAPI_RESOURCE, P> |
  APIAction<constants.CREATE_JSONAPI_RESOURCE, P>;

export interface IJSONAPIStateInitializedResource {
  resource: {};
  status: APIActionStatus.INITIALIZED;
}

export interface IJSONAPIStateLoadingResource<T, A> {
  resource: IJSONAPIRequestDocument<T, A>;
  status: APIActionStartStatus | APIActionStatus.CREATING;
}

export interface IJSONAPIStateLoadedResource<T, A> {
  resource: IJSONAPIDocument<T, A>;
  status: APIActionStatus.SUCCEEDED;
}

export interface IJSONAPIStateFailedResource<T, A> {
  error: FailedResponse;
  resource: IJSONAPIRequestDocument<T, A>;
  status: APIActionStatus.FAILED;
}

export type IJSONAPIStateResource<T, A> =
  IJSONAPIStateLoadedResource<T, A> |
  IJSONAPIStateFailedResource<T, A> |
  IJSONAPIStateLoadingResource<T, A> |
  IJSONAPIStateInitializedResource;

export interface IJSONAPIState<T, A> {
  pagingMeta?: IJSONAPIMeta;
  error?: FailedResponse;
  resources: {
    [key: string]: IJSONAPIStateResource<T, A>;
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

export type ResourceMap<S> = {[P in keyof S]: IJSONAPIState<P, S[P]>};

export interface IGlobalState<S> {
  apiResources: ResourceMap<S>;
};

export type JSONAPIMiddleware<S extends IGlobalState<P>, P> =
  ThunkMiddleware<S, APIResourceAction<P>, Promise<JSONAPIClient<P>>>;

export type ThunkDispatchProp<Z, S> = (...args: Parameters<ActionCreator<APIActionThunk<Z, S>>>) => ReturnType<ReturnType<ActionCreator<APIActionThunk<Z, S>>>>;
