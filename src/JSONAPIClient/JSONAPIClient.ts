import { APIError, APINetworkError, NoAPITypeError } from './errors';
import { fetch, Headers, Request } from './fetch';
import { PageableResponse } from './PageableResponse';
import { HTTPMethod, IAPIClient, IAPIRoot, IFilters, IJSONAPIResponse, IPaging } from './types';

export class JSONAPIClient implements IAPIClient {
  private fetch: (req: Request) => Promise<Response>;
  private apiRoot: IAPIRoot;
  private defaultHeaders: {[key: string]: string};
  private apiPrefix: string;

  constructor(apiRoot: IAPIRoot, _fetch = fetch, apiPrefix = '', defaultHeaders = {}) {
    this.fetch = _fetch;
    this.apiRoot = apiRoot;
    this.apiPrefix = apiPrefix;
    this.defaultHeaders = defaultHeaders;
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

  public makeDirectRequest<T> (url: string, method: HTTPMethod): Promise<IJSONAPIResponse<T>> {
    const req = this.newRequest(url, method);
    return this.fetch(req).then(this.parseResponse);
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

  private newRequest(url: string, method: HTTPMethod) {
    const headers = new Headers({
      'Accept': 'application/vnd.api+json',
      ...this.defaultHeaders
    })
    return new Request(url, {
      headers,
      method,
    });
  }
}
