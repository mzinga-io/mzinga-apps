import { Field, FieldHook } from "payload/types";
import { SlugUtils } from "../utils/SlugUtils";

const slugifyHook: FieldHook = ({ data, value, originalDoc }) => {
  let currentValue = value;
  if (data) {
    currentValue = value === data.id || value === data._id ? "" : value;
  }
  if (originalDoc) {
    currentValue = value === originalDoc._id ? "" : value;
  }
  return SlugUtils.Slugify(
    currentValue || data.name || data.title || data.alt || data.id || data._id
  );
};
export const SlugField = {
  Name: "slug",
  Get(): Field {
    return {
      name: SlugField.Name,
      type: "text",
      index: true,
      admin: {
        position: "sidebar",
      },
      hooks: {
        beforeValidate: [slugifyHook],
        afterRead: [slugifyHook],
      },
    };
  },
};
