import { APIError, APINetworkError } from './JSONAPIClient/errors';
import { PageableResponse } from './JSONAPIClient/PageableResponse';
import { IJSONAPIDocument, IJSONAPIResponse  } from './JSONAPIClient/types';

export type SuccessfulResponse<P> = IJSONAPIResponse<P> | PageableResponse<P>;
export type FailedResponse = APIError | APINetworkError;

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

