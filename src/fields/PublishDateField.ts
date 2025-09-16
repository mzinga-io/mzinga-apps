import { Field } from "mzinga/types";

export const PublishDateField = {
  Name: "publishDate",
  Get(): Field {
    return {
      name: PublishDateField.Name,
      type: "date",
      admin: {
        position: "sidebar",
        description: "Entity will not be public until this date",
      },
      defaultValue: () => new Date(),
    };
  },
};
