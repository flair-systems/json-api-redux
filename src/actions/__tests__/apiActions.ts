import 'jest';

import { ActionCreator } from 'redux';

import {
  APIReadActionThunk,
  readApiAction,
} from '../apiActions';

import { APIActionStatus, IJSONAPIState } from '../../types';

import { JSONAPIClient } from '../../JSONAPIClient';
jest.mock('../../JSONAPIClient');

const TEST_ACTION = 'TEST_ACTION';
type TEST_ACTION = typeof TEST_ACTION;

type TestActionThunk = APIReadActionThunk<TEST_ACTION, string>;

const mockData = {
  attributes: 'string',
  id: '1',
  relationships: {},
  type: 'async-mock',
};

const asyncMock = jest.fn()

const testAction: ActionCreator<TestActionThunk> = readApiAction<TEST_ACTION, string>(
  TEST_ACTION,
  (_1, _2, inputArg: string) => asyncMock(inputArg),
)

const client = new JSONAPIClient({
  links: {
    'async-mock': {
      self: '/api/async-mock',
      type: 'async-mock',
    },
  },
});

const state = (): {[key: string]: IJSONAPIState<string>} => {
  return {
    'async-mock': {
      status: APIActionStatus.SUCCEEDED,
      resources: {
        '1': {
          resource: mockData,
          status: APIActionStatus.SUCCEEDED,
        },
      },
    },
  };
};

describe('readApiAction creator', () => {
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
      await testAction('input')(dispatch, state, client);
      expect(dispatch).toHaveBeenCalledWith({
        status: APIActionStatus.READING,
        type: TEST_ACTION,
      });
    });

    it('should dispatch succeeded action', async () => {
      const dispatch = jest.fn();
      await testAction('input')(dispatch, state, client);
      expect(dispatch).toHaveBeenCalledWith({
        payload: expect.objectContaining({
          data: expect.objectContaining(mockData),
        }),
        status: APIActionStatus.SUCCEEDED,
        type: TEST_ACTION,
      });
    });

    it('should called the async function', async () => {
      const dispatch = jest.fn();
      await testAction('input')(dispatch, state, client);
      expect(asyncMock).toHaveBeenCalledWith('input');
    });
  });

  describe('unsuccessful action', () => {
    beforeEach(() => {
      asyncMock.mockRejectedValue(new Error('This Failed'));
    });

    it('should dispatch started action', async () => {
      const dispatch = jest.fn();
      await testAction('input')(dispatch, state, client);
      expect(dispatch).toHaveBeenCalledWith({
        status: APIActionStatus.READING,
        type: TEST_ACTION,
      });
    });

    it('should dispatch failed action', async () => {
      const dispatch = jest.fn();
      await testAction('input')(dispatch, state, client);
      expect(dispatch).toHaveBeenCalledWith({
        payload: expect.any(Error),
        status: APIActionStatus.FAILED,
        type: TEST_ACTION,
      });
    });
  });
});
