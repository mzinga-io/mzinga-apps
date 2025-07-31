import { CollectionConfig } from "payload/types";
import { Slugs } from "./Slugs";
import { AccessUtils } from "../utils";
import IconURLField from "../fields/IconURLField";
const access = new AccessUtils();
const AlertTypes: CollectionConfig = {
  slug: Slugs.AlertTypes,
  access: {
    ...access.GetReadAll(),
    ...access.GetEdit(),
  },
  admin: {
    useAsTitle: "type",
    defaultColumns: ["type", "id", "iconURL"],
    group: "Notifications",
    enableRichTextRelationship: false,
  },
  fields: [
    {
      name: "type",
      type: "text",
    },
    {
      type: "row",
      fields: [
        {
          name: "iconURL",
          type: "text",
          admin: {
            width: "70%",
          },
        },
        {
          name: "iconURLVisual",
          type: "ui",
          admin: {
            condition: (_, siblingData) => {
              return siblingData.iconURL;
            },
            components: {
              Field: IconURLField,
            },
            width: "30%",
          },
        },
      ],
    },
  ],
};

export default AlertTypes;
