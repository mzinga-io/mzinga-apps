import { Field } from "payload/types";
import { Slugs } from "../collections/Slugs";

export const OwnerField = {
  Name: "owner",
  Get(): Field {
    return {
      name: OwnerField.Name,
      type: "relationship",
      relationTo: Slugs.Users,
      hasMany: false,
      defaultValue: ({ user }) => user.id,
      admin: {
        position: "sidebar",
        readOnly: true,
        hidden: true,
      },
    };
  },
};
