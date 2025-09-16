import {
  RichTextElement,
  RichTextLeaf,
  slateEditor,
} from "@mzinga/richtext-slate";
import { RichTextField } from "mzinga/dist/fields/config/types";
import deepMerge from "../../utils/deepMerge";
import link from "../link";
import elements from "./elements";
import leaves from "./leaves";

type RichText = (
  overrides?: Partial<RichTextField>,
  additions?: {
    elements?: RichTextElement[];
    leaves?: RichTextLeaf[];
  }
) => RichTextField;

const richText: RichText = (
  overrides,
  additions = {
    elements: [],
    leaves: [],
  }
) =>
  deepMerge<RichTextField, Partial<RichTextField>>(
    {
      name: "richText",
      type: "richText",
      editor: slateEditor({
        admin: {
          upload: {
            collections: {
              media: {
                fields: [
                  {
                    type: "richText",
                    name: "caption",
                    label: "Caption",
                    editor: slateEditor({
                      admin: {
                        elements: [...elements],
                        leaves: [...leaves],
                      },
                    }),
                  },
                  {
                    type: "radio",
                    name: "alignment",
                    label: "Alignment",
                    options: [
                      {
                        label: "Left",
                        value: "left",
                      },
                      {
                        label: "Center",
                        value: "center",
                      },
                      {
                        label: "Right",
                        value: "right",
                      },
                    ],
                  },
                  {
                    name: "enableLink",
                    type: "checkbox",
                    label: "Enable Link",
                  },
                  link({
                    appearances: false,
                    disableLabel: true,
                    overrides: {
                      admin: {
                        condition: (_, data) => Boolean(data?.enableLink),
                      },
                    },
                  }),
                ],
              },
            },
          },
          elements: [...elements, ...(additions.elements || [])],
          leaves: [...leaves, ...(additions.leaves || [])],
        },
      }),
    },
    overrides
  );

export default richText;
