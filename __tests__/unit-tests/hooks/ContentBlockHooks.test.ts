import dataMock from "../../../__mocks__/dataMock";
import { ContentBlockHooks } from "../../../src/hooks/ContentBlockHooks";

describe("hooks", () => {
  describe("ContentBlockHooks", () => {
    it("Should return serialized object", async () => {
      const data = await ContentBlockHooks.beforeChange[0](
        dataMock.ContentBlockHooks.incomingPayload as any
      );
      const result = data.body[0].columns[0];
      expect(result).toHaveProperty("serialized");
      expect(result.serialized).toHaveProperty("html");
      expect(result.serialized.internalLinks).toHaveLength(1);
    });
  });
});
