import { cachePlugin } from "@aengz/payload-redis-cache";
import formBuilder from "@mzinga/plugin-form-builder";
import seo from "@mzinga/plugin-seo";
import { exportCollectionsPlugin } from "@newesissrl/payload-exportcollections-plugin";
import LoginButton from "@newesissrl/payload-zitadel-plugin/dist/components/LoginButton";
import { ZitadelStrategyPlugin } from "@newesissrl/payload-zitadel-plugin/dist/plugins/ZitadelStrategyPlugin";
import payload from "mzinga";
import type { Config, SanitizedConfig } from "mzinga/config";
import sanitizeCollection from "mzinga/dist/collections/config/sanitize";
import collectionSchema from "mzinga/dist/collections/config/schema";
import { Plugin } from "mzinga/dist/config/types";
import type {
  ArrayField,
  FieldBase,
  GroupField,
  RelationshipField,
  UploadField,
} from "mzinga/dist/fields/config/types";
import type {
  CollectionConfig,
  Field,
  SanitizedCollectionConfig,
} from "mzinga/types";
// import { swagger } from "payload-swagger";
import { Slugs } from "../collections/Slugs";
import { ConfigLoader } from "../configs";
import { bySlugEndpoints } from "../endpoints";
import {
  IsPrivateField,
  PublishDateField,
  SlugField,
  SummaryField,
  TagsField,
} from "../fields";
import { RichTextHooks } from "../hooks/RichTextHooks";
import { WebHooks } from "../hooks/WebHooks";
import type {
  AccessByRoles,
  CollectionConfigWithExtends,
  CustomComponents,
  FieldWithSafeAccess,
  InstanceConfig,
  SafeAccess,
} from "../types";
import { EnvUtils } from "./EnvUtils";
import { MZingaLogger } from "./MZingaLogger";
import { SlugUtils } from "./SlugUtils";
import { TextUtils } from "./TextUtils";

declare type CollectionGraph = {
  [key: string]: CollectionConfigWithExtends[];
};
const CollectionGraphKeys = {
  NoRelation: "0",
  BaseEntity: "10",
  CustomEntity: "100",
};
const noOp = function () {}.toString();
const evaluateSafeFn = (safeFn: string) => {
  return eval(`(${safeFn || noOp})`);
};
export class ConfigUtils {
  private collections: CollectionConfig[];
  config: InstanceConfig;
  customComponents: CustomComponents;
  webHooks: WebHooks;
  static instance: ConfigUtils;
  constructor(
    collections: CollectionConfig[],
    additionalConfig?: InstanceConfig,
    customComponents?: CustomComponents,
  ) {
    this.config = new ConfigLoader(additionalConfig).Load();
    this.webHooks = new WebHooks(this.config.Env);
    this.collections = collections;
    this.customComponents = customComponents;
    ConfigUtils.instance = this;
  }
  GetCookiePrefix(): string {
    return SlugUtils.Slugify(this.config.Env?.TENANT || "mzinga");
  }
  ToggleHiddenFields(fields: Field[], hiddenFields: string[]): Field[] {
    const result = hiddenFields?.length
      ? fields.filter((field) => {
          return (field as FieldBase).name
            ? !hiddenFields.includes((field as FieldBase).name)
            : field;
        })
      : fields;
    return result;
  }
  TransformToField(_field: Field) {
    const field = { ..._field };
    const safeAccess = (field as FieldWithSafeAccess).safeAccess;
    if (safeAccess) {
      (field as FieldBase).access = this.TransformToAccess(safeAccess);
      delete (field as FieldWithSafeAccess).safeAccess;
    }
    const safeAdminCondition = (field as FieldWithSafeAccess)
      .safeAdminCondition;
    if (safeAdminCondition) {
      field.admin = {
        ...field.admin,
        condition: evaluateSafeFn(safeAdminCondition),
      };
      delete (field as FieldWithSafeAccess).safeAdminCondition;
    }
    if (field.type === "richText") {
      (field as FieldBase).hooks = {
        ...(field as FieldBase).hooks,
        beforeChange: ((field as FieldBase).hooks?.beforeChange || []).concat([
          ({ data, field, value }) => {
            const currentData = [].concat(data[field.name]);
            const result = [];
            for (let node of currentData) {
              result.push({
                html: TextUtils.Serialize(node.children),
                internalLinks: TextUtils.GetInternalLinks(node.children),
              });
            }
            data[`${field.name}Serialized`] = result;
            return value;
          },
        ]),
      };
    }
    const safeHooksBeforeChange = (field as FieldWithSafeAccess)
      .safeHooksBeforeChange;
    if (safeHooksBeforeChange) {
      (field as FieldBase).hooks = {
        ...(field as FieldBase).hooks,
        beforeChange: ((field as FieldBase).hooks?.beforeChange || []).concat(
          safeHooksBeforeChange.map(evaluateSafeFn),
        ),
      };
      delete (field as FieldWithSafeAccess).safeHooksBeforeChange;
    }
    const safeFilterOptions = (field as FieldWithSafeAccess).safeFilterOptions;
    if (safeFilterOptions) {
      (field as UploadField).filterOptions = evaluateSafeFn(safeFilterOptions);
      delete (field as FieldWithSafeAccess).safeFilterOptions;
    }

    const readValueFromField = (field as FieldWithSafeAccess)
      .readValueFromField;
    if (readValueFromField) {
      const fieldParts = readValueFromField.split(".");
      (field as FieldBase).hooks = {
        ...(field as FieldBase).hooks,
        beforeChange: ((field as FieldBase).hooks?.beforeChange || []).concat([
          ({ data }) => {
            let value = data;
            for (const part of fieldParts) {
              if (!value) {
                return value;
              }
              value = value[part];
            }
            return value;
          },
        ]),
      };
      delete (field as FieldWithSafeAccess).readValueFromField;
    }

    if (field.hasOwnProperty("fields")) {
      (field as any).fields.map((field) => this.TransformToField(field));
    }
    if (field.hasOwnProperty("tabs")) {
      (field as any).tabs = (field as any).tabs.map((tab) => {
        const result = {
          ...tab,
          admin: {
            condition: tab.safeAdminCondition
              ? evaluateSafeFn(tab.safeAdminCondition)
              : undefined,
          },
          fields: (tab as any).fields.map((field) =>
            this.TransformToField(field),
          ),
        };
        delete result.safeAdminCondition;
        return result;
      });
    }
    if (field.hasOwnProperty("group")) {
      (field as any).group = (field as any).group.map((group) => {
        const result = {
          ...group,
          admin: {
            condition: group.safeAdminCondition
              ? evaluateSafeFn(group.safeAdminCondition)
              : undefined,
          },
          fields: (group as any).fields.map((field) =>
            this.TransformToField(field),
          ),
        };
        delete result.safeAdminCondition;
        return result;
      });
    }
    return field;
  }
  TransformFromRolesToAccess(accessRoles: AccessByRoles): SafeAccess {
    const fromRolesToAccess = (roles) => {
      if (!roles) {
        return null;
      }
      const rolesAsCondition = roles
        .filter((r) => Boolean(r))
        .map((r) => `args.req?.user?.roles?.includes('${r}')`);
      return `(args) => {
        return ${rolesAsCondition.join(" || ")}
      }`;
    };
    return {
      admin: fromRolesToAccess(accessRoles.admin),
      read: fromRolesToAccess(accessRoles.read),
      delete: fromRolesToAccess(accessRoles.delete),
      update: fromRolesToAccess(accessRoles.update),
      create: fromRolesToAccess(accessRoles.create),
      readVersions: fromRolesToAccess(accessRoles.readVersions),
      unlock: fromRolesToAccess(accessRoles.unlock),
    };
  }
  TransformToAccess(sourceAccess: any, fallbackAccess: any = {}): any {
    const result = {};
    for (const key of Object.keys({
      ...sourceAccess,
      ...fallbackAccess,
    })) {
      const access =
        sourceAccess[key] || (fallbackAccess[key] || noOp).toString();
      result[key] = evaluateSafeFn(access);
    }
    return result;
  }
  FilterInvalidRelationships(
    collections: CollectionConfig[] | SanitizedCollectionConfig[],
  ) {
    const check = (fields: Field[]) => {
      fields.forEach((field, idx, array) => {
        const relationTo = (field as any).relationTo;
        const fields = (field as any).fields;
        const tabs = (field as any).tabs;
        const group = (field as any).group;
        if (relationTo) {
          const relationToAsArray = !Array.isArray(relationTo)
            ? [relationTo]
            : relationTo;
          relationToAsArray.forEach((r) => {
            const hasCollectionWithRelationToSlug = collections.find(
              (c) => c.slug === r,
            );
            if (!hasCollectionWithRelationToSlug) {
              array.splice(idx, 1);
            }
          });
        }
        if (tabs) {
          check(tabs.fields || []);
        }
        if (group) {
          check(group.fields || []);
        }
        if (fields) {
          check(fields);
        }
      });
    };
    collections.filter(Boolean).forEach((collection) => {
      check(collection.fields);
    });
    return collections;
  }
  TransformCollection(
    config: Config | SanitizedConfig,
    collection: CollectionConfigWithExtends,
  ) {
    const result = Object.assign({}, collection);
    const { extends: _extends } = result;
    if (_extends) {
      const extendFromCollectionKey = _extends.collection;
      const extendBaseCollection = config.collections.find(
        (c) => c.slug === extendFromCollectionKey,
      );
      if (extendBaseCollection) {
        if (_extends.access) {
          extendBaseCollection.access = this.TransformToAccess(
            _extends.access,
            extendBaseCollection.access,
          );
        }
        if (_extends.accessByRoles) {
          extendBaseCollection.access = this.TransformToAccess(
            this.TransformFromRolesToAccess(_extends.accessByRoles),
            extendBaseCollection.access,
          );
        }

        extendBaseCollection.labels =
          _extends.labels || extendBaseCollection.labels;
        extendBaseCollection.admin = {
          ...extendBaseCollection.admin,
          ..._extends.admin,
        };
        if (_extends.safeAdminHidden) {
          extendBaseCollection.admin.hidden = evaluateSafeFn(
            _extends.safeAdminHidden,
          );
          delete _extends.safeAdminHidden;
        }
        extendBaseCollection.fields = this.ToggleHiddenFields(
          extendBaseCollection.fields,
          _extends.hiddenFields,
        ).concat(_extends.fields || []);
      }
      return extendBaseCollection;
    }
    result.access = this.TransformToAccess(result.safeAccess);
    if (result.accessByRoles) {
      result.access = this.TransformToAccess(
        this.TransformFromRolesToAccess(result.accessByRoles),
        result.access,
      );
      delete result.accessByRoles;
    }
    delete result.safeAccess;
    result.fields.push({
      type: "json",
      name: "descriptionSerialized",
      admin: {
        hidden: true,
      },
    });
    result.fields = result.fields.map((field) => this.TransformToField(field));
    return result;
  }
  FilterValidCollections(
    config: Config | SanitizedConfig,
    incomingCollections: CollectionConfigWithExtends[],
  ) {
    const sortedCollections = this.SortCollectionsByRelations(
      config,
      incomingCollections,
    );
    for (const collection of sortedCollections) {
      const { extends: _extends } = collection;
      let collectionConfig;
      if (_extends) {
        collectionConfig = this.TransformCollection(config, collection);
        continue;
      }
      collectionConfig = this.TransformCollection(config, collection);
      const result = collectionSchema.validate(
        sanitizeCollection(config, collectionConfig),
        {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: false,
        },
      );
      if (result?.error) {
        MZingaLogger.Instance?.error(
          `There was a problem with collection '${
            collection.slug
          }'.\nerror: ${result.error}.\nPlease check your input\n${JSON.stringify(collection)}`,
        );
        continue;
      }
      config.collections.push(collectionConfig);
    }
  }
  GetRelationsForCollection(collection: CollectionConfigWithExtends) {
    const mapRelationFields = collection.fields
      .filter((f) => f.type === "relationship" || f.type === "upload")
      .map((f) => (f as RelationshipField).relationTo)
      .flat();
    const mapArrayFields = collection.fields
      .filter((f) => f.type === "array")
      .map((f) =>
        (f as ArrayField).fields
          .filter((f) => f.type === "relationship" || f.type === "upload")
          .map((f) => (f as RelationshipField).relationTo)
          .flat(),
      )
      .flat();
    const mapGroupFields = collection.fields
      .filter((f) => f.type === "group")
      .map((f) =>
        (f as GroupField).fields
          .filter((f) => f.type === "relationship" || f.type === "upload")
          .map((f) => (f as RelationshipField).relationTo)
          .flat(),
      )
      .flat();
    return [...mapRelationFields, ...mapArrayFields, ...mapGroupFields].flat();
  }
  traverse(
    configSlugs: string[],
    incomingCollections: CollectionConfigWithExtends[],
    graph: CollectionGraph,
  ) {
    const customEntityRelatedCollections = Object.values(graph).flat();
    const relatedSlugs = customEntityRelatedCollections.map((c) => c.slug);
    incomingCollections.forEach((c, idx) => {
      if (
        Object.values(graph)
          .flat()
          .find((g) => g.slug === c.slug)
      ) {
        incomingCollections.splice(idx, 1);
        this.traverse(configSlugs, incomingCollections, graph);
        return;
      }
      const relationForCollection = this.GetRelationsForCollection(c);
      if (!relationForCollection.length) {
        graph[CollectionGraphKeys.NoRelation].push(c);
        incomingCollections.splice(idx, 1);
        this.traverse(configSlugs, incomingCollections, graph);
        return;
      }
      if (relationForCollection.every((r) => configSlugs.includes(r))) {
        graph[CollectionGraphKeys.BaseEntity].push(c);
        incomingCollections.splice(idx, 1);
        this.traverse(configSlugs, incomingCollections, graph);
        return;
      }
      if (
        relationForCollection.every((r) =>
          [configSlugs, relatedSlugs].flat().includes(r),
        )
      ) {
        graph[CollectionGraphKeys.CustomEntity].push(c);
        incomingCollections.splice(idx, 1);
        this.traverse(configSlugs, incomingCollections, graph);
        return;
      }
    });
  }
  SortCollectionsByRelations(
    config: Config | SanitizedConfig,
    incomingCollections: CollectionConfigWithExtends[],
  ) {
    const graph = {
      [CollectionGraphKeys.NoRelation]: [],
      [CollectionGraphKeys.BaseEntity]: [],
      [CollectionGraphKeys.CustomEntity]: [],
    } as CollectionGraph;
    this.traverse(
      config.collections.map((c) => c.slug),
      [].concat(incomingCollections),
      graph,
    );
    const result = Object.values(graph).flat();
    return result;
  }
  IsEnabled(collection: CollectionConfig | undefined) {
    if (!collection) {
      return false;
    }
    return this.config.EnabledCollections[collection.slug];
  }
  IsEnabledBySlug(slug: string) {
    const collection = this.GetEnabledCollections().find(
      (c) => c.slug === slug,
    );
    if (!collection) {
      return false;
    }
    return this.IsEnabled(collection);
  }
  GetEnabledCollections() {
    return this.collections.filter((c) => {
      return this.IsEnabled(c);
    });
  }
  GetDisabledCollections() {
    return this.collections.filter((c) => {
      return !this.IsEnabled(c);
    });
  }
  GetFilteredCollections() {
    return this.GetEnabledCollections().map((c) => {
      const filteredFields = this.FilterFields(
        c.slug,
        this.FilterRelationships(c.fields),
      );
      return {
        ...c,
        fields: this.webHooks.EnrichFields(c.slug, filteredFields),
        hooks: this.webHooks.EnrichCollection(c),
      };
    });
  }
  FilterFields(collectionSlug: string, fields: Field[]): Field[] {
    const disableFieldsByCollection = (
      this.config.Env[
        `PAYLOAD_PUBLIC_DISABLE_FIELDS_${collectionSlug.toUpperCase()}`
      ] || ""
    ).split(",");
    return fields
      .map((f) => {
        const fieldName = (f as FieldBase).name || undefined;
        if (!fieldName) {
          return f;
        }
        return disableFieldsByCollection.indexOf(fieldName) === -1
          ? f
          : undefined;
      })
      .filter(Boolean);
  }
  FilterRelationships(fields: Field[]) {
    const disabledCollections = this.GetDisabledCollections();
    return fields.filter((f) => {
      if (f.type !== "relationship") {
        return f;
      }
      return (
        disabledCollections.find((c) => {
          if (typeof f.relationTo === "string") {
            return c.slug === f.relationTo;
          }
          return f.relationTo.indexOf(c.slug) !== -1;
        }) === undefined
      );
    });
  }
  GetAccessForPlugins(collectionWithExtends: CollectionConfigWithExtends) {
    let access = {} as any;
    if (!collectionWithExtends) {
      return access;
    }
    if (collectionWithExtends.extends.access) {
      access = this.TransformToAccess(collectionWithExtends.extends.access, {});
    }
    if (collectionWithExtends.extends.accessByRoles) {
      access = this.TransformToAccess(
        this.TransformFromRolesToAccess(
          collectionWithExtends.extends.accessByRoles,
        ),
        {},
      );
    }
    return access;
  }
  async GetEnabledPlugins(
    incomingCollections: CollectionConfigWithExtends[],
  ): Promise<Plugin[]> {
    const extendsForPlugins = incomingCollections.filter(
      (c) =>
        Boolean(c.extends) &&
        (Boolean(c.extends.access) || Boolean(c.extends.accessByRoles)) &&
        (c.extends.collection === Slugs.Plugins.Forms ||
          c.extends.collection === Slugs.Plugins.FormSubmissions),
    );
    const extendsForms = extendsForPlugins.find(
      (c) => c.extends.collection === Slugs.Plugins.Forms,
    );
    const extendsFormSubmissions = extendsForPlugins.find(
      (c) => c.extends.collection === Slugs.Plugins.FormSubmissions,
    );
    const accessForms = this.GetAccessForPlugins(extendsForms);
    const accessFormSubmissions = this.GetAccessForPlugins(
      extendsFormSubmissions,
    );
    const zitadelPlugin = ZitadelStrategyPlugin({
      ui: {
        LoginButton: LoginButton,
      },
      auth: {
        authorizeEndpoint:
          this.config.Env?.PAYLOAD_PUBLIC_ZITADEL_AUTHORIZE_ENDPOINT,
        clientID: this.config.Env?.PAYLOAD_PUBLIC_ZITADEL_CLIENT_ID,
        redirectUri: this.config.Env?.PAYLOAD_PUBLIC_ZITADEL_REDIRECT_URI,
        organizationId: this.config.Env?.PAYLOAD_PUBLIC_ZITADEL_ORGANIZATION_ID,
      },
      fieldsMappings: [
        {
          from: "given_name",
          to: "firstName",
        },
        {
          from: "family_name",
          to: "lastName",
        },
      ],
    });
    const plugins = [] as any[];
    //TODO: migrate payload-swagger to 'mzinga'
    // plugins.push(
    //   swagger({
    //     exclude: {
    //       authPaths: true,
    //       authCollection: true,
    //     },
    //     routes: {
    //       swagger: "/swagger",
    //     },
    //   })
    // );
    plugins.push(
      formBuilder({
        beforeEmail: async (formattedEmails) => {
          for (let formatted of formattedEmails) {
            formatted = TextUtils.FormatEmailHTML(formatted);
          }
          if (process.env.DEBUG_EMAIL_SEND === "1") {
            await Promise.all(
              formattedEmails.map(async (email) => {
                const { to } = email;
                try {
                  const emailPromise = await payload.sendEmail(email);
                  console.log(`Email sent to ${to}`);
                  return emailPromise;
                } catch (err) {
                  if (err?.response?.body?.errors) {
                    err.response.body.errors.forEach((error) =>
                      console.log("%s: %s", error.field, error.message),
                    );
                  } else {
                    console.log(err);
                  }
                }
              }),
            );
          }
          return formattedEmails;
        },
        formOverrides: {
          slug: Slugs.Plugins.Forms,
          versions: {
            drafts: true,
          },
          access: {
            ...accessForms,
          },
          admin: {
            group: "Data",
            hidden: () => {
              return EnvUtils.GetAsBoolean(
                this.config.Env.PAYLOAD_PUBLIC_DISABLE_FORM_PLUGIN,
              );
            },
          },
          fields: [
            TagsField.Get({
              admin: {
                position: "sidebar",
              },
            }),
            SummaryField.Get({
              admin: {
                position: "sidebar",
              },
            }),
            PublishDateField.Get(),
            IsPrivateField.Get(),
            SlugField.Get(),
          ],
          endpoints: [].concat(bySlugEndpoints),
          hooks: {
            beforeChange: [].concat(
              new RichTextHooks("confirmationMessage", "children").beforeChange,
              new RichTextHooks("emails", "message").beforeChange,
            ),
          },
        },
        formSubmissionOverrides: {
          slug: Slugs.Plugins.FormSubmissions,
          access: {
            ...accessFormSubmissions,
          },
          admin: {
            group: "Data",
            hidden: () => {
              return EnvUtils.GetAsBoolean(
                this.config.Env.PAYLOAD_PUBLIC_DISABLE_FORM_PLUGIN,
              );
            },
          },
        },
      }),
    );
    plugins.push(
      exportCollectionsPlugin({
        rootDir: this.config.Env?.TENANT,
      }),
    );
    const collectionsSlugs = [
      Slugs.Stories,
      Slugs.Videos,
      Slugs.MediaGalleries,
    ];
    const enabledCollections = [];

    for (const slug of collectionsSlugs) {
      if (this.IsEnabledBySlug(slug)) {
        enabledCollections.push(slug);
      }
    }
    if (enabledCollections.length) {
      plugins.push(
        seo({
          collections: enabledCollections,
          uploadsCollection: this.IsEnabledBySlug(Slugs.Media)
            ? Slugs.Media
            : "",
          generateTitle: ({ doc }) =>
            `${(doc as any).title.value} ${this.config.Meta?.TitleSuffix}`,
          generateDescription: ({ doc }) => {
            const summary = (doc as any)?.summary?.value;
            const excerpt = (doc as any)?.excerpt?.value;
            return summary || excerpt;
          },
          generateImage: ({ doc }) => (doc as any)?.thumb?.value,
        }),
      );
      if (
        this.config.Env?.REDIS_URI &&
        EnvUtils.GetAsBoolean(
          this.config.Env?.PAYLOAD_PUBLIC_ENABLE_CACHE_PLUGIN,
        )
      ) {
        plugins.push(
          cachePlugin({
            excludedCollections: [Slugs.Users, Slugs.Alerts],
          }),
        );
      }
    }
    if (
      this.config.Env?.PAYLOAD_PUBLIC_ZITADEL_CLIENT_ID &&
      EnvUtils.GetAsBoolean(
        this.config.Env?.PAYLOAD_PUBLIC_ENABLE_ZITADEL_PLUGIN,
      )
    ) {
      plugins.push(zitadelPlugin);
    }
    return plugins;
  }
}
