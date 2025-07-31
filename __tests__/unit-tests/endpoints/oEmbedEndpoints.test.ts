import { oEmbedEndpoints } from "../../../src/endpoints/oEmbedEndpoints";
import https from "https";

jest.mock("https");

describe("endpoints", () => {
  describe("oEmbedEndpoints", () => {
    const firstEndpoint = oEmbedEndpoints[0];
    const httpsGetMock = https.get as jest.Mock;
    beforeEach(() => {
      httpsGetMock.mockReturnValue({
        on: jest.fn(),
      });
    });
    afterEach(() => {
      httpsGetMock.mockClear();
    });
    it("handler should return 401 for missing user", async () => {
      const statusMock = jest.fn();
      await firstEndpoint.handler(
        {
          query: {},
        },
        {
          status: statusMock,
        }
      );
      expect(statusMock.mock.calls).toHaveLength(1);
      expect(statusMock.mock.calls[0][0]).toBe(401);
    });
    it("handler should return 400 for missing url", async () => {
      const statusMock = jest.fn();
      await firstEndpoint.handler(
        {
          query: {},
          user: {},
        },
        {
          status: statusMock,
        }
      );
      expect(statusMock.mock.calls).toHaveLength(1);
      expect(statusMock.mock.calls[0][0]).toBe(400);
    });
    it("https should request vimeo.com URL and return statusCode: 500", async () => {
      const statusMock = jest.fn();
      httpsGetMock.mockImplementation((_, fnWithReponse) => {
        fnWithReponse({
          statusCode: 404,
        });
        return {
          on: jest.fn(),
        };
      });
      await firstEndpoint.handler(
        {
          query: {
            url: "https://vimeo.com/not-valid-id",
          },
          user: {},
        },
        {
          status: statusMock,
        }
      );
      expect(httpsGetMock.mock.calls).toHaveLength(1);
      expect(httpsGetMock.mock.calls[0][0]).toBe(
        "https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2Fnot-valid-id&width=480&height=360"
      );
      expect(statusMock.mock.calls).toHaveLength(1);
      expect(statusMock.mock.calls[0][0]).toBe(500);
    });
    it("https should request flickr.com URL", async () => {
      const statusMock = jest.fn();
      httpsGetMock.mockImplementation((_, fnWithReponse) => {
        fnWithReponse({
          statusCode: 200,
          setEncoding: jest.fn(),
          on: jest.fn(),
        });
        return {
          on: jest.fn(),
        };
      });
      await firstEndpoint.handler(
        {
          query: {
            url: "http://www.flickr.com/photos/bees/2341623661/",
          },
          user: {},
        },
        {
          status: statusMock,
        }
      );
      expect(httpsGetMock.mock.calls).toHaveLength(1);
      expect(httpsGetMock.mock.calls[0][0]).toBe(
        "https://www.flickr.com/services/oembed/?format=json&url=http%3A%2F%2Fwww.flickr.com%2Fphotos%2Fbees%2F2341623661%2F"
      );
    });
    it("https should request youtube.com URL", async () => {
      const statusMock = jest.fn();
      const responseOnMock = jest.fn();
      httpsGetMock.mockImplementation((_, fnWithReponse) => {
        fnWithReponse({
          statusCode: 200,
          setEncoding: jest.fn(),
          on: responseOnMock,
        });
        return {
          on: jest.fn(),
        };
      });
      await firstEndpoint.handler(
        {
          query: {
            url: "https://youtube.com/watch?v=M3r2XDceM6A",
          },
          user: {},
        },
        {
          status: statusMock,
        }
      );
      expect(httpsGetMock.mock.calls).toHaveLength(1);
      expect(httpsGetMock.mock.calls[0][0]).toBe(
        "https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3DM3r2XDceM6A&maxwidth=640&maxheight=400"
      );
    });
  });
});
