import 'jest';

import { ActionCreator } from 'redux';

import {
  apiAction,
  APIActionThunk,
} from '../apiActions';

import { APIActionStatus, IJSONAPIState } from '../../types';

import { JSONAPIClient } from '../../JSONAPIClient';
jest.mock('../../JSONAPIClient');

const TEST_ACTION = 'TEST_ACTION';
type TEST_ACTION = typeof TEST_ACTION;

type TestActionThunk = APIActionThunk<TEST_ACTION, string>;

const mockData = {
  attributes: 'string',
  id: '1',
  relationships: {},
  type: 'async-mock',
};

const asyncMock = jest.fn()

const testAction: ActionCreator<TestActionThunk> = apiAction<TEST_ACTION, string>(
  TEST_ACTION,
  APIActionStatus.READING,
  'async-mock',
  (_1, _2, inputArg: string) => asyncMock(inputArg),
)

const client = Promise.resolve(new JSONAPIClient({
  links: {
    'async-mock': {
      self: '/api/async-mock',
      type: 'async-mock',
    },
  },
}));

const state = (): {[key: string]: IJSONAPIState<string>} => {
  return {
    'async-mock': {
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
