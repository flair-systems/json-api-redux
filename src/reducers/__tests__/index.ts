import 'jest';

import { initialState, reduceAPIResource } from '../index';

import * as constants from '../../actions/constants';
import { APIActionStatus, APIResourceAction, IJSONAPIState } from '../../types';

import { JSONAPIClient } from '../../JSONAPIClient';
import { APIError } from '../../JSONAPIClient/errors';
import { Response } from '../../JSONAPIClient/fetch';
jest.mock('../../JSONAPIClient');

import { PageableResponse } from '../../JSONAPIClient/PageableResponse';

interface IUser {
  email: string;
  name: string;
}

const mockData = (id: string = '1') => {
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

const multiPayload = {
  data: [mockData()],
  meta: {
    firstPage: '/api/users/page[size]=1&page[page]=1',
    lastPage: '/api/users?page[size]=1&page[page]=10',
    nextPage: 'api/users?page[size]=1&page[page]=2',
    prevPage: null,
    self: '/api/users?page[size]=1&page[page]=1',
  },
};

const singlePayload = (id: string = '1') => {
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

const listReadStart: APIResourceAction<IUser> = {
  resourceType: 'users',
  status: APIActionStatus.READING,
  type: constants.LIST_JSONAPI_RESOURCE,
}

const listReadSucceed: APIResourceAction<IUser> = {
  idMap: {},
  payload: new PageableResponse<IUser>(client, multiPayload),
  resourceType: 'users',
  status: APIActionStatus.SUCCEEDED,
  type: constants.LIST_JSONAPI_RESOURCE,
}

const listReadFailed: APIResourceAction<IUser> = {
  payload: new APIError(new Response(), { errors: [{
    code: '404',
    description: 'Request resource not found.',
    status: 'Not Found',
  }]}),
  resourceType: 'users',
  status: APIActionStatus.FAILED,
  type: constants.LIST_JSONAPI_RESOURCE,
}

const showReadStart: APIResourceAction<IUser> = {
  resourceID: '1',
  resourceType: 'users',
  status: APIActionStatus.READING,
  type: constants.SHOW_JSONAPI_RESOURCE,
};

const showReadSucceed: APIResourceAction<IUser> = {
  idMap: {},
  payload: singlePayload(),
  resourceID: '1',
  resourceType: 'users',
  status: APIActionStatus.SUCCEEDED,
  type: constants.SHOW_JSONAPI_RESOURCE,
}

const showReadFailed: APIResourceAction<IUser> = {
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

const createStart: APIResourceAction<IUser> = {
  payload: mockData(),
  resourceID: '1',
  resourceType: 'users',
  status: APIActionStatus.CREATING,
  type: constants.CREATE_JSONAPI_RESOURCE,
};

const createSucceed: APIResourceAction<IUser> = {
  idMap: {'2': '1'},
  payload: singlePayload('2'),
  resourceID: '2',
  resourceType: 'users',
  status: APIActionStatus.SUCCEEDED,
  type: constants.CREATE_JSONAPI_RESOURCE,
}

const createFailed: APIResourceAction<IUser> = {
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
      const state = reduceAPIResource<IUser>(initialState<IUser>(), listReadStart);
      expect(state.status).toBe(APIActionStatus.READING);
    });

    it('should set status to succeed when finished successfully', () => {
      const state = reduceAPIResource<IUser>(initialState<IUser>(), listReadSucceed);
      expect(state.status).toBe(APIActionStatus.SUCCEEDED);
    });

    it('should set the pager field', () => {
      const state = reduceAPIResource<IUser>(
        initialState<IUser>(), listReadSucceed,
      ) as IJSONAPIState<IUser>;
      expect(state.currentPaged).toBe(listReadSucceed.payload);
    });

    it('should add the resources to the field indexed by id', () => {
      const state = reduceAPIResource<IUser>(
        initialState<IUser>(), listReadSucceed,
      ) as IJSONAPIState<IUser>;
      expect(state.resources).toEqual(expect.objectContaining({
        '1': expect.objectContaining({
          resource: mockData(),
          status: APIActionStatus.SUCCEEDED,
        }),
      }));
    });

    it('should set the status to failed if it fails', () => {
      const state = reduceAPIResource<IUser>(
        initialState<IUser>(), listReadFailed,
      );
      expect(state.status).toBe(APIActionStatus.FAILED);
    });

    it('should set an error if it fails', () => {
      const state = reduceAPIResource<IUser>(
        initialState<IUser>(), listReadFailed,
      );
      const errMsg = state.error ? state.error.message : null;
      expect(errMsg).toMatch(/API Responded/);
    });
  });

  describe('SHOW_JSONAPI_RESOURCE', () => {
    it('should set status to READING on the subresource when starting', () => {
      const state = reduceAPIResource<IUser>(initialState<IUser>(), showReadStart);
      expect(state.resources['1'].status).toBe(APIActionStatus.READING);
    });

    it('should create a new resource when non exists', () => {
      const state = reduceAPIResource<IUser>(initialState<IUser>(), showReadStart);
      const resource = state.resources['1'].resource
      expect(resource).toBeDefined();
      expect(resource && resource.id).toEqual('1');
      expect(resource && resource.type).toEqual('users');
    });

    it('should set status to succeed when finished successfuly', () => {
      const state = reduceAPIResource<IUser>(initialState<IUser>(), showReadSucceed);
      expect(state.resources['1'].status).toBe(APIActionStatus.SUCCEEDED);
    });

    it('should update the resource with the returned payload', () => {
      const state = reduceAPIResource<IUser>(initialState<IUser>(), showReadSucceed);
      const resource = state.resources['1'].resource
      expect(resource).toEqual(singlePayload().data);
    });

    it('should set status to failed when finished in failure', () => {
      const state = reduceAPIResource<IUser>(initialState<IUser>(), showReadFailed);
      expect(state.resources['1'].status).toBe(APIActionStatus.FAILED);
    });

    it('should set an error if it fails', () => {
      const state = reduceAPIResource<IUser>(
        initialState<IUser>(), showReadFailed,
      );
      const errMsg = state.resources['1'].error ? state.resources['1'].error.message : null;
      expect(errMsg).toMatch(/API Responded/);
    });
  });

  describe('CREATE_JSONAPI_RESOURCE', () => {
    it('should set status CREATING on the subresource when starting', () => {
      const state = reduceAPIResource<IUser>(initialState<IUser>(), createStart);
      expect(state.resources['1'].status).toBe(APIActionStatus.CREATING);
    });

    it('should set status SUCCEEDED on the subresource when successfully finished', () => {
      const state = reduceAPIResource<IUser>(initialState<IUser>(), createSucceed);
      expect(state.resources['2'].status).toBe(APIActionStatus.SUCCEEDED);
    });

    it('should create a new resource when it succeeds', () => {
      const state = reduceAPIResource<IUser>(initialState<IUser>(), createSucceed);
      expect(state.resources['2'].resource).toEqual(expect.objectContaining({
        attributes: expect.any(Object),
        id: '2',
        relationships: expect.any(Object),
        type: 'users',
      }));
    });

    it('should link the old id to the newly created one', () => {
      const state = reduceAPIResource<IUser>(initialState<IUser>(), createSucceed);
      expect(state.resources['2']).toBe(state.resources['1']);
    })

    it('should set status FAILED on the subresource when failed', () => {
      const state = reduceAPIResource<IUser>(initialState<IUser>(), createFailed);
      expect(state.resources['1'].status).toBe(APIActionStatus.FAILED);
    });

    it('should set an error if it fails', () => {
      const state = reduceAPIResource<IUser>(
        initialState<IUser>(), createFailed,
      );
      const errMsg = state.resources['1'].error ? state.resources['1'].error.message : null;
      expect(errMsg).toMatch(/API Responded/);
    });
  });
});
