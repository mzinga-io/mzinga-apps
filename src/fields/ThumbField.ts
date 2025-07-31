import { Field } from "payload/types";
import { Slugs } from "../collections/Slugs";

export const ThumbField = {
  Name: "thumb",
  Get(): Field {
    return {
      name: ThumbField.Name,
      type: "relationship",
      relationTo: Slugs.Media,
      hasMany: false,
    };
  },
};
