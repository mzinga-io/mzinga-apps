import { Block } from "payload/types";
import { Slugs } from "../collections/Slugs";

export const MediaBlock: Block = {
  slug: Slugs.Blocks.Media,
  graphQL: {
    singularName: "MediaBlock",
  },
  labels: {
    singular: "Media Block",
    plural: "Media Blocks",
  },
  fields: [
    {
      name: "media",
      label: "Media",
      type: "upload",
      relationTo: Slugs.Media,
    },
    {
      name: "video",
      label: "Video",
      type: "upload",
      relationTo: Slugs.Videos,
    },
    {
      name: "mediaGallery",
      label: "Media Gallery",
      type: "relationship",
      relationTo: Slugs.MediaGalleries,
    },
  ],
};
