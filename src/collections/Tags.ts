import { CollectionConfig } from "payload/types";
import { SlugField } from "../fields";
import { Slugs } from "./Slugs";
import { AccessUtils } from "../utils";
const access = new AccessUtils();
const Tags: CollectionConfig = {
  slug: Slugs.Tags,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "id", SlugField.Name, "archived"],
    listSearchableFields: [SlugField.Name],
    group: "Content",
    enableRichTextRelationship: false,
  },
  access: {
    ...access.GetReadAll(),
    ...access.GetEdit(),
  },
  fields: [
    {
      name: "name",
      type: "text",
      localized: true,
    },
    {
      name: "archived",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Archiving filters it from being an option in the entity's collection",
      },
    },
    SlugField.Get(),
  ],
};

export default Tags;
