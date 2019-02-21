import 'jest';
import { JSONAPIClient } from '../JSONAPIClient';
import { IAPIRoot } from '../types';
import { fetch } from '../fetch';
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
      ok: true,
      json: () => {
        return Promise.resolve({
          data: [{
            id: '1',
            type: 'users',
            attributes: {
              'name': 'Ed Paget',
              'email': 'ed@flair.co',
            },
          }],
          meta: {
            self: '/api/users?page[size]=1&page[page]=2',
            nextPage: '/api/responses?page[size]=1&page[page]=3',
            prevPage: '/api/responses?page[size]=1&page[page]=1',
            firstPage: '/api/responses?page[size]=1&page[page]=1',
            lastPage: '/api/responses?page[size]=1&page[page]=10',
          },
        })
      },
    })

    const client = new JSONAPIClient(apiRoot, mockFetch, apiPrefix);

    it('should make a request to https://example.com/api/users', async () => {
      await client.list<IUser>('users');
      expect(fetch).toHaveBeenCalledWith(expect.objectContaining({
        url: 'https://example.com/api/users',
      }));
    });
  });

  describe('get', () => {
    const mockFetch = fetch as jest.Mock;
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => {
        return Promise.resolve({
          data: {
            id: '1',
            type: 'users',
            attributes: {
              'name': 'Ed Paget',
              'email': 'ed@flair.co',
            },
          },
          meta: {
            self: '/api/users/1',
          },
        })
      },
    });


    const client = new JSONAPIClient(apiRoot, fetch, apiPrefix);

    it('should make a request to https://example.com/api/users/1', async () => {
      await client.show<IUser>('users', '1');
      expect(fetch).toHaveBeenCalledWith(expect.objectContaining({
        url: 'https://example.com/api/users/1',
      }));
    });

    it('should return the parsed JSON API Document', async () => {
      const resp = await client.show<IUser>('users', '1');
      expect(resp.data).toEqual(expect.objectContaining({
        attributes: expect.objectContaining({
          name: expect.any(String),
          email: expect.any(String),
        }),
        id: expect.any(String),
        type: expect.any(String),
      }));
    });
  })
})
