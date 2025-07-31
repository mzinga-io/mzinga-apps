import { Block } from "payload/types";
import { Slugs } from "../collections/Slugs";
import richText from "../fields/richText";

export const FormBlock: Block = {
  slug: Slugs.Blocks.EmbeddedForm,
  fields: [
    richText({}),
    {
      name: "form",
      type: "relationship",
      relationTo: "forms",
      required: true,
    },
  ],
};
