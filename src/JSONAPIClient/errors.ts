import { IJSONAPIErrorResponse } from './types';

// tslint:disable:max-classes-per-file

export class NoPageLinkError extends Error {
  constructor(linkType: string) {
    super();
    this.message = `No link to follow for ${linkType}`;
  }
}

export class NoAPITypeError extends Error {
  constructor(apiType: any) {
    super();
    this.message = `Type, ${apiType}, is not defined in api root response.`;
  }
}

export class APIError extends Error {
  public response: Response;
  public errorDocument: IJSONAPIErrorResponse;

  constructor(response: Response, error: IJSONAPIErrorResponse) {
    super();
    this.message = `API Responded with '${response.status}: ${response.statusText}'.`
    this.response = response;
    this.errorDocument = error;
  }
}

export class APINetworkError extends Error {
  public response: Response;

  constructor(response: Response) {
    super();
    this.message = `API Responded with '${response.status}: ${response.statusText}'.`
    this.response = response;
  }
}

export class APIRootFailure extends Error {
  public response: Response;

  constructor(url: string, response: Response) {
    super();
    this.response = response;
    this.message = `Failed to GET ${url}. Request returned with status of ${response.status}: ${response.statusText}.`;
  }
}
