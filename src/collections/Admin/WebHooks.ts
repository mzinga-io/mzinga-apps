import httpStatus from "http-status";
import APIError from "mzinga/dist/errors/APIError";
import type {
  CollectionConfig,
  FieldBase,
  FieldHook,
  SanitizedCollectionConfig,
} from "mzinga/types";
import { AuthorField } from "../../fields";
import {
  COLLECTION_LEVEL_HOOKS,
  FIELD_LEVEL_HOOKS,
  WebHooks as WebHooksUtils,
} from "../../hooks/WebHooks";
import { AccessUtils, SlugUtils } from "../../utils";
import { Slugs } from "../Slugs";

const access = new AccessUtils();
const slugifyHook: FieldHook = ({ data, value, originalDoc }) => {
  let currentValue = value;
  if (data) {
    currentValue = value === data.id || value === data._id ? "" : value;
  }
  if (originalDoc) {
    currentValue = value === originalDoc._id ? "" : value;
  }
  return SlugUtils.Slugify(
    currentValue || `webhooks-${data.collectionReference}`,
  );
};
const WebHooks: CollectionConfig = {
  slug: Slugs.AdminWebHooks,
  access: {
    ...access.GetIsAdminOnly(),
  },
  admin: {
    useAsTitle: "friendlyName",
    defaultColumns: ["friendlyName", "collectionReference"],
    group: "Admin",
  },
  hooks: {
    afterChange: [
      ({ doc, req }) => {
        const { payload } = req;
        const webHooks = new WebHooksUtils(process.env, [doc]);
        payload.config.collections = payload.config.collections.map(
          (collection) => ({
            ...collection,
            hooks: webHooks.EnrichCollection(collection),
            fields: webHooks.EnrichFields(collection.slug, collection.fields),
          }),
        ) as SanitizedCollectionConfig[];
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "friendlyName",
      type: "text",
      admin: {
        position: "sidebar",
      },
      hooks: {
        beforeValidate: [slugifyHook],
        afterRead: [slugifyHook],
      },
    },
    {
      name: "collectionReference",
      type: "select",
      hasMany: false,
      options: [
        ...Object.keys(Slugs)
          .map((s) => {
            return {
              label: s,
              value: Slugs[s],
            };
          })
          .filter((s) => typeof s.value === "string"),
        {
          label: "Forms",
          value: Slugs.Plugins.Forms,
        },
        {
          label: "Form Submissions",
          value: Slugs.Plugins.FormSubmissions,
        },
      ],
      required: true,
    },
    AuthorField.Get(),
    {
      name: "webhooks",
      type: "array",
      minRows: 1,
      fields: [
        {
          name: "event",
          type: "select",
          hasMany: false,
          options: [...COLLECTION_LEVEL_HOOKS, ...FIELD_LEVEL_HOOKS],
        },
        {
          name: "type",
          type: "select",
          hasMany: false,
          options: [
            {
              label: "HTTP",
              value: "http",
            },
            {
              label: "RabbitMQ",
              value: "rabbitmq",
            },
          ],
        },
        {
          name: "url",
          type: "text",
          admin: {
            condition: (_, siblingData) => {
              return siblingData.type === "http";
            },
          },
        },
        {
          name: "fieldReference",
          type: "text",
          hooks: {
            beforeChange: [
              ({ value, data, req }) => {
                if (!value) {
                  return "";
                }
                const { collectionReference } = data as {
                  collectionReference: string;
                };
                if (!collectionReference) {
                  throw new APIError(
                    "Collection reference is required to validate field reference",
                    httpStatus.BAD_REQUEST,
                  );
                }
                const { payload } = req;
                const isValid = payload.config.collections
                  .find((c) => c.slug === collectionReference)
                  ?.fields.find((f) => (f as FieldBase).name === value);
                if (!isValid) {
                  throw new APIError(
                    `Field reference must be a valid field in the referenced collection: ${collectionReference}`,
                    httpStatus.BAD_REQUEST,
                  );
                }
                return value;
              },
            ],
          },
        },
      ],
    },
  ],
};
export default WebHooks;
