import { Field } from "mzinga/types";

export const TitleField = {
  Name: "title",
  Get(): Field {
    return {
      name: TitleField.Name,
      type: "text",
      localized: true,
      required: true,
    };
  },
};
