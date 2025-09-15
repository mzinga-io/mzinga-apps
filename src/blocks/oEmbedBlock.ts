import type { Block } from "mzinga/types";
import { Slugs } from "../collections/Slugs";
import oEmbedURLField from "../fields/oEmbedURLField";

export const oEmbedBlock: Block = {
  slug: Slugs.Blocks.oEmbed,
  graphQL: {
    singularName: "oEmbed",
  },
  labels: {
    singular: "oEmbed",
    plural: "oEmbeds",
  },
  fields: [
    {
      name: "oEmbedURL",
      type: "text",
      admin: {
        description:
          "Currently available for Twitter, YouTube, Flickr, and Vimeo platforms",
      },
      required: true,
    },
    {
      name: "oEmbedURLPreview",
      type: "ui",
      admin: {
        condition: (_, siblingData) => {
          return siblingData.oEmbedURL;
        },
        components: {
          Field: oEmbedURLField,
        },
      },
    },
  ],
};
