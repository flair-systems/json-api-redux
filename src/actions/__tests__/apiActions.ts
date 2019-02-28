import 'jest';

import { ActionCreator } from 'redux';

import {
  apiAction,
  APIActionThunk,
} from '../apiActions';

import { APIActionStatus, IGlobalState } from '../../types';

import { JSONAPIClient } from '../../JSONAPIClient';
import { IJSONAPIDocument } from '../../JSONAPIClient/types';
jest.mock('../../JSONAPIClient');

const TEST_ACTION = 'TEST_ACTION';
type TEST_ACTION = typeof TEST_ACTION;

interface IAsyncMock {
  string: string;
}

interface IAsyncMockSystem {
  'async-mock': IAsyncMock
}

type TestActionThunk = APIActionThunk<TEST_ACTION, IAsyncMockSystem>;

const mockData: IJSONAPIDocument<'async-mock', IAsyncMock> = {
  attributes: { string: 'string' },
  id: '1',
  relationships: {},
  type: 'async-mock',
};

const asyncMock = jest.fn()

const testAction: ActionCreator<TestActionThunk> = apiAction<TEST_ACTION, IAsyncMockSystem>(
  TEST_ACTION,
  APIActionStatus.READING,
  'async-mock',
  (_1: any, _2: any, inputArg: string) => asyncMock(inputArg),
)

const client = Promise.resolve(new JSONAPIClient({
  links: {
    'async-mock': {
      self: '/api/async-mock',
      type: 'async-mock',
    },
  },
}));

const state = (): IGlobalState<IAsyncMockSystem> => {
  return {
    apiResources: {
      'async-mock': {
        resources: {
          '1': {
            resource: mockData,
            status: APIActionStatus.SUCCEEDED,
          },
        },
        status: APIActionStatus.SUCCEEDED,
      },
    },
  };
};

describe('apiAction creator', () => {
  describe('successful action', () => {
    asyncMock.mockReset();
    beforeEach(() => {
      asyncMock.mockResolvedValue({
        data: mockData,
        meta: {
          self: '/api/async-mock/1',
        },
      });
    });

    it('should dispatch started action', async () => {
      const dispatch = jest.fn()
      ;
      await testAction({id: '1'})(dispatch, state, client);
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        resourceID: '1',
        resourceType: 'async-mock',
        status: APIActionStatus.READING,
        type: TEST_ACTION,
      }));
    });

    it('should dispatch succeeded action', async () => {
      const dispatch = jest.fn();
      await testAction({id: '1'})(dispatch, state, client);
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        payload: expect.objectContaining({
          data: expect.objectContaining(mockData),
        }),
        resourceID: '1',
        resourceType: 'async-mock',
        status: APIActionStatus.SUCCEEDED,
        type: TEST_ACTION,
      }));
    });

    it('should called the async function', async () => {
      const dispatch = jest.fn();
      await testAction({id: '1'})(dispatch, state, client);
      expect(asyncMock).toHaveBeenCalledWith({id: '1'});
    });
  });

  describe('unsuccessful action', () => {
    beforeEach(() => {
      asyncMock.mockRejectedValue(new Error('This Failed'));
    });

    it('should dispatch started action', async () => {
      const dispatch = jest.fn();
      await testAction({id: '1'})(dispatch, state, client);
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        resourceID: '1',
        resourceType: 'async-mock',
        status: APIActionStatus.READING,
        type: TEST_ACTION,
      }));
    });

    it('should dispatch failed action', async () => {
      const dispatch = jest.fn();
      await testAction({id: '1'})(dispatch, state, client);
      expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        payload: expect.any(Error),
        resourceID: '1',
        resourceType: 'async-mock',
        status: APIActionStatus.FAILED,
        type: TEST_ACTION,
      }));
    });
  });
});
