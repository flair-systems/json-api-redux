import 'jest';

import { applyMiddleware, combineReducers, createStore } from 'redux';

import {
  apiResources as apiResourcesFactory,
  IGlobalState,
  initAPIResources,
  jsonAPI,
  jsonAPIResourceActionSet,
} from '../index';
import { fetch } from '../JSONAPIClient/fetch';
import { APIActionStatus } from '../types';
jest.mock('../JSONAPIClient/fetch');

interface IUser {
  name: string;
  email: string;
}

interface IHome {
  name: string;
  streetAddress: string;
  city: string;
  state: string;
}

interface IAPISystem {
  users: IUser;
  homes: IHome;
}

interface ITestState extends IGlobalState<IAPISystem> {
  testStateField: boolean;
}

const apiRoot = {
  links: {
    homes: {
      self: '/api/homes',
      type: 'homes',
    },
    users: {
      self: '/api/users',
      types: 'users',
    },
  },
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
  data: [mockData('1'), mockData('2')],
  meta: {
    firstPage: '/api/users/page[size]=2&page[page]=1',
    lastPage: '/api/users?page[size]=2&page[page]=10',
    nextPage: 'api/users?page[size]=2&page[page]=2',
    prevPage: null,
    self: '/api/users?page[size]=2&page[page]=1',
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

const mockFetch = fetch as jest.Mock;

mockFetch.mockImplementation((url) => {
  switch (url) {
    case 'https://example.com/api':
      return Promise.resolve({
        json: () => Promise.resolve(apiRoot),
        ok: true,
      });
    case 'https://example.com/api/users':
      return Promise.resolve({
        json: () => Promise.resolve(multiPayload),
        ok: true,
      });
    case 'https://example.com/api/users/1':
      return Promise.resolve({
        json: () => Promise.resolve(singlePayload()),
        ok: true,
      });
    default:
      return Promise.resolve({
        json: () => Promise.resolve({ errors: [{
          code: '404',
          description: 'Request resource not found.',
          status: 'Not Found',
        }]}),
        ok: false,
      });
  }
});

const TEST_ACTION = 'TEST_ACTION';
type TEST_ACTION = typeof TEST_ACTION;

const testStateField = (state = false, _: { type: TEST_ACTION }) => {
  return !state
}

const userActions = jsonAPIResourceActionSet<{users: IUser}>('users');

describe('test store', () => {
  const store = () => {
    const apiResources = apiResourcesFactory(initAPIResources('users', 'homes'));
    return createStore(
      combineReducers<ITestState>({
        apiResources,
        testStateField,
      }),
      applyMiddleware(jsonAPI('https://example.com/api', 'https://example.com', fetch)),
    )
  };

  beforeEach(() => {
    mockFetch.mockClear();
  })

  it('should exist after instantiation', () => {
    expect(store()).not.toBe(null);
  });

  it('should dispatch and make a call to users', async () => {
    const testStore = store();
    await testStore.dispatch(userActions.list());
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/api/users',
      expect.objectContaining({
        headers: expect.any(Object),
        method: 'GET',
      }),
    );
    expect(testStore.getState().apiResources.users).toEqual(expect.objectContaining({
      pagingMeta: {
        firstPage: '/api/users/page[size]=2&page[page]=1',
        lastPage: '/api/users?page[size]=2&page[page]=10',
        nextPage: 'api/users?page[size]=2&page[page]=2',
        prevPage: null,
        self: '/api/users?page[size]=2&page[page]=1',
      },
      resources: expect.objectContaining({
        '1': expect.any(Object),
        '2': expect.any(Object),
      }),
      status: APIActionStatus.SUCCEEDED,
    }));
  });

  it('should dispatch and make a call to users/1', async () => {
    const testStore = store();
    await testStore.dispatch(userActions.show({id: '1'}));
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/api/users/1',
      expect.objectContaining({
        headers: expect.any(Object),
        method: 'GET',
      }),
    );

    expect(testStore.getState().apiResources.users).toEqual(expect.objectContaining({
      resources: expect.objectContaining({
        '1': expect.objectContaining({
          resource: expect.objectContaining({
            attributes: expect.any(Object),
            id: '1',
            relationships: expect.any(Object),
            type: 'users',
          }),
          status: APIActionStatus.SUCCEEDED,
        }),
      }),
    }));
  });
});
