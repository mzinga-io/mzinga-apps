import { CollectionConfig } from "payload/types";
import { AuthorField, NameField } from "../../fields";
import { AccessUtils } from "../../utils";
import { DBUtils } from "../../utils/DBUtils";
import { Slugs } from "../Slugs";

const access = new AccessUtils();
const AdminDBIndexes: CollectionConfig = {
  slug: Slugs.AdminDBIndexes,
  access: {
    ...access.GetIsAdminOnly(),
    update: () => false,
  },
  admin: {
    useAsTitle: NameField.Name,
    defaultColumns: [NameField.Name, "collectionReference"],
    group: "Admin",
  },
  hooks: {
    afterDelete: [
      async ({ req, doc }) => {
        const { payload } = req;
        const dbCollection = DBUtils.getDbCollection(
          payload,
          doc.collectionReference
        );
        const indexes = await dbCollection.listIndexes();
        const hasIndex = indexes.find(
          (i) => JSON.stringify(i.key) === JSON.stringify(doc.definition)
        );
        if (hasIndex) {
          payload.db.connection.collections[
            DBUtils.getDbCollectionName(payload, doc.collectionReference)
          ].dropIndex(doc.name);
        }
      },
    ],
    afterChange: [
      async ({ req, doc }) => {
        const { payload } = req;
        const dbCollection = DBUtils.getDbCollection(
          payload,
          doc.collectionReference
        );
        const indexes = await dbCollection.listIndexes();
        const alreadyFoundIndex = indexes.find(
          (i) => JSON.stringify(i.key) === JSON.stringify(doc.definition)
        );
        if (alreadyFoundIndex) {
          await payload.db.connection.collections[
            DBUtils.getDbCollectionName(payload, doc.collectionReference)
          ].dropIndex(alreadyFoundIndex.name);
        }
        dbCollection.schema.index(doc.definition, {
          name: doc.name,
          ...doc.options,
        });
        await dbCollection.ensureIndexes({
          background: true,
        });
      },
    ],
  },
  fields: [
    NameField.Get(),
    {
      name: "collectionReference",
      type: "select",
      hasMany: false,
      options: Object.keys(Slugs)
        .map((s) => {
          return {
            label: s,
            value: Slugs[s],
          };
        })
        .filter((s) => typeof s.value === "string"),
      required: true,
    },
    AuthorField.Get(),
    {
      name: "definition",
      type: "json",
      required: true,
      defaultValue: () => {
        return {};
      },
    },
    {
      name: "options",
      admin: {
        description:
          "By default, index creation will be applied with 'background:true'",
      },
      type: "json",
    },
  ],
};
export default AdminDBIndexes;
