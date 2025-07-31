import { Field } from "payload/types";

export const NameReadOnlyField = {
  Name: "name",
  Get(): Field {
    return {
      name: NameReadOnlyField.Name,
      type: "text",
      required: true,
      maxLength: 36,
      minLength: 1,
      admin: {
        description: "This field becomes read-only after initial save.",
      },
      hooks: {
        beforeChange: [
          ({ operation, originalDoc, data }) => {
            if (operation === 'create') {
              return data.name;
            }
            return originalDoc.name;
          },
        ],
      },
    };
  },
};