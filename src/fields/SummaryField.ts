import { Field } from "mzinga/types";

export const SummaryField = {
  Name: "summary",
  Get(partialOverride?: {}): Field {
    return {
      ...(partialOverride || {}),
      name: SummaryField.Name,
      type: "text",
      localized: true,
    };
  },
};
