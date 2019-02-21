import 'jest';

import { fetch, Headers } from '../fetch';
import fetchAPIRootAndInitClient  from '../index';
import { JSONAPIClient } from '../JSONAPIClient';

jest.mock('../fetch');
jest.mock('../JSONAPIClient');

const apiRoot = {
  links: {
    users: {
      self: '/api/users',
      type: 'users',
    },
  },
};

describe('fetchAPIRootAndInitClient', () => {
  describe('successful call', () => {
    beforeEach(() => {
      const mockFetch = fetch as jest.Mock;
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(apiRoot),
        ok: true,
      });
    });

    it('should init a new client', async () => {
      const client = await fetchAPIRootAndInitClient('https://example.com/api');
      expect(client).toEqual(expect.any(JSONAPIClient));
    });

    it('should make a fetch request to the provided root URL', async () => {
      await fetchAPIRootAndInitClient('https://example.com/api');
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/api',
        expect.objectContaining({
          headers: expect.any(Headers),
        }),
      );
    });

    it('should set the apiPrefix to the protocol + host of root url when no prefix is supplied', async () => {
      await fetchAPIRootAndInitClient('https://example.com/api');
      expect(JSONAPIClient).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Function),
        'https://example.com',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should set the apiPrefix to the supplied prefix', async () => {
      await fetchAPIRootAndInitClient('https://example.com/api', 'https://example.com/apiPrefix');
      expect(JSONAPIClient).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Function),
        'https://example.com/apiPrefix',
        expect.any(Object),
        expect.any(Object),
      );
    });
  });

  describe('unsuccessful call', () => {
    beforeEach(() => {
      const mockFetch = fetch as jest.Mock;
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(apiRoot),
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
    });

    it('should raise an error', async () => {
      expect(fetchAPIRootAndInitClient('https://example.com/api')).rejects.toThrowError(
        'Failed to GET https://example.com/api. Request returned with status of 404: Not Found.',
      );
    });
  });
});
