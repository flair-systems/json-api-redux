import { NoPageLinkError } from './errors';
import { IAPIClient, IJSONAPIResponse } from './types';

export class PageableResponse<T> {
  private client: IAPIClient;
  private response: IJSONAPIResponse<T>

  constructor(client: IAPIClient, response: IJSONAPIResponse<T>) {
    this.response = response;
    this.client = client;
  }

  public get data() {
    return this.response.data;
  }

  public nextPage() {
    if (this.response.meta.nextPage) {
      return this.client
        .makeDirectRequest<T>(this.response.meta.nextPage, 'GET')
        .then(this.makeNewResponse)
    }
    return Promise.reject(new NoPageLinkError('nextPage'));
  }

  public prevPage() {
    if (this.response.meta.prevPage) {
      return this.client
        .makeDirectRequest<T>(this.response.meta.prevPage, 'GET')
        .then(this.makeNewResponse)
    }
    return Promise.reject(new NoPageLinkError('prevPage'));
  }

  public firstPage() {
    if (this.response.meta.firstPage) {
      return this.client
        .makeDirectRequest<T>(this.response.meta.firstPage, 'GET')
        .then(this.makeNewResponse)
    }
    return Promise.reject(new NoPageLinkError('firstPage'));
  }

  public lastPage() {
    if (this.response.meta.lastPage) {
      return this.client
        .makeDirectRequest<T>(this.response.meta.lastPage, 'GET')
        .then(this.makeNewResponse)
    }
    return Promise.reject(new NoPageLinkError('lastPage'));
  }

  private makeNewResponse = (response: IJSONAPIResponse<T>) => {
    return new PageableResponse<T>(this.client, response);
  }
}
