import httpStatus from "http-status";
import APIError from "mzinga/dist/errors/APIError";
import type { CollectionConfig, FieldBase, FieldHook } from "mzinga/types";
import { select } from "mzinga/dist/fields/validations";
import { AuthorField } from "../../fields";
import {
  COLLECTION_LEVEL_HOOKS,
  FIELD_LEVEL_HOOKS,
} from "../../hooks/WebHooks";
import { webHooksSync } from "../../hooks/WebHooksSync";
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
    // The change stream applies committed changes on every instance; this
    // reload covers the saving instance when change streams are unavailable.
    afterChange: [
      ({ doc }) => {
        webHooksSync.RequestReload();
        return doc;
      },
    ],
    afterDelete: [
      ({ doc }) => {
        webHooksSync.RequestReload();
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
          required: true,
          options: COLLECTION_LEVEL_HOOKS.concat(
            FIELD_LEVEL_HOOKS.filter(
              (h) => !COLLECTION_LEVEL_HOOKS.includes(h),
            ),
          ),
          validate: (value, options) => {
            const result = select(value, options);
            if (result !== true) {
              return result;
            }
            const { siblingData } = options as {
              siblingData?: { fieldReference?: string };
            };
            if (
              siblingData?.fieldReference &&
              !FIELD_LEVEL_HOOKS.includes(value as string)
            ) {
              return `With a field reference, the event must be a field hook: ${FIELD_LEVEL_HOOKS.join(", ")}`;
            }
            return true;
          },
        },
        {
          name: "type",
          type: "select",
          hasMany: false,
          required: true,
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
          validate: (value, options) => {
            const { siblingData } = options as {
              siblingData?: { type?: string };
            };
            if (siblingData?.type !== "http") {
              return true;
            }
            if (!value) {
              return "URL is required for HTTP webhooks";
            }
            try {
              const { protocol } = new URL(value as string);
              if (protocol !== "http:" && protocol !== "https:") {
                return "URL must start with http:// or https://";
              }
            } catch {
              return "URL is not valid";
            }
            return true;
          },
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
