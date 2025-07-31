import { Field } from "payload/types";
import { Slugs } from "../collections/Slugs";

export const TagsField = {
  Name: "tags",
  Get(partialOverride?: any): Field {
    return {
      ...(partialOverride || {}),
      name: TagsField.Name,
      index: true,
      type: "relationship",
      relationTo: Slugs.Tags,
      filterOptions: {
        archived: { equals: false },
      },
      hasMany: true,
    };
  },
};
