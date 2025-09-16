import { Field } from "mzinga/types";
import { Slugs } from "../collections/Slugs";
import { AccessUtils } from "../utils";

export const ByField = {
  Name: "by",
  Get(): Field {
    const accessUtils = new AccessUtils();
    return {
      name: ByField.Name,
      type: "relationship",
      relationTo: Slugs.Users,
      required: true,
      defaultValue: ({ user }) => user?.id,
      access: {
        read: () => true,
        update: accessUtils.GetIsAdminFieldLevelAccess,
        create: () => true,
      },
      admin: {
        position: "sidebar",
      },
    };
  },
};
