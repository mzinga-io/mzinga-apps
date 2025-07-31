import { CollectionConfigWithExtends } from "../../types";

const ExtensionEntity = {
  extends: {
    collection: "extendable-collection",
    safeAdminHidden: `function (args) {
        return !args.user?.roles?.includes("admin");
      }`,
    access: {
      read: `function (args) {
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
    ],
  },
  fields: [],
} as CollectionConfigWithExtends;

export default ExtensionEntity;
