import { Slugs } from "../collections/Slugs";
import { TextUtils } from "../utils/TextUtils";

export const ContentBlockHooks = {
  beforeChange: [
    async ({ data }) => {
      const { body } = data;
      for (const part of body || []) {
        if (part.blockType === Slugs.Blocks.Content) {
          for (const column of part.columns.filter((c) => c.richText)) {
            column.serialized = {
              html: TextUtils.Serialize(column.richText),
              internalLinks: TextUtils.GetInternalLinks(column.richText),
            };
          }
        }
      }
      return data;
    },
  ],
};
