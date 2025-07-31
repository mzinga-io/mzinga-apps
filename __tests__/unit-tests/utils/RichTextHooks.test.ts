import dataMock from "../../../__mocks__/dataMock";
import { RichTextHooks } from "../../../src/hooks/RichTextHooks";
describe("hooks", () => {
  describe("RichTextHooks", () => {
    let richTextHooks: RichTextHooks;
    beforeEach(() => {
      richTextHooks = new RichTextHooks("confirmationMessage", "children");
    });
    it("Should serialize content to html", async () => {
      const data = await richTextHooks.beforeChange[0](
        dataMock.RichTextHooks.incomingPayload
      );
      const result = data.confirmationMessage[0];
      expect(result).toHaveProperty("serialized");
      expect(result.serialized).toHaveProperty("html");
      expect(result.serialized.internalLinks).toHaveLength(0);
      expect(result.serialized.html).toContain("sample_text");
    });
  });
});
