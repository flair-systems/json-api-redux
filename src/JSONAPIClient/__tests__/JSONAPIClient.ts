import 'jest';

import { fetch, Headers } from '../fetch';
import { JSONAPIClient } from '../JSONAPIClient';
import { IAPIRoot, IJSONAPIResponse  } from '../types';

jest.mock('../fetch')

interface IResponse {
  name: string;
}

interface IUser {
  name: string;
  email: string;
}

const apiRoot : IAPIRoot<{responses: IResponse, users: IUser}> = {
  links: {
    responses: {
      self: 'api/responses',
      type: 'responses',
    },
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

    const client = new JSONAPIClient<{users: IUser}>(apiRoot, mockFetch, apiPrefix);

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
  });

  describe('paging responses', () => {
    const response: IJSONAPIResponse<'responses', IResponse> = {
      data: [
        {
          attributes: {
            name: 'An HTTP Request',
          },
          id: '1',
          relationships: {},
          type: 'responses',
        },
      ],
      meta: {
        firstPage: '/api/responses/page[size]=1&page[page]=1',
        lastPage: '/api/responses?page[size]=1&page[page]=10',
        nextPage: '/api/responses?page[size]=1&page[page]=2',
        prevPage: null,
        self: '/api/responses?page[size]=1&page[page]=1',
      },
    };

    const mockFetch = Promise.resolve({
      json: () => Promise.resolve(response),
      ok: true,
    });

    const reqMock = jest.fn();

    const client = new JSONAPIClient<{responses: IResponse}>(apiRoot, reqMock, apiPrefix);

    beforeEach(() => {
      reqMock.mockReset();
      reqMock.mockResolvedValue(mockFetch);
    });

    describe('lastPage', () => {
      it('should make a client request to the URL at lastPage in the meta object', async () => {
        await client.lastPage(response.meta);
        expect(reqMock).toHaveBeenCalledWith(
          response.meta.lastPage,
          expect.objectContaining({ method: 'GET' }),
        );
      })

      it('should raise an error if meta lastPage is null', () => {
        const oldPage = response.meta.lastPage;
        response.meta.lastPage = null;
        expect(client.lastPage(response.meta)).rejects.toThrowError('No link to follow for lastPage');
        response.meta.lastPage = oldPage;
      });
    });

    describe('firstPage', () => {
      it('should make a client request to the URL at firstpage in the meta object', async () => {
        await client.firstPage(response.meta);
        expect(reqMock).toHaveBeenCalledWith(
          response.meta.firstPage,
          expect.objectContaining({ method: 'GET' }),
        );
      })

      it('should raise an error if meta firstPage is null', () => {
        const oldPage = response.meta.firstPage;
        response.meta.firstPage = null;
        expect(client.firstPage(response.meta)).rejects.toThrowError('No link to follow for firstPage');
        response.meta.firstPage = oldPage;
      });
    });

    describe('nextPage', () => {
      it('should make a client request to the URL at next page in the meta object', async () => {
        await client.nextPage(response.meta);
        expect(reqMock).toHaveBeenCalledWith(
          response.meta.nextPage,
          expect.objectContaining({ method: 'GET' }),
        );
      })

      it('should raise an error if meta nextPage is null', () => {
        const oldPage = response.meta.nextPage;
        response.meta.nextPage = null;
        expect(client.nextPage(response.meta)).rejects.toThrowError('No link to follow for nextPage');
        response.meta.nextPage = oldPage;
      });
    });

    describe('prevPage', () => {
      it('should make a client request to the URL at prevpage in the meta object', async () => {
        response.meta.prevPage = '/api/responses/page[size]=1&page[page]=1';
        await client.prevPage(response.meta);
        expect(reqMock).toHaveBeenCalledWith(
          response.meta.prevPage,
          expect.objectContaining({ method: 'GET' }),
        );
        response.meta.prevPage = null;
      })

      it('should raise an error if meta prevPage is null', () => {
        expect(client.prevPage(response.meta)).rejects.toThrowError('No link to follow for prevPage');
      });
    });
  });
});
