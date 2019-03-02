import { APIError, APINetworkError, NoAPITypeError, NoPageLinkError } from './errors';
import { fetch as defaultFetch, Headers } from './fetch';
import {
  HTTPMethod,
  IAPIRoot,
  IFilters,
  IJSONAPIDocument,
  IJSONAPIMeta,
  IJSONAPIRelationships,
  IJSONAPIResponse,
  IPaging,
} from './types';

export class JSONAPIClient<R> {
  private fetch: (url: RequestInfo, init?: RequestInit) => Promise<Response>;
  private apiRoot: IAPIRoot<R>;
  private defaultHeaders: {[key: string]: string};
  private defaultFetchArgs: RequestInit;
  private apiPrefix: string;

  constructor(
    apiRoot: IAPIRoot<R>,
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

  public async list<A> (
    resourceType: keyof IAPIRoot<R>['links'],
    filters?: IFilters,
    page?: IPaging,
  ): Promise<IJSONAPIResponse<keyof IAPIRoot<R>['links'], A>> {
    if (!this.apiRoot.links[resourceType]) {
      throw new NoAPITypeError(resourceType);
    }
    return await this.makeDirectRequest<keyof IAPIRoot<R>['links'], A>(
      `${this.apiPrefix}${this.apiRoot.links[resourceType].self}${this.toQuery(filters, page)}`,
      'GET',
    );
  }

  public async show<T> (
    resourceType: keyof IAPIRoot<R>['links'],
    id: string,
  ): Promise<IJSONAPIResponse<keyof IAPIRoot<R>['links'], T>> {
    if (!this.apiRoot.links[resourceType]) {
      throw new NoAPITypeError(resourceType);
    }
    return this.makeDirectRequest<keyof IAPIRoot<R>['links'], T>(
      `${this.apiPrefix}${this.apiRoot.links[resourceType].self}/${id}`,
      'GET',
    );
  }

  public async create<A> (
    resourceType: keyof IAPIRoot<R>['links'],
    attributes: A,
    relationships?: IJSONAPIRelationships,
    id?: string,
  ): Promise<IJSONAPIResponse<keyof IAPIRoot<R>['links'], A>> {
    if (!this.apiRoot.links[resourceType]) {
      throw new NoAPITypeError(resourceType);
    }

    const body: IJSONAPIDocument<keyof IAPIRoot<R>['links'], A> = {
      attributes,
      relationships: relationships ? relationships : {},
      type: resourceType,
    }

    if (id) {
      body.id = id;
    }

    return this.makeDirectRequest<keyof IAPIRoot<R>['links'], A>(
      `${this.apiPrefix}${this.apiRoot.links[resourceType].self}`,
      'POST',
      body,
    )
  }

  public nextPage<T, A> (meta: IJSONAPIMeta) {
    if (meta.nextPage) {
      return this.makeDirectRequest<T, A>(meta.nextPage, 'GET')
    }
    return Promise.reject(new NoPageLinkError('nextPage'));
  }

  public prevPage<T, A> (meta: IJSONAPIMeta) {
    if (meta.prevPage) {
      return this.makeDirectRequest<T, A>(meta.prevPage, 'GET')
    }
    return Promise.reject(new NoPageLinkError('prevPage'));
  }

  public firstPage<T, A> (meta: IJSONAPIMeta) {
    if (meta.firstPage) {
      return this.makeDirectRequest<T, A>(meta.firstPage, 'GET')
    }
    return Promise.reject(new NoPageLinkError('firstPage'));
  }

  public lastPage<T, A> (meta: IJSONAPIMeta) {
    if (meta.lastPage) {
      return this.makeDirectRequest<T, A>(meta.lastPage, 'GET')
    }
    return Promise.reject(new NoPageLinkError('lastPage'));
  }

  public async makeDirectRequest<T, A> (
    url: string,
    method: HTTPMethod,
    body?: IJSONAPIDocument<T, A>,
  ): Promise<IJSONAPIResponse<T, A>> {
    let headers: Headers;
    if (body) {
      headers = new Headers({
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
      });
    } else {
      headers = new Headers({
        'Accept': 'application/vnd.api+json',
        ...this.defaultHeaders,
      });
    }

    const includeBody = body ? { body: JSON.stringify({ data: body }) } : { };
    const requestInfo = {
      headers,
      method,
      ...includeBody,
      ...this.defaultFetchArgs,
    }

    const resp = await this.fetch(url, requestInfo)
    return this.parseResponse<T, A>(resp);
  }

  private async parseResponse<T, A> (response: Response): Promise<IJSONAPIResponse<T, A>> {
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
