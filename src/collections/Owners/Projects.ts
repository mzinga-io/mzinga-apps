import { CollectionConfig } from "payload/types";
import { Slugs } from "../Slugs";
import { AccessUtils } from "../../utils";
import { ByField, NameField } from "../../fields";
import { MZingaLogger } from "../../utils/MZingaLogger";
const access = new AccessUtils();
const Projects: CollectionConfig = {
  slug: Slugs.Projects,
  access: access.GetIsAdminOrBy(),
  admin: {
    group: "Owners",
    useAsTitle: NameField.Name,
    defaultColumns: [NameField.Name, "organization", ByField.Name],
    listSearchableFields: [NameField.Name, "organization", ByField.Name],
  },
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        const { payload } = req;
        MZingaLogger.Instance?.debug(
          `Deleting environment(s) with project_id: ${id}`
        );
        await payload.delete({
          collection: Slugs.Environments,
          where: {
            "project.value": {
              equals: id,
            },
          },
        });
      },
    ],
  },
  fields: [
    NameField.Get(),
    {
      name: "organization",
      type: "relationship",
      hasMany: false,
      required: true,
      relationTo: [Slugs.Organizations],
      filterOptions: access.AdminOrMineFilterOptions,
    },
    ByField.Get(),
  ],
};
export default Projects;
