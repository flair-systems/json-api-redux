import 'jest';

import { initialState, reduceAPIResource } from '../index';

import * as constants from '../../actions/constants';
import { APIActionStatus, APIResourceAction, IJSONAPIState } from '../../types';

import { JSONAPIClient } from '../../JSONAPIClient';
import { APIError } from '../../JSONAPIClient/errors';
import { Response } from '../../JSONAPIClient/fetch';
import { PageableResponse } from '../../JSONAPIClient/PageableResponse';
import { IJSONAPIDocument, IJSONAPIResponse } from '../../JSONAPIClient/types';
jest.mock('../../JSONAPIClient');


interface IUser {
  email: string;
  name: string;
}

const mockData = (id: string = '1'): IJSONAPIDocument<'users', IUser> => {
  return {
    attributes: {
      email: 'ed@flair.co',
      name: 'Ed Paget',
    },
    id,
    relationships: {},
    type: 'users',
  }
};

const multiPayload: IJSONAPIResponse<'users', IUser> = {
  data: [mockData()],
  meta: {
    firstPage: '/api/users/page[size]=1&page[page]=1',
    lastPage: '/api/users?page[size]=1&page[page]=10',
    nextPage: 'api/users?page[size]=1&page[page]=2',
    prevPage: null,
    self: '/api/users?page[size]=1&page[page]=1',
  },
};

const singlePayload = (id: string = '1'): IJSONAPIResponse<'users', IUser> => {
  return {
    data: mockData(id),
    meta: {
      self: '/api/users?page[size]=1&page[page]=1',
    },
  }
};

const client = new JSONAPIClient({
  links: {
    users: {
      self: '/api/users',
      type: 'users',
    },
  },
});

const listReadStart: APIResourceAction<{users: IUser}> = {
  resourceType: 'users',
  status: APIActionStatus.READING,
  type: constants.LIST_JSONAPI_RESOURCE,
}

const listReadSucceed: APIResourceAction<{users: IUser}> = {
  idMap: {},
  payload: new PageableResponse<'users', IUser>(client, multiPayload),
  resourceType: 'users',
  status: APIActionStatus.SUCCEEDED,
  type: constants.LIST_JSONAPI_RESOURCE,
}

const listReadFailed: APIResourceAction<{users: IUser}> = {
  payload: new APIError(new Response(), { errors: [{
    code: '404',
    description: 'Request resource not found.',
    status: 'Not Found',
  }]}),
  resourceType: 'users',
  status: APIActionStatus.FAILED,
  type: constants.LIST_JSONAPI_RESOURCE,
}

const showReadStart: APIResourceAction<{users: IUser}> = {
  resourceID: '1',
  resourceType: 'users',
  status: APIActionStatus.READING,
  type: constants.SHOW_JSONAPI_RESOURCE,
};

const showReadSucceed: APIResourceAction<{users: IUser}> = {
  idMap: {},
  payload: singlePayload(),
  resourceID: '1',
  resourceType: 'users',
  status: APIActionStatus.SUCCEEDED,
  type: constants.SHOW_JSONAPI_RESOURCE,
}

const showReadFailed: APIResourceAction<{users: IUser}> = {
  payload: new APIError(new Response(), { errors: [{
    code: '404',
    description: 'Request resource not found.',
    status: 'Not Found',
  }]}),
  resourceID: '1',
  resourceType: 'users',
  status: APIActionStatus.FAILED,
  type: constants.SHOW_JSONAPI_RESOURCE,
}

const createStart: APIResourceAction<{users: IUser}> = {
  payload: mockData(),
  resourceID: '1',
  resourceType: 'users',
  status: APIActionStatus.CREATING,
  type: constants.CREATE_JSONAPI_RESOURCE,
};

const createSucceed: APIResourceAction<{users: IUser}> = {
  idMap: {'2': '1'},
  payload: singlePayload('2'),
  resourceID: '2',
  resourceType: 'users',
  status: APIActionStatus.SUCCEEDED,
  type: constants.CREATE_JSONAPI_RESOURCE,
}

const createFailed: APIResourceAction<{users: IUser}> = {
  payload: new APIError(new Response(), { errors: [{
    code: '400',
    description: 'The request was bad no?',
    status: 'Bad Request',
  }]}),
  resourceID: '1',
  resourceType: 'users',
  status: APIActionStatus.FAILED,
  type: constants.CREATE_JSONAPI_RESOURCE,
}

describe('redurceAPIResource', () => {
  describe('LIST_JSONAPI_RESOURCE', () => {
    it('should set status to READING when starting', () => {
      const state = reduceAPIResource<{users: IUser}>(initialState(), listReadStart);
      expect(state.status).toBe(APIActionStatus.READING);
    });

    it('should set status to succeed when finished successfully', () => {
      const state = reduceAPIResource<{users: IUser}>(initialState(), listReadSucceed);
      expect(state.status).toBe(APIActionStatus.SUCCEEDED);
    });

    it('should set the pager field', () => {
      const state = reduceAPIResource<{users: IUser}>(
        initialState(), listReadSucceed,
      ) as IJSONAPIState<IUser>;
      expect(state.currentPaged).toBe(listReadSucceed.payload);
    });

    it('should add the resources to the field indexed by id', () => {
      const state = reduceAPIResource<{users: IUser}>(
        initialState(), listReadSucceed,
      ) as IJSONAPIState<IUser>;
      expect(state.resources).toEqual(expect.objectContaining({
        '1': expect.objectContaining({
          resource: mockData(),
          status: APIActionStatus.SUCCEEDED,
        }),
      }));
    });

    it('should set the status to failed if it fails', () => {
      const state = reduceAPIResource<{users: IUser}>(
        initialState(), listReadFailed,
      );
      expect(state.status).toBe(APIActionStatus.FAILED);
    });

    it('should set an error if it fails', () => {
      const state = reduceAPIResource<{users: IUser}>(
        initialState(), listReadFailed,
      );
      const errMsg = state.error ? state.error.message : null;
      expect(errMsg).toMatch(/API Responded/);
    });
  });

  describe('SHOW_JSONAPI_RESOURCE', () => {
    it('should set status to READING on the subresource when starting', () => {
      const state = reduceAPIResource<{users: IUser}>(initialState(), showReadStart);
      expect(state.resources['1'].status).toBe(APIActionStatus.READING);
    });

    it('should create a new resource when non exists', () => {
      const state = reduceAPIResource<{users: IUser}>(initialState(), showReadStart);
      const resource = state.resources['1'].resource
      expect(resource).toBeDefined();
      expect(resource && resource.id).toEqual('1');
      expect(resource && resource.type).toEqual('users');
    });

    it('should set status to succeed when finished successfuly', () => {
      const state = reduceAPIResource<{users: IUser}>(initialState(), showReadSucceed);
      expect(state.resources['1'].status).toBe(APIActionStatus.SUCCEEDED);
    });

    it('should update the resource with the returned payload', () => {
      const state = reduceAPIResource<{users: IUser}>(initialState(), showReadSucceed);
      const resource = state.resources['1'].resource
      expect(resource).toEqual(singlePayload().data);
    });

    it('should set status to failed when finished in failure', () => {
      const state = reduceAPIResource<{users: IUser}>(initialState(), showReadFailed);
      expect(state.resources['1'].status).toBe(APIActionStatus.FAILED);
    });

    it('should set an error if it fails', () => {
      const state = reduceAPIResource<{users: IUser}>(
        initialState(), showReadFailed,
      );
      const errMsg = state.resources['1'].error ? state.resources['1'].error.message : null;
      expect(errMsg).toMatch(/API Responded/);
    });
  });

  describe('CREATE_JSONAPI_RESOURCE', () => {
    it('should set status CREATING on the subresource when starting', () => {
      const state = reduceAPIResource<{users: IUser}>(initialState(), createStart);
      expect(state.resources['1'].status).toBe(APIActionStatus.CREATING);
    });

    it('should set status SUCCEEDED on the subresource when successfully finished', () => {
      const state = reduceAPIResource<{users: IUser}>(initialState(), createSucceed);
      expect(state.resources['2'].status).toBe(APIActionStatus.SUCCEEDED);
    });

    it('should create a new resource when it succeeds', () => {
      const state = reduceAPIResource<{users: IUser}>(initialState(), createSucceed);
      expect(state.resources['2'].resource).toEqual(expect.objectContaining({
        attributes: expect.any(Object),
        id: '2',
        relationships: expect.any(Object),
        type: 'users',
      }));
    });

    it('should link the old id to the newly created one', () => {
      const state = reduceAPIResource<{users: IUser}>(initialState(), createSucceed);
      expect(state.resources['2']).toBe(state.resources['1']);
    })

    it('should set status FAILED on the subresource when failed', () => {
      const state = reduceAPIResource<{users: IUser}>(initialState(), createFailed);
      expect(state.resources['1'].status).toBe(APIActionStatus.FAILED);
    });

    it('should set an error if it fails', () => {
      const state = reduceAPIResource<{users: IUser}>(
        initialState(), createFailed,
      );
      const errMsg = state.resources['1'].error ? state.resources['1'].error.message : null;
      expect(errMsg).toMatch(/API Responded/);
    });
  });
});
