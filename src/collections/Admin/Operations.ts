import { CollectionConfig } from "mzinga/types";
import { AccessUtils } from "../../utils";
import { Slugs } from "../Slugs";

const access = new AccessUtils();
const AdminOperations: CollectionConfig = {
  slug: Slugs.AdminOperations,
  access: {
    ...access.GetIsAdminOnly(),
  },
  admin: {
    useAsTitle: "operation",
    defaultColumns: ["operation", "user"],
    group: "Admin",
  },
  fields: [
    {
      name: "operation",
      type: "text",
      defaultValue: () => "test",
      admin: {
        readOnly: true,
      },
      required: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: [Slugs.Users],
      admin: {
        readOnly: true,
      },
    },
  ],
};
export default AdminOperations;
