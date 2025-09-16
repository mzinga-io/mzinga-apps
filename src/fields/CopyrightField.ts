import { Field } from "mzinga/types";

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
