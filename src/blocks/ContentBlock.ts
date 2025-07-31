import { Block } from "payload/types";
import { Slugs } from "../collections/Slugs";
import richText from "../fields/richText";
import HR from "../fields/richText/hr";

export const ContentBlock: Block = {
  slug: Slugs.Blocks.Content,
  labels: {
    singular: "Content",
    plural: "Content Blocks",
  },
  fields: [
    {
      name: "columns",
      type: "array",
      minRows: 1,
      labels: {
        singular: "Column",
        plural: "Columns",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "width",
              label: "Column Width",
              type: "select",
              defaultValue: "full",
              required: true,
              options: [
                {
                  label: "One Third",
                  value: "oneThird",
                },
                {
                  label: "Half",
                  value: "half",
                },
                {
                  label: "Two Thirds",
                  value: "twoThirds",
                },
                {
                  label: "Full Width",
                  value: "full",
                },
              ],
              admin: {
                width: "50%",
              },
            },
            {
              name: "alignment",
              label: "Alignment",
              type: "select",
              defaultValue: "left",
              required: true,
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
              admin: {
                width: "50%",
              },
            },
          ],
        },
        richText(
          {},
          {
            elements: ["ol", "ul", "indent", HR],
          }
        ),
        {
          name: "serialized",
          type: "group",
          admin: {
            hidden: true,
          },
          fields: [
            {
              name: "html",
              type: "text",
            },
          ],
        },
      ],
    },
  ],
};

export default ContentBlock;
