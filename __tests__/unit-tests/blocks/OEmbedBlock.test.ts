import type { FieldBase } from "payload/types";
import { oEmbedBlock } from "../../../src/blocks/oEmbedBlock";

describe("blocks", () => {
  describe("oEmbedBlock", () => {
    it("oEmbedURLPreview.admin.condition should return boolean value", () => {
      const oEmbedURLPreviewField = oEmbedBlock.fields.find(
        (field) => (field as FieldBase).name === "oEmbedURLPreview"
      );
      expect(oEmbedURLPreviewField).toBeDefined();
      const conditionResult = (oEmbedURLPreviewField as any).admin.condition(
        {},
        {
          oEmbedURL: "https://my-oembed-com",
        }
      );
      expect(conditionResult).toBeTruthy();
    });
  });
});
