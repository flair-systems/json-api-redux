import { IJSONAPIErrorResponse } from './types';

export class NoPageLinkError extends Error {
  constructor(linkType: string) {
    super();
    this.message = `No link to follow for ${linkType}`;
  }
}

export class NoAPITypeError extends Error {
  constructor(apiType: string) {
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
