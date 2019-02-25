import 'jest';

import { fetch, Headers } from '../fetch';
import { JSONAPIClient } from '../JSONAPIClient';
import { IAPIRoot } from '../types';

jest.mock('../fetch')

interface IUser {
  name: string;
  email: string;
}

const apiRoot : IAPIRoot = {
  links: {
    users: {
      self: '/api/users',
      type: 'users',
    },
  },
};

const apiPrefix = 'https://example.com';

describe('JSONAPIClient', () => {
  describe('list', () => {
    const mockFetch = fetch as jest.Mock;
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      json: () => {
        return Promise.resolve({
          data: [{
            attributes: {
              'email': 'ed@flair.co',
              'name': 'Ed Paget',
            },
            id: '1',
            relationships: {},
            type: 'users',
          }],
          meta: {
            firstPage: '/api/responses?page[size]=1&page[page]=1',
            lastPage: '/api/responses?page[size]=1&page[page]=10',
            nextPage: '/api/responses?page[size]=1&page[page]=3',
            prevPage: '/api/responses?page[size]=1&page[page]=1',
            self: '/api/users?page[size]=1&page[page]=2',
          },
          ok: true,
        });
      },
    });

    const client = new JSONAPIClient(apiRoot, mockFetch, apiPrefix);

    it('should make a request to https://example.com/api/users', async () => {
      await client.list<IUser>('users');
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/api/users',
        expect.objectContaining({
          headers: expect.any(Headers),
          method: 'GET',
        }),
      );
    });
  });

  describe('create', () => {
    const mockFetch = fetch as jest.Mock;
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      json: () => {
        return Promise.resolve({
          data: {
            attributes: {
              'email': 'ed@flair.co',
              'name': 'Ed Paget',
            },
            id: '1',
            relationships: {},
            type: 'users',
          },
          meta: {
            self: '/api/users/1',
          },
        });
      },
      ok: true,
    });

    const client = new JSONAPIClient(apiRoot, fetch, apiPrefix);

    it('should make a post request to https://example.com/api/users', async () => {
      await client.create<IUser>('users', { name: 'Ed Paget', email: 'ed@flair.co' })
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/api/users',
        expect.objectContaining({
          body: expect.stringContaining('"data":'),
          headers: expect.any(Headers),
          method: 'POST',
        }),
      );
    });
  });

  describe('get', () => {
    const mockFetch = fetch as jest.Mock;
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      json: () => {
        return Promise.resolve({
          data: {
            attributes: {
              'email': 'ed@flair.co',
              'name': 'Ed Paget',
            },
            id: '1',
            relationships: {},
            type: 'users',
          },
          meta: {
            self: '/api/users/1',
          },
        });
      },
      ok: true,
    });


    const client = new JSONAPIClient(apiRoot, fetch, apiPrefix);

    it('should make a request to https://example.com/api/users/1', async () => {
      await client.show<IUser>('users', '1');
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/api/users/1',
        expect.objectContaining({
          headers: expect.any(Headers),
          method: 'GET',
        }),
      );
    });

    it('should return the parsed JSON API Document', async () => {
      const resp = await client.show<IUser>('users', '1');
      expect(resp.data).toEqual(expect.objectContaining({
        attributes: expect.objectContaining({
          email: expect.any(String),
          name: expect.any(String),
        }),
        id: expect.any(String),
        type: expect.any(String),
      }));
    });
  })
})
