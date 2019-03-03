export interface IAPIRoot<S> {
  links: {
    [P in keyof S]: {
      self: string;
      type: P;
    };
  };
};

export interface IFilters {
  [key: string]: string;
}

export interface IPaging {
  page?: string;
  size?: string;
  offset?: string;
}

export interface IJSONAPIMeta {
  self: string;
  firstPage?: string | null;
  lastPage?: string | null;
  nextPage?: string | null;
  prevPage?: string | null;
}

export interface IJSONAPILink {
  type: string;
  id: string;
}

export interface IJSONAPIRelationships {
  [key: string]: {
    data: IJSONAPILink | IJSONAPILink[];
    links?: {
      self: string;
      related: string;
    };
  }
}

export interface IJSONAPIDocument<T, A> {
  id?: string;
  type: T;
  attributes: A;
  relationships: IJSONAPIRelationships;
}

export type IJSONAPIRequestDocument<T, A> = Partial<IJSONAPIDocument<T, Partial<A>>>;

export interface IJSONAPIErrorResponse {
  errors: Array<{status: string; code: string; description: string;}>
}

export interface IJSONAPIResponse<T, A> {
  data: IJSONAPIDocument<T, A> | Array<IJSONAPIDocument<T, A>>;
  meta: IJSONAPIMeta;
}

export type HTTPMethod = 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'HEAD';
