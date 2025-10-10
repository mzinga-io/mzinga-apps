import { FieldBase } from "mzinga/dist/fields/config/types";
import { CollectionConfig, Field } from "mzinga/types";
import { messageBusService } from "../messageBusService";
import { EnvConfig } from "../types";
import { MZingaLogger } from "../utils/MZingaLogger";
const FIELD_LEVEL_HOOKS = [
  "beforeValidate",
  "beforeChange",
  "afterChange",
  "afterRead",
];
const COLLECTION_LEVEL_HOOKS = [
  "beforeOperation",
  "beforeValidate",
  "beforeChange",
  "afterChange",
  "beforeRead",
  "afterRead",
  "beforeDelete",
  "afterDelete",
  "afterError",
  "beforeLogin",
  "afterLogin",
  "afterLogout",
  "afterMe",
  "afterRefresh",
  "afterForgotPassword",
];
export class WebHooks {
  constructor(private readonly env: EnvConfig) {}
  EnrichFields(collectionSlug: string, fields: Field[]): Field[] {
    return fields.map((field) => {
      const hooks =
        field.type !== "ui"
          ? {
              hooks: this.EnrichField(collectionSlug, field),
            }
          : undefined;
      return {
        ...field,
        ...hooks,
      };
    });
  }
  EnrichField(
    collectionSlug: string,
    field: Field
  ): Partial<FieldBase["hooks"]> {
    const fieldHooks = (field as FieldBase).hooks || {};
    const fieldName = (field as FieldBase).name || undefined;
    if (!fieldName) {
      return {};
    }
    return this.AddHooksFromList(
      FIELD_LEVEL_HOOKS,
      fieldHooks,
      `HOOKSURL_${collectionSlug}_FIELD_${fieldName}`
    );
  }
  AddHooksFromList(
    allHooksList: string[],
    originalHooks: any,
    hookEnvBaseKey: string
  ): any {
    for (const hookType of allHooksList) {
      const envUrlsKey = `${hookEnvBaseKey}_${hookType}`.toUpperCase();
      const envUrls = this.env[envUrlsKey];
      if (!envUrls) {
        continue;
      }
      const hooks = envUrls
        .split(",")
        .map((url) => {
          if (!url) {
            return undefined;
          }
          if (
            url === "rabbitmq" &&
            this.env.RABBITMQ_URL &&
            !this.env.IS_BUILD_PROCESS
          ) {
            if (!messageBusService.isConnected()) {
              MZingaLogger.Instance?.info(
                "RabbitMQ connection is not established. Skipping publishing event."
              );
              return undefined;
            }
            return async (args) => {
              const eventData = {
                hook: {
                  envKey: envUrlsKey,
                  key: hookEnvBaseKey
                    .replace("HOOKSURL_", "")
                    .replace("_FIELD_", "."),
                  type: hookType,
                },
                data: args.data,
                doc: args.doc,
                originalDoc: args.originalDoc,
                findMany: args.findMany,
                previousDoc: args.previousDoc,
                operation: args.operation,
              };
              try {
                MZingaLogger.Instance?.debug(
                  `[RABBITMQHOOK] ${envUrlsKey}: ${JSON.stringify(eventData)}`
                );
                await messageBusService.publishEvent({
                  type: envUrlsKey,
                  data: eventData,
                });
              } catch (error) {
                MZingaLogger.Instance?.error(
                  `Failed to publish event to RabbitMQ:`,
                  error
                );
              }
            };
          }
          return async (args) => {
            const eventData = {
              hook: {
                envKey: envUrlsKey,
                key: hookEnvBaseKey
                  .replace("HOOKSURL_", "")
                  .replace("_FIELD_", "."),
                type: hookType,
              },
              data: args.data,
              doc: args.doc,
              originalDoc: args.originalDoc,
              findMany: args.findMany,
              previousDoc: args.previousDoc,
              operation: args.operation,
            };

            // Send HTTP request
            fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(eventData),
            }).catch((e) => {
              MZingaLogger.Instance?.info(
                `There was an error requesting: ${url} (key: ${envUrlsKey}) ${e.message}`
              );
            });
          };
        })
        .filter(Boolean);
      originalHooks[hookType] = [].concat(hooks[hookType] || [], hooks);
    }
    return originalHooks;
  }
  EnrichCollection(
    collectionConfig: CollectionConfig
  ): Partial<CollectionConfig["hooks"]> {
    const collectionHooks = this.AddHooksFromList(
      COLLECTION_LEVEL_HOOKS,
      collectionConfig.hooks || {},
      `HOOKSURL_${collectionConfig.slug}`
    );
    return collectionHooks;
  }
}
