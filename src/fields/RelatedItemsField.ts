import { Field } from "payload/types";
import { Slugs } from "../collections/Slugs";

export const RelatedItemsField = {
  Name: "relatedItems",
  Get(): Field {
    return {
      name: RelatedItemsField.Name,
      type: "relationship",
      relationTo: [Slugs.Stories, Slugs.Videos, Slugs.MediaGalleries],
      hasMany: true,
    };
  },
};
