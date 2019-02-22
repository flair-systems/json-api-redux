import 'jest';

import { initialState, reduceAPIResource } from '../index';

import { APIAction } from '../../actions';
import { APIActionStatus, IJSONAPIState } from '../../types';
import * as constants from '../../actions/constants';

import { JSONAPIClient } from '../../JSONAPIClient';
jest.mock('../../JSONAPIClient');

import { PageableResponse } from '../../JSONAPIClient/PageableResponse';

interface IUser {
  email: string;
  name: string;
}

const mockData = {
  attributes: {
    email: 'ed@flair.co',
    name: 'Ed Paget',
  },
  id: '1',
  type: 'users',
};

const multiPayload = {
  data: [mockData],
  meta: {
    firstPage: '/api/users/page[size]=1&page[page]=1',
    lastPage: '/api/users?page[size]=1&page[page]=10',
    nextPage: '/api/users?page[size]=1&page[page]=2',
    prevPage: null,
    self: '/api/users?page[size]=1&page[page]=1',
  },
};

// const singlePayload = {
//   data: mockData,
//   meta: {
//     self: '/api/users?page[size]=1&page[page]=1',
//   },
// };

const client = new JSONAPIClient({
  links: {
    users: {
      self: '/api/users',
      type: 'users',
    },
  },
});

const listReadStart : APIAction<IUser> = {
  status: APIActionStatus.READING,
  type: constants.LIST_JSONAPI_RESOURCE,
}

const listReadSucceed : APIAction<IUser> = {
  payload: new PageableResponse<IUser>(client, multiPayload),
  status: APIActionStatus.SUCCEEDED,
  type: constants.LIST_JSONAPI_RESOURCE,
}

// const listReadFailed = {
//   payload: new Error('Failed'),
//   status: APIActionStatus.FAILED,
//   type: constants.LIST_JSONAPI_RESOURCE,
// }

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
          resource: mockData,
          status: APIActionStatus.SUCCEEDED,
        }),
      }));
    });
  });
});
