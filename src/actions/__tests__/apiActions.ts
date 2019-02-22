import 'jest';

import { ActionCreator } from 'redux';

import {
  apiAction,
  APIActionStatus,
  APIActionThunk,
  IJSONAPIState,
  IJSONAPIStateResource,
} from '../apiActions';

import { JSONAPIClient } from '../../JSONAPIClient';
jest.mock('../../JSONAPIClient');

const TEST_ACTION = 'TEST_ACTION';
type TEST_ACTION = typeof TEST_ACTION;

type TestActionThunk = APIActionThunk<TEST_ACTION, string>;

const mockData = {
  attributes: 'string',
  id: '1',
  type: 'async-mock',
};

const asyncMock = jest.fn()

const testAction: ActionCreator<TestActionThunk> = apiAction<TEST_ACTION, string>(
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

const state = (): IJSONAPIState => {
  return {
    apiResources: (_: string): IJSONAPIStateResource<any> => {
      return {
        loading: false,
        resources: {
          '1': {
            loading: false,
            resource: mockData,
          },
        },
      };
    },
  }
}

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
      const dispatch = jest.fn();
      await testAction('input')(dispatch, state, client);
      expect(dispatch).toHaveBeenCalledWith({
        status: APIActionStatus.IN_PROGRESS,
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
        status: APIActionStatus.IN_PROGRESS,
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
