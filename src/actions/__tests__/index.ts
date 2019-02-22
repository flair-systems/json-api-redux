import 'jest';

import { APIActionStatus, IJSONAPIState } from '../../types';
import { listAPIResource, pageAPIResource, showAPIResource } from '../index';

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

const mockData = {
  attributes: {
    email: 'ed@flair.co',
    name: 'Ed Paget',
  },
  id: '1',
  type: 'users',
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

const state = (): IJSONAPIState<IUser> => {
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
    await userList()(dispatch, state, client)
    expect(client.list).toHaveBeenCalledWith('users');
  });
});

describe('showAPIResource', () => {
  it('should call list on the api resource', async () => {
    const dispatch = jest.fn();
    const userShow = showAPIResource<IUser>('users');
    await userShow('1')(dispatch, state, client)
    expect(client.show).toHaveBeenCalledWith('users', '1');
  });
})

describe('pageAPIResource', () => {
  it('should call firstPage on the api resource', async () => {
    const dispatch = jest.fn();
    const userList = pageAPIResource<IUser>('users');
    await userList('first')(dispatch, state, client)
    expect(pageableResource.firstPage).toHaveBeenCalled();
  });

  it('should call prevPage on the api resource', async () => {
    const dispatch = jest.fn();
    const userList = pageAPIResource<IUser>('users');
    await userList('prev')(dispatch, state, client)
    expect(pageableResource.prevPage).toHaveBeenCalled();
  });

  it('should call nextPage on the api resource', async () => {
    const dispatch = jest.fn();
    const userList = pageAPIResource<IUser>('users');
    await userList('next')(dispatch, state, client)
    expect(pageableResource.nextPage).toHaveBeenCalled();
  });

  it('should call lastPage on the api resource', async () => {
    const dispatch = jest.fn();
    const userList = pageAPIResource<IUser>('users');
    await userList('last')(dispatch, state, client)
    expect(pageableResource.lastPage).toHaveBeenCalled();
  });
});
