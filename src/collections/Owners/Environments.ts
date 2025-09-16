import { CollectionConfig } from "mzinga/types";
import { ByField, NameField } from "../../fields";
import { AccessUtils } from "../../utils";
import { Slugs } from "../Slugs";
const access = new AccessUtils();
const Environments: CollectionConfig = {
  slug: Slugs.Environments,
  access: access.GetIsAdminOrBy(),
  admin: {
    group: "Owners",
    useAsTitle: NameField.Name,
    defaultColumns: [NameField.Name, ByField.Name, "project", "sku"],
    listSearchableFields: [NameField.Name, ByField.Name, "project"],
  },
  fields: [
    NameField.Get(),
    {
      name: "project",
      type: "relationship",
      required: true,
      relationTo: [Slugs.Projects],
      hasMany: false,
      filterOptions: access.AdminOrMineFilterOptions,
    },
    {
      name: "sku",
      type: "select",
      required: true,
      defaultValue: "basic",
      options: [
        {
          label: "Basic",
          value: "basic",
        },
        {
          label: "Pro",
          value: "pro",
        },
        {
          label: "Ultra",
          value: "ultra",
        },
      ],
    },
    ByField.Get(),
  ],
};
export default Environments;
