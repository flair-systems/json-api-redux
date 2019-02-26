import 'jest';

import * as constants from '../constants';

import { APIActionStatus, IJSONAPIState } from '../../types';
import { createAPIResource, listAPIResource, pageAPIResource, showAPIResource } from '../index';

import { JSONAPIClient } from '../../JSONAPIClient';
import { PageableResponse } from '../../JSONAPIClient/PageableResponse';
jest.mock('../../JSONAPIClient');
jest.mock('../../JSONAPIClient/PageableResponse');

interface IUser {
  email: string;
  name: string;
}

const client = new JSONAPIClient({
  links: {
    users: {
      self: '/api/users',
      type: 'users',
    },
  },
});

const promiseClient = Promise.resolve(client);

const mockData = {
  attributes: {
    email: 'ed@flair.co',
    name: 'Ed Paget',
  },
  id: '1',
  relationships: {},
  type: 'users',
};

const mockUser = {
  data: mockData,
  meta: {
    self: '/api/users/1',
  },
};

const pageableResource = new PageableResponse<IUser>(client, {
  data: [mockData],
  meta: {
    firstPage: '/api/users/page[size]=1&page[page]=1',
    lastPage: '/api/users?page[size]=1&page[page]=10',
    nextPage: '/api/users?page[size]=1&page[page]=2',
    prevPage: null,
    self: '/api/users?page[size]=1&page[page]=1',
  },
});

const state = (): {[key: string]: IJSONAPIState<IUser>} => {
  return {
    users: {
      currentPaged: pageableResource,
      resources: {
        '1': {
          resource: mockData,
          status: APIActionStatus.SUCCEEDED,
        },
      },
      status: APIActionStatus.SUCCEEDED,
    },
  };
};

describe('listAPIResource', () => {
  it('should call list on the api resource', async () => {
    const dispatch = jest.fn();
    const userList = listAPIResource<IUser>('users');
    await userList()(dispatch, state, promiseClient)
    expect(client.list).toHaveBeenCalledWith('users');
  });
});

describe('showAPIResource', () => {
  it('should call show the api resource', async () => {
    const dispatch = jest.fn();
    const userShow = showAPIResource<IUser>('users');
    await userShow({id: '1'})(dispatch, state, promiseClient)
    expect(client.show).toHaveBeenCalledWith('users', '1');
  });
})

describe('pageAPIResource', () => {
  it('should call firstPage on the api resource', async () => {
    const dispatch = jest.fn();
    const userList = pageAPIResource<IUser>('users');
    await userList({pageLink: 'first'})(dispatch, state, promiseClient)
    expect(pageableResource.firstPage).toHaveBeenCalled();
  });

  it('should call prevPage on the api resource', async () => {
    const dispatch = jest.fn();
    const userList = pageAPIResource<IUser>('users');
    await userList({pageLink: 'prev'})(dispatch, state, promiseClient)
    expect(pageableResource.prevPage).toHaveBeenCalled();
  });

  it('should call nextPage on the api resource', async () => {
    const dispatch = jest.fn();
    const userList = pageAPIResource<IUser>('users');
    await userList({pageLink: 'next'})(dispatch, state, promiseClient)
    expect(pageableResource.nextPage).toHaveBeenCalled();
  });

  it('should call lastPage on the api resource', async () => {
    const dispatch = jest.fn();
    const userList = pageAPIResource<IUser>('users');
    await userList({pageLink: 'last'})(dispatch, state, promiseClient)
    expect(pageableResource.lastPage).toHaveBeenCalled();
  });
});

describe('createAPIResource', () => {
  it('should dispatch a create action', async () => {
    const dispatch = jest.fn();
    const newUser = createAPIResource<IUser>('users');
    await newUser({
      attributes: {
        email: 'ed@flair.co',
        name: 'Ed Paget',
      },
    })(dispatch, state, promiseClient);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      payload: {
        attributes: {
          email: 'ed@flair.co',
          name: 'Ed Paget',
        },
        relationships: {},
        type: 'users',
      },
      resourceType: 'users',
      status: APIActionStatus.CREATING,
      type: constants.CREATE_JSONAPI_RESOURCE,
    }));
  });

  it('should dispatch a success action when it works', async () => {
    const dispatch = jest.fn();
    const createClient = jest.fn().mockResolvedValue(mockUser);
    const newUser = createAPIResource<IUser>('users');
    const oldCreate = client.create;
    client.create = createClient;
    await newUser({
      attributes: {
        email: 'ed@flair.co',
        name: 'Ed Paget',
      },
    })(dispatch, state, promiseClient);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      payload: mockUser,
      status: APIActionStatus.SUCCEEDED,
      type: constants.CREATE_JSONAPI_RESOURCE,
    }));
    client.create = oldCreate;
  });

  it('should dispatch an error when it fails', async () => {
    const dispatch = jest.fn();
    const createClient = jest.fn().mockRejectedValue(new Error('Epic Fail!'))
    const newUser = createAPIResource<IUser>('users');
    const oldCreate = client.create;
    client.create = createClient;
    await newUser({
      attributes: {
        email: 'ed@flair.co',
        name: 'Ed Paget',
      },
    })(dispatch, state, promiseClient);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.any(Error),
      status: APIActionStatus.FAILED,
      type: constants.CREATE_JSONAPI_RESOURCE,
    }));
    client.create = oldCreate;
  });

  it('should call create on the client', async () => {
    const dispatch = jest.fn();
    const newUser = createAPIResource<IUser>('users');
    await newUser({
      attributes: {
        email: 'ed@flair.co',
        name: 'Ed Paget',
      },
      id: '1',
      relationships: {
        users: {
          data: {
            id: '1',
            type: 'users',
          },
        },
      },
    })(dispatch, state, promiseClient);
    expect(client.create).toHaveBeenCalledWith(
      'users',
      {
        email: 'ed@flair.co',
        name: 'Ed Paget',
      },
      {
        users: {
          data: {
            id: '1',
            type: 'users',
          },
        },
      },
      '1',
    );
  });
});
