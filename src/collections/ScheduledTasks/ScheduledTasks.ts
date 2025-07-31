import { CollectionConfig } from "payload/types";
import { AccessUtils } from "../../utils";
import { Slugs } from "../Slugs";

const access = new AccessUtils();

import { NameField } from "../../fields";
const ScheduledTasks: CollectionConfig = {
  slug: Slugs.ScheduledTasks,
  access: {
    ...access.GetIsAdminOnly(),
  },
  admin: {
    useAsTitle: NameField.Name,
    defaultColumns: [NameField.Name, "executions"],
    group: "Admin",
  },
  fields: [
    NameField.Get(),
    {
      name: "lastExecution",
      type: "date",
      label: "Last Execution Time",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
          displayFormat: "yyyy-MM-dd HH:mm",
          timeIntervals: 1,
          timeFormat: "HH:mm",
        },
      },
    },
  ],
};

export default ScheduledTasks;
