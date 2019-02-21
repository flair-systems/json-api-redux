import 'jest';
import { PageableResponse } from '../PageableResponse';
import { IJSONAPIResponse } from '../types';

export interface IResponse {
  name: string;
}

const response : IJSONAPIResponse<IResponse> = {
  data: [
    {
      id: '1',
      type: 'responses',
      attributes: {
        name: 'An HTTP Request',
      },
    },
  ],
  meta: {
    self: '/api/responses/page[size]=1&page[page]=1',
    prevPage: null,
    nextPage: '/api/responses?page[size]=1&page[page]=2',
    lastPage: '/api/responses?page[size]=1&page[page]=10',
    firstPage: '/api/responses/page[size]=1&page[page]=1',
  }
}

const client = {
  makeDirectRequest: jest.fn((url, method) => {
    return Promise.resolve(response);
  }),
};

const pagedResponse : PageableResponse<IResponse> = new PageableResponse(client, response);

describe('PageableResponse', () => {
  describe('data', () => {
    it('should return the data attribute of the response', () => {
      expect(pagedResponse.data).toContainEqual(expect.objectContaining({
        attributes: expect.objectContaining({
          name: expect.any(String),
        }),
        id: expect.any(String),
        type: expect.any(String),
      }));
    });
  });

  describe('lastPage', () => {
    it('should make a client request to the URL at lastPage in the meta object', async () => {
      await pagedResponse.lastPage();
      expect(client.makeDirectRequest).toHaveBeenCalledWith(response.meta.lastPage, 'GET');
    })

    it('should raise an error if meta lastPage is null', () => {
      const oldPage = response.meta.lastPage;
      response.meta.lastPage = null;
      expect(pagedResponse.lastPage()).rejects.toThrowError('No link to follow for lastPage');
      response.meta.lastPage = oldPage;
    });
  });

  describe('firstPage', () => {
    it('should make a client request to the URL at firstpage in the meta object', async () => {
      await pagedResponse.firstPage();
      expect(client.makeDirectRequest).toHaveBeenCalledWith(response.meta.firstPage, 'GET');
    })

    it('should raise an error if meta firstPage is null', () => {
      const oldPage = response.meta.firstPage;
      response.meta.firstPage = null;
      expect(pagedResponse.firstPage()).rejects.toThrowError('No link to follow for firstPage');
      response.meta.firstPage = oldPage;
    });
  });

  describe('nextPage', () => {
    it('should make a client request to the URL at next page in the meta object', async () => {
      await pagedResponse.nextPage();
      expect(client.makeDirectRequest).toHaveBeenCalledWith(response.meta.nextPage, 'GET');
    })

    it('should raise an error if meta nextPage is null', () => {
      const oldPage = response.meta.nextPage;
      response.meta.nextPage = null;
      expect(pagedResponse.nextPage()).rejects.toThrowError('No link to follow for nextPage');
      response.meta.nextPage = oldPage;
    });
  });

  describe('prevPage', () => {
    it('should make a client request to the URL at prevpage in the meta object', async () => {
      response.meta.prevPage = '/api/responses/page[size]=1&page[page]=1';
      await pagedResponse.prevPage();
      expect(client.makeDirectRequest).toHaveBeenCalledWith(response.meta.prevPage, 'GET');
      response.meta.prevPage = null;
    })

    it('should raise an error if meta prevPage is null', () => {
      expect(pagedResponse.prevPage()).rejects.toThrowError('No link to follow for prevPage');
    });
  });
});
