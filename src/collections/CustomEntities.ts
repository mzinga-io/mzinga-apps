import collectionSchema from "mzinga/dist/collections/config/schema";
import { CollectionConfig } from "mzinga/types";
import {
  CustomEntitiesJsonEditorCell,
  CustomEntitiesJsonEditorField,
} from "../components/fields/CustomEntitiesJsonEditor";
import { bySlugEndpoints } from "../endpoints";
import { SlugField } from "../fields";
import { AccessUtils, ConfigUtils, SlugUtils } from "../utils";
import { FSUtils } from "../utils/FSUtils";
import { Slugs } from "./Slugs";

const access = new AccessUtils();
const CustomEntities: CollectionConfig = {
  slug: Slugs.CustomEntities,
  access: {
    ...access.GetIsAdminOnly(),
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", SlugField.Name, "status", "jsonDefinition"],
    group: "Configuration",
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        const { payload } = req;
        const utils = new ConfigUtils(payload.config.collections);
        data.jsonDefinition.json.slug =
          data.slug || SlugUtils.Slugify(data.name);
        let transformedCollection = utils.TransformCollection(payload.config, {
          ...data.jsonDefinition.json,
        });
        const { warning } = await collectionSchema.validateAsync(
          transformedCollection,
          {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: false,
            warnings: true,
          }
        );
        if (warning) {
          throw warning.message;
        }
        return data;
      },
    ],
    afterChange: [
      ({ doc }) => {
        const fsUtils = new FSUtils();
        fsUtils.SaveToFolder(
          "drops",
          `${doc.slug}.js`,
          `module.exports = ${JSON.stringify(
            doc.jsonDefinition.json,
            null,
            2
          )};`
        );
      },
    ],
    afterDelete: [
      ({ doc }) => {
        const fsUtils = new FSUtils();
        fsUtils.DeleteFromFolder("drops", `${doc.slug}.js`);
        fsUtils.DeleteFromFolder("definitions", `${doc.slug}.js`);
      },
    ],
  },
  versions: {
    drafts: true,
  },

  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "jsonDefinition",
      type: "json",
      label: "JSON Definition",
      admin: {
        components: {
          Field: CustomEntitiesJsonEditorField,
          Cell: CustomEntitiesJsonEditorCell,
        },
      },
    },
    SlugField.Get(),
  ],
  endpoints: [].concat(bySlugEndpoints),
};

export default CustomEntities;
