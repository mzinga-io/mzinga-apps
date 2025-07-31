import { Field } from "payload/types";
import { Slugs } from "../collections/Slugs";

export const AuthorField = {
  Name: "author",
  Get(): Field {
    return {
      name: AuthorField.Name,
      type: "relationship",
      relationTo: Slugs.Users,
      defaultValue: ({ user }) => user?.id,
      admin: {
        position: "sidebar",
      },
    };
  },
};
