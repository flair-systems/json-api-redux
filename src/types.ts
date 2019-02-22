import { APIError, APINetworkError } from './JSONAPIClient/errors';
import { PageableResponse } from './JSONAPIClient/PageableResponse';
import { IJSONAPIDocument, IJSONAPIResponse  } from './JSONAPIClient/types';

export type SuccessfulResponse<P> = IJSONAPIResponse<P> | PageableResponse<P>;
export type FailedResponse = APIError | APINetworkError;

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

