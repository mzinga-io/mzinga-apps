import Stories from "../../../src/collections/Stories";
import Users from "../../../src/collections/Users";
import Tags from "../../../src/collections/Tags";
import Media from "../../../src/collections/Media";
import { ConfigUtils } from "../../../src/utils";
import { Slugs } from "../../../src/collections/Slugs";
import type {
  FieldBase,
  CollectionConfig,
  RowField,
  FieldHookArgs,
} from "payload/types";
import dataMock from "../../../__mocks__/dataMock";
import type { CollectionConfigWithExtends } from "../../../src/types";
import type { Config } from "payload/config";
const collections = [Users, Stories, Tags, Media];

describe("utils", () => {
  describe("ConfigUtils", () => {
    let utils: ConfigUtils;
    beforeEach(() => {
      utils = new ConfigUtils(collections, {
        Env: {},
      });
    });
    it("GetCookiePrefix should return 'mzinga' when empty 'TENANT' or empty Env", () => {
      expect(utils.GetCookiePrefix()).toBe("mzinga");
      utils.config.Env = undefined;
      expect(utils.GetCookiePrefix()).toBe("mzinga");
    });
    it("GetCookiePrefix should return slugified 'TENANT' value from Env", () => {
      utils.config.Env.TENANT = "TEST-TENANT";
      expect(utils.GetCookiePrefix()).toBe("test-tenant");
    });
    it("ToggleHiddenFields should return input fields when 'hiddenFields' list is empty", () => {
      expect(
        utils.ToggleHiddenFields(
          [
            {
              type: "text",
              name: "my-field",
            },
            {
              type: "text",
              name: "another-field",
            },
          ],
          []
        )
      ).toHaveLength(2);
    });
    it("ToggleHiddenFields should return filtered list of fields", () => {
      expect(
        utils.ToggleHiddenFields(
          [
            {
              type: "text",
              name: "my-field",
            },
            {
              type: "row",
              fields: [],
            } as RowField,
          ],
          ["my-field"]
        )
      ).toHaveLength(1);
    });
    it("TransformToAccess should transform safeAccess input values", () => {
      const result = utils.TransformToAccess(
        {
          read: function () {
            return "can-read";
          }.toString(),
        },
        {
          update: function () {
            return "can-update";
          },
        }
      );
      expect(result.read()).toBe("can-read");
      expect(result.update()).toBe("can-update");
    });
    it("TransformFromRolesToAccess should transform AccessByRoles input values", () => {
      const result = utils.TransformFromRolesToAccess({
        read: ["admin", "owner"],
      });
      expect(result.read.replace(/\r|\n/g, "").replace(/\s\s+/g, "")).toBe(
        `(args) => {return args.req?.user?.roles?.includes('admin') || args.req?.user?.roles?.includes('owner')}`
      );
    });
    it("GetEnabledCollections should return all collections", () => {
      expect(utils.GetEnabledCollections()).toHaveLength(4);
    });
    it("GetDisabledCollections should return 0 collections", () => {
      expect(utils.GetDisabledCollections()).toHaveLength(0);
    });
    it("IsEnabledBySlug('Stories') should return true", () => {
      expect(utils.IsEnabledBySlug(Slugs.Stories)).toBe(true);
    });
    it("IsEnabledBySlug('INVALID_SLUG') should return false", () => {
      expect(utils.IsEnabledBySlug("INVALID_SLUG")).toBe(false);
    });
    it("IsEnabled(collections[Slugs.Stories]) should return true", () => {
      const collection = collections.find((c) => c.slug === Slugs.Stories);
      expect(utils.IsEnabled(collection)).toBe(true);
    });
    it("IsEnabled(undefined) should return false", () => {
      expect(utils.IsEnabled(undefined)).toBe(false);
    });
    it("FilterRelationships(fields) should return all fields", () => {
      expect(
        utils.FilterRelationships([
          {
            name: "sample",
            type: "text",
          },
        ])
      ).toHaveLength(1);
    });
    it("FilterRelationships(fields[type='relationship']) should return all fields", () => {
      expect(
        utils.FilterRelationships([
          {
            name: "sample",
            type: "relationship",
            relationTo: Slugs.Media,
          },
        ])
      ).toHaveLength(1);
    });
    it("TransformToField should transform 'readValueFromField' to 'beforeChangeHook' and return undefined", async () => {
      const result = utils.TransformToField({
        name: "non_existing_prop",
        type: "text",
        readValueFromField: "object_attributes.non_existing_prop",
      } as any);
      const beforeChangeHook = (result as FieldBase).hooks.beforeChange;
      expect(beforeChangeHook).toHaveLength(1);
      expect(
        await beforeChangeHook[0]({
          data: {
            object_attributes: {
              id: 1,
            },
          },
        } as any)
      ).toBeUndefined();
    });
    it("TransformToField should transform 'readValueFromField' to 'beforeChangeHook' and return value", async () => {
      const result = utils.TransformToField({
        name: "id",
        type: "text",
        readValueFromField: "object_attributes.id",
      } as any);
      const beforeChangeHook = (result as FieldBase).hooks.beforeChange;
      expect(beforeChangeHook).toHaveLength(1);
      expect(
        await beforeChangeHook[0]({
          data: {
            object_attributes: {
              id: 1,
            },
          },
        } as any)
      ).toBe(1);
    });
    describe("FilterValidCollections", () => {
      const config = Object.assign(
        {},
        {
          collections,
        }
      ) as Config;
      beforeAll(async () => {
        await utils.FilterValidCollections(
          config,
          [].concat(
            dataMock.ConfigUtils.incomingCollections,
            dataMock.ConfigUtils.sortableCollections
          ) as CollectionConfigWithExtends[]
        );
      });
      it("should return extended collection", () => {
        const userCollection = config.collections.find(
          (c) => c.slug === "users"
        );
        expect(userCollection).toBeDefined();
        const twitterField = userCollection.fields.find(
          (f) => (f as FieldBase).name === "twitter"
        );
        expect(twitterField).toBeUndefined();
        const jobTitleField = userCollection.fields.find(
          (f) => (f as FieldBase).name === "jobTitle"
        );
        expect(jobTitleField).toBeDefined();
      });
      it("should return new collection", () => {
        const speechesCollection = config.collections.find(
          (c) => c.slug === "speeches"
        );
        expect(speechesCollection).toBeDefined();
        expect(speechesCollection.access.update(null)).toBe("can-update");
        const ownerField = speechesCollection.fields.find(
          (f) => (f as FieldBase).name === "owner"
        ) as FieldBase;
        expect(ownerField).toBeDefined();
        expect(ownerField.hooks.beforeChange).toHaveLength(1);
        expect(ownerField.hooks.beforeChange[0]({} as any)).toBe(
          "before-change"
        );
        const statusField = speechesCollection.fields.find(
          (f) => (f as FieldBase).name === "status"
        ) as FieldBase;
        expect(statusField).toBeDefined();
        expect(statusField.access.create({} as any)).toBe("can-create");
        expect(
          statusField.admin.condition({} as any, {} as any, {} as any)
        ).toBe("safe-admin-condition");
      });
    });
    describe("SortCollectionsByRelations", () => {
      const config = Object.assign(
        {},
        {
          collections,
        }
      ) as Config;
      beforeAll(() => {
        utils.SortCollectionsByRelations(
          config,
          [].concat(
            dataMock.ConfigUtils.sortableCollections
          ) as CollectionConfigWithExtends[]
        );
      });
      it("should sort collections based on 'relationship' fields", () => {
        expect(
          config.collections.find((c) => c.slug === "testleagues")
        ).toBeDefined();
        expect(
          config.collections.find((c) => c.slug === "testteams")
        ).toBeDefined();
      });
    });
    describe("GetAccessForPlugins", () => {
      it("GetAccessForPlugins should return empty access object", () => {
        expect(utils.GetAccessForPlugins(null)).toEqual({});
      });
      it("GetAccessForPlugins should return access", () => {
        const sampleAccess = function (args) {
          return args.id;
        };
        const collection = {
          extends: {
            collection: "forms",
            access: {
              read: sampleAccess.toString(),
            },
          },
        } as CollectionConfigWithExtends;
        expect(utils.GetAccessForPlugins(collection).read(42)).toBe(
          sampleAccess(42)
        );
      });
    });
  });
  describe("customConfigUtils", () => {
    const collectionWithRelationship = {
      slug: "collection-with-relationships",
      fields: [
        {
          name: "relationship-field",
          type: "relationship",
          relationTo: "disabled-collection",
        },
      ],
    } as CollectionConfig;
    const customCollections = ([] as CollectionConfig[]).concat(collections, [
      {
        slug: "disabled-collection",
        fields: [],
      },
      collectionWithRelationship,
    ]);
    const customUtils = new ConfigUtils(customCollections, {
      EnabledCollections: {
        "disabled-collection": false,
        "collection-with-relationships": true,
      },
      Env: {},
    });
    it("FilterRelationships(fields[slug='disabled-collection',type='relationship']) should return filtered fields", () => {
      expect(customUtils.GetDisabledCollections()).toHaveLength(1);
      expect(
        customUtils.FilterRelationships(collectionWithRelationship.fields)
      ).toHaveLength(0);
    });
    it("FilterRelationships(fields[slug='disabled-collection',type='relationship',relationTo=[]) should return filtered fields", () => {
      expect(customUtils.GetDisabledCollections()).toHaveLength(1);
      expect(
        customUtils.FilterRelationships([
          {
            name: "sample",
            type: "relationship",
            relationTo: ["disabled-collection"],
          },
        ])
      ).toHaveLength(0);
    });
    it("GetFilteredCollections should return filtered collections and filtered fields", () => {
      const filteredCollections = customUtils.GetFilteredCollections();
      expect(filteredCollections).toHaveLength(
        customCollections.length - customUtils.GetDisabledCollections().length
      );
      const filteredCollectionWithRelationships = filteredCollections.find(
        (f) => f.slug === "collection-with-relationships"
      );
      expect(filteredCollectionWithRelationships).not.toBeNull();
      expect(filteredCollectionWithRelationships?.fields).toHaveLength(0);
    });
  });
});
