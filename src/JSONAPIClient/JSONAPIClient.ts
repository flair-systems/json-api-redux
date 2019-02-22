import { APIError, APINetworkError, NoAPITypeError } from './errors';
import { fetch as defaultFetch, Headers } from './fetch';
import { PageableResponse } from './PageableResponse';
import { HTTPMethod, IAPIClient, IAPIRoot, IFilters, IJSONAPIResponse, IPaging } from './types';

export class JSONAPIClient implements IAPIClient {
  private fetch: (url: RequestInfo, init?: RequestInit) => Promise<Response>;
  private apiRoot: IAPIRoot;
  private defaultHeaders: {[key: string]: string};
  private defaultFetchArgs: RequestInit;
  private apiPrefix: string;

  constructor(
    apiRoot: IAPIRoot,
    fetch = defaultFetch,
    apiPrefix = '',
    defaultHeaders = {},
    defaultFetchArgs = {},
  ) {
    this.fetch = fetch;
    this.apiRoot = apiRoot;
    this.apiPrefix = apiPrefix;
    this.defaultHeaders = defaultHeaders;
    this.defaultFetchArgs = defaultFetchArgs;
  }

  public async list<T> (type: string, filters?: IFilters, page?: IPaging): Promise<PageableResponse<T>> {
    if (!this.apiRoot.links[type]) {
      throw new NoAPITypeError(type);
    }
    const response = await this.makeDirectRequest<T>(
      `${this.apiPrefix}${this.apiRoot.links[type].self}${this.toQuery(filters, page)}`,
      'GET',
    )

    return new PageableResponse<T>(this, response);
  }

  public async show<T> (type: string, id: string): Promise<IJSONAPIResponse<T>> {
    if (!this.apiRoot.links[type]) {
      throw new NoAPITypeError(type);
    }
    return this.makeDirectRequest<T>(`${this.apiPrefix}${this.apiRoot.links[type].self}/${id}`, 'GET');
  }

  public async makeDirectRequest<T> (url: string, method: HTTPMethod): Promise<IJSONAPIResponse<T>> {
    const headers = new Headers({
      'Accept': 'application/vnd.api+json',
      ...this.defaultHeaders,
    });
    const resp = await this.fetch(url, {
      headers,
      method,
      ...this.defaultFetchArgs,
    })
    return this.parseResponse<T>(resp);
  }

  private async parseResponse<T> (response: Response): Promise<IJSONAPIResponse<T>> {
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500) {
        const body = await response.json();
        throw new APIError(response, body);
      } else {
        throw new APINetworkError(response);
      }
    }
    return await response.json();
  }

  private toQuery(filters?: IFilters, page?: IPaging): string {
    return '';
  }
}
