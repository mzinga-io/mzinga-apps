import { Field } from "payload/types";

export const CopyrightField = {
  Name: "copyright",
  Get(): Field {
    return {
      name: CopyrightField.Name,
      type: "text",
      admin: {
        position: "sidebar",
      },
    };
  },
};
