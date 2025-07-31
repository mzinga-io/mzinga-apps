import { CollectionConfigWithExtends } from "../../types";

const AdvancedEntity = {
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "isPrivate"],
    group: "Custom",
  },
  safeAccess: {
    create: `function (args) {
      const { req } = args;
      if (!(req && req.user)) {
        return false;
      }
      return true;
    }`,
  },
  accessByRoles: {
    create: ["admin", "managers"],
    delete: ["admin"],
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

export default AdvancedEntity;
