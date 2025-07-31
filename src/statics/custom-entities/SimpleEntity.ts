import { CollectionConfigWithExtends } from "../../types";

const SimpleEntity = {
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "isPrivate"],
    group: "Custom",
  },
  fields: [
    {
      name: "content",
      type: "textarea",
      maxLength: 150,
      localized: true,
      required: true,
    },
    {
      name: "isPrivate",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Private filters it from being visible to non-logged users",
      },
    },
  ],
} as CollectionConfigWithExtends;

export default SimpleEntity;
