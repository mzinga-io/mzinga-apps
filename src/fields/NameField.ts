import { Field } from "mzinga/types";

export const NameField = {
  Name: "name",
  Get(): Field {
    return {
      name: NameField.Name,
      type: "text",
      required: true,
    };
  },
};
