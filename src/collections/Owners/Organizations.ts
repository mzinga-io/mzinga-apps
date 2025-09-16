import { CollectionConfig } from "mzinga/types";
import { ByField } from "../../fields";
import { NameReadOnlyField } from "../../fields/NameReadOnlyField";
import { AccessUtils } from "../../utils";
import { MZingaLogger } from "../../utils/MZingaLogger";
import { Slugs } from "../Slugs";
const access = new AccessUtils();
const Organizations: CollectionConfig = {
  slug: Slugs.Organizations,
  access: access.GetIsAdminOrBy(),
  admin: {
    group: "Owners",
    useAsTitle: NameReadOnlyField.Name,
    defaultColumns: [NameReadOnlyField.Name, "commonName", ByField.Name],
    listSearchableFields: [NameReadOnlyField.Name, "commonName", ByField.Name],
  },
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        const { payload } = req;
        MZingaLogger.Instance?.debug(`Finding project(s) with org_id: ${id}`);
        const projects = await payload.find({
          collection: Slugs.Projects,
          where: {
            "organization.value": {
              equals: id,
            },
          },
        });
        if (!projects.docs?.length) {
          return;
        }
        MZingaLogger.Instance?.debug(`Delete projects with org_id: ${id}`);
        await payload.delete({
          collection: Slugs.Projects,
          where: {
            "organization.value": {
              equals: id,
            },
          },
        });
        const project_ids = projects.docs.map((p) => p.id).join(",");
        MZingaLogger.Instance?.debug(
          `Deleting environment(s) with project_ids: ${project_ids}`
        );
        await payload.delete({
          collection: Slugs.Environments,
          where: {
            "project.value": {
              in: project_ids,
            },
          },
        });
      },
    ],
  },
  fields: [
    NameReadOnlyField.Get(),
    {
      name: `commonName`,
      type: "text",
    },
    {
      name: "invoices",
      type: "group",
      fields: [
        {
          name: "vat",
          type: "text",
          required: true,
        },
        {
          name: "address",
          type: "text",
          required: true,
        },
        {
          name: "address2",
          type: "text",
        },
        {
          name: "email",
          type: "email",
          required: true,
        },
      ],
    },
    {
      name: "additionalOwners",
      type: "array",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "ownerFirstName",
              type: "text",
            },
            {
              name: "ownerLastName",
              type: "text",
            },
            {
              name: "ownerEmail",
              type: "email",
            },
          ],
        },
      ],
    },
    {
      name: "graphics",
      type: "group",
      fields: [
        {
          name: "icon",
          type: "upload",
          relationTo: Slugs.Assets,
        },
        {
          name: "logo",
          type: "upload",
          relationTo: Slugs.Assets,
        },
      ],
    },
    ByField.Get(),
  ],
};
export default Organizations;
