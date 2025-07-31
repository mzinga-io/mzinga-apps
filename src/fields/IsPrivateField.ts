import { Field } from "payload/types";

export const IsPrivateField = {
  Name: "isPrivate",
  Get(): Field {
    return {
      name: IsPrivateField.Name,
      type: "checkbox",
      defaultValue: () => false,
      admin: {
        position: "sidebar",
        description:
          "Private filters it from being visible to non-logged users",
      },
    };
  },
};
