import { NoPageLinkError } from './errors';
import { IAPIClient, IJSONAPIResponse } from './types';

export class PageableResponse<T, A> {
  private client: IAPIClient;
  private response: IJSONAPIResponse<T, A>

  constructor(client: IAPIClient, response: IJSONAPIResponse<T, A>) {
    this.response = response;
    this.client = client;
  }

  public get data() {
    return this.response.data;
  }

  public nextPage() {
    if (this.response.meta.nextPage) {
      return this.client
        .makeDirectRequest<T, A>(this.response.meta.nextPage, 'GET')
        .then(this.makeNewResponse)
    }
    return Promise.reject(new NoPageLinkError('nextPage'));
  }

  public prevPage() {
    if (this.response.meta.prevPage) {
      return this.client
        .makeDirectRequest<T, A>(this.response.meta.prevPage, 'GET')
        .then(this.makeNewResponse)
    }
    return Promise.reject(new NoPageLinkError('prevPage'));
  }

  public firstPage() {
    if (this.response.meta.firstPage) {
      return this.client
        .makeDirectRequest<T, A>(this.response.meta.firstPage, 'GET')
        .then(this.makeNewResponse)
    }
    return Promise.reject(new NoPageLinkError('firstPage'));
  }

  public lastPage() {
    if (this.response.meta.lastPage) {
      return this.client
        .makeDirectRequest<T, A>(this.response.meta.lastPage, 'GET')
        .then(this.makeNewResponse)
    }
    return Promise.reject(new NoPageLinkError('lastPage'));
  }

  private makeNewResponse = (response: IJSONAPIResponse<T, A>) => {
    return new PageableResponse<T, A>(this.client, response);
  }
}
