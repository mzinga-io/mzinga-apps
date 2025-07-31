import { bySlugEndpoints } from "../../../src/endpoints/bySlugEndpoints";

describe("endpoints", () => {
  describe("bySlugEndpoints", () => {
    const firstEndpoint = bySlugEndpoints[0];
    const payloadFindMock = jest.fn();
    it("handler should return 404 for non-existing slug", async () => {
      payloadFindMock.mockReturnValue(undefined);
      const statusMock = jest.fn();
      const sendMock = jest.fn();
      const res = {
        status: statusMock,
        send: sendMock,
      };
      statusMock.mockReturnValue(res);
      await firstEndpoint.handler(
        {
          query: {
            locale: "it-IT",
          },
          params: { slug: "non-existing-slug" },
          collection: {
            config: {
              slug: "collection-slug",
            },
          },
          payload: {
            find: payloadFindMock,
          },
        },
        res
      );
      expect(payloadFindMock.mock.calls).toHaveLength(1);
      const payloadArgs = payloadFindMock.mock.calls[0][0];
      expect(payloadArgs.collection).toBe("collection-slug");
      expect(payloadArgs.locale).toBe("it-IT");
      expect(payloadArgs.where.slug.equals).toBe("non-existing-slug");
      expect(statusMock.mock.calls).toHaveLength(1);
      expect(statusMock.mock.calls[0][0]).toBe(404);
      expect(sendMock.mock.calls).toHaveLength(1);
      expect(sendMock.mock.calls[0][0]).toBe("Not found");
    });
    it("handler should return result.docs[0] for existing slug", async () => {
      payloadFindMock.mockReturnValue({
        docs: [
          {
            itemFound: 1,
          },
        ],
      });
      const statusMock = jest.fn();
      const sendMock = jest.fn();
      const jsonMock = jest.fn();
      await firstEndpoint.handler(
        {
          query: {
            locale: "it-IT",
          },
          params: { slug: "existing-slug" },
          collection: {
            config: {
              slug: "collection-slug",
            },
          },
          payload: {
            find: payloadFindMock,
          },
        },
        {
          status: statusMock,
          send: sendMock,
          json: jsonMock,
        }
      );
      expect(payloadFindMock.mock.calls).toHaveLength(1);
      const payloadArgs = payloadFindMock.mock.calls[0][0];
      expect(payloadArgs.collection).toBe("collection-slug");
      expect(payloadArgs.locale).toBe("it-IT");
      expect(payloadArgs.where.slug.equals).toBe("existing-slug");
      expect(statusMock.mock.calls).toHaveLength(0);
      expect(sendMock.mock.calls).toHaveLength(0);
      expect(jsonMock.mock.calls).toHaveLength(1);
      expect(jsonMock.mock.calls[0][0].itemFound).toBe(1);
    });
  });
});
