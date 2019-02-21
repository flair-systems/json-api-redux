export interface IAPIRoot {
  links: {
    [key: string]: {
      self: string;
      type: string;
    };
  };
};

export interface IFilters {
  [key: string]: string;
}

export interface IPaging {
  page?: string;
  size?: string;
  offset? string;
}

export interface IJSONAPIMeta {
  self: string;
  firstPage?: string | null;
  lastPage?: string | null;
  nextPage?: string | null;
  prevPage?: string | null;
}

export interface IJSONAPIDocument {
  id: string;
  type: string;
  attributes: T;
}

export interface IJSONAPIErrorResponse {
  errors: Array<{status: string; code: string; description: string;}>
}

export interface IJSONAPIResponse<T> {
  data: IJSONAPIDocument<T> | Array<IJSONAPIDocument<T>>;
  meta: IJSONAPIMeta;
}

export type HTTPMethod = 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'HEAD';

export interface IAPIClient {
  makeDirectRequest: <T>(url: string, method: HTTPMethod) => Promise<IJSONAPIResponse<T>>;
}
