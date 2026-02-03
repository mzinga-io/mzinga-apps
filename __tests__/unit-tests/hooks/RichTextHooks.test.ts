import dataMock from "../../../__mocks__/dataMock";
import { RichTextHooks } from "../../../src/hooks/RichTextHooks";
describe("hooks", () => {
  describe("RichTextHooks", () => {
    let richTextHooksConfirmationMessage: RichTextHooks;
    let richTextHooksEmails: RichTextHooks;
    beforeEach(() => {
      richTextHooksConfirmationMessage = new RichTextHooks(
        "confirmationMessage",
        "children",
      );
      richTextHooksEmails = new RichTextHooks("emails", "message");
    });
    it("Should serialize 'confirmationMessage' content to html", async () => {
      const data = await richTextHooksConfirmationMessage.beforeChange[0](
        dataMock.RichTextHooks.incomingPayload,
      );
      const result = data.confirmationMessage[0];
      expect(result).toHaveProperty("serialized");
      expect(result.serialized).toHaveProperty("html");
      expect(result.serialized.internalLinks).toHaveLength(0);
      expect(result.serialized.html).toContain("sample_text");
    });
    it("Should serialize 'emails' content to html", async () => {
      const data = await richTextHooksEmails.beforeChange[0](
        dataMock.RichTextHooks.incomingPayload,
      );
      const result = data.emails[0];
      expect(result).toHaveProperty("serialized");
      expect(result.serialized).toHaveProperty("html");
      expect(result.serialized.html).toContain(
        '<a href="https://www.mzinga.io/"',
      );
    });
  });
});
