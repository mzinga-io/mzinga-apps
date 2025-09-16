import payload from "mzinga";
import { CollectionConfig } from "mzinga/types";
import { AccessUtils } from "../utils";
import { CollectionUtils } from "../utils/CollectionUtils";
import { MailUtils } from "../utils/MailUtils";
import { MZingaLogger } from "../utils/MZingaLogger";
import { TextUtils } from "../utils/TextUtils";
import { Slugs } from "./Slugs";

const access = new AccessUtils();
const collectionUtils = new CollectionUtils(Slugs.Communications);
const Communications: CollectionConfig = {
  slug: Slugs.Communications,
  access: {
    read: access.GetIsAdmin,
    create: access.GetIsAdmin,
    delete: () => {
      return false;
    },
    update: () => {
      return false;
    },
  },
  admin: {
    ...collectionUtils.GeneratePreviewConfig(),
    useAsTitle: "subject",
    defaultColumns: ["subject", "tos"],
    group: "Notifications",
    disableDuplicate: true,
    enableRichTextRelationship: false,
  },
  hooks: {
    afterChange: [
      async ({ doc }) => {
        const { tos, ccs, bccs, subject, body } = doc;
        for (const part of body) {
          if (part.type !== "upload") {
            continue;
          }
          const relationToSlug = part.relationTo;
          const doc = await payload.findByID({
            collection: relationToSlug,
            id: part.value.id,
          });
          part.value = {
            ...part.value,
            ...doc,
          };
        }
        const html = TextUtils.Serialize(body || "");
        try {
          const users = await payload.find({
            collection: tos[0].relationTo,
            where: {
              id: {
                in: tos.map((to) => to.value.id).join(","),
              },
            },
          });
          const usersEmails = users.docs.map((u) => u.email);
          let cc;
          if (ccs) {
            const copiedusers = await payload.find({
              collection: ccs[0].relationTo,
              where: {
                id: {
                  in: ccs.map((cc) => cc.value.id).join(","),
                },
              },
            });
            cc = copiedusers.docs.map((u) => u.email).join(",");
          }
          let bcc;
          if (bccs) {
            const blindcopiedusers = await payload.find({
              collection: bccs[0].relationTo,
              where: {
                id: {
                  in: bccs.map((bcc) => bcc.value.id).join(","),
                },
              },
            });
            bcc = blindcopiedusers.docs.map((u) => u.email).join(",");
          }
          const promises = [];
          for (const to of usersEmails) {
            const message = {
              from: payload.emailOptions.fromAddress,
              subject,
              to,
              cc,
              bcc,
              html,
            };
            promises.push(
              MailUtils.sendMail(payload, message).catch((e) => {
                MZingaLogger.Instance?.error(`[Communications:err] ${e}`);
                return null;
              })
            );
          }
          await Promise.all(promises.filter((p) => Boolean(p)));
          return doc;
        } catch (err) {
          if (err.response && err.response.body && err.response.body.errors) {
            err.response.body.errors.forEach((error) =>
              MZingaLogger.Instance?.error(
                `[Communications:err]
                ${error.field}
                ${error.message}`
              )
            );
          } else {
            MZingaLogger.Instance?.error(`[Communications:err] ${err}`);
          }
          throw err;
        }
      },
    ],
  },
  fields: [
    {
      name: "subject",
      type: "text",
      required: true,
    },
    {
      name: "tos",
      type: "relationship",
      relationTo: [Slugs.Users],
      required: true,
      hasMany: true,
      admin: {
        isSortable: true,
      },
    },
    {
      name: "ccs",
      type: "relationship",
      relationTo: [Slugs.Users],
      required: false,
      hasMany: true,
      admin: {
        isSortable: true,
      },
    },
    {
      name: "bccs",
      type: "relationship",
      relationTo: [Slugs.Users],
      required: false,
      hasMany: true,
      admin: {
        isSortable: true,
      },
    },
    {
      name: "body",
      type: "richText",
      required: true,
    },
  ],
};

export default Communications;
