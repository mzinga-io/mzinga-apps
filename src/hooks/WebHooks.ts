import type { FieldBase } from "mzinga/dist/fields/config/types";
import type { CollectionConfig, Field } from "mzinga/types";
import { messageBusService } from "../messageBusService";
import { MZingaLogger } from "../utils/MZingaLogger";

export const FIELD_LEVEL_HOOKS = [
  "beforeValidate",
  "beforeChange",
  "afterChange",
  "afterRead",
];
export const COLLECTION_LEVEL_HOOKS = [
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

const HOOK_KEY_PREFIX = "HOOKSURL_";
const RABBITMQ_TARGET = "rabbitmq";
/** Marks dispatcher functions so they are never attached twice. */
export const DISPATCHER_MARKER = Symbol.for("mzinga.webhooks.dispatcher");

export type WebHookTarget =
  { type: "http"; url: string } | { type: "rabbitmq" };

export type WebHookSubscription = {
  /** Routing key, e.g. HOOKSURL_STORIES_AFTERCHANGE */
  key: string;
  target: WebHookTarget;
  source: "env" | "db";
  /** Id of the admin-webhooks document, when source is "db" */
  subscriptionId?: string;
};

export type WebHookDocument = {
  id?: string;
  collectionReference?: string;
  webhooks?: {
    event?: string;
    type?: string;
    url?: string;
    fieldReference?: string;
  }[];
};

export const BuildHookKey = (
  collectionSlug: string,
  hookType: string,
  fieldName?: string,
): string =>
  `${HOOK_KEY_PREFIX}${collectionSlug}${
    fieldName ? `_FIELD_${fieldName}` : ""
  }_${hookType}`.toUpperCase();

const ParseTarget = (value: string): WebHookTarget | undefined => {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.toLowerCase() === RABBITMQ_TARGET) {
    return { type: "rabbitmq" };
  }
  return { type: "http", url: trimmed };
};

const TargetIdentity = (target: WebHookTarget): string =>
  target.type === "http" ? `http:${target.url}` : target.type;

/**
 * In-memory list of the active subscriptions, from env variables
 * (HOOKSURL_*) and from the admin-webhooks collection.
 * Dispatchers read it on every call, so changes apply without touching
 * the collection hooks.
 */
export class WebHookRegistry {
  private envSubscriptions = new Map<string, WebHookSubscription[]>();
  private dbSubscriptions = new Map<string, WebHookSubscription[]>();
  private revision = 0;

  /** Replaces the env subscriptions with the HOOKSURL_* entries of env. */
  LoadFromEnv(env: Record<string, unknown> = {}): void {
    const subscriptions = new Map<string, WebHookSubscription[]>();
    for (const [rawKey, value] of Object.entries(env)) {
      if (!rawKey.toUpperCase().startsWith(HOOK_KEY_PREFIX) || !value) {
        continue;
      }
      const key = rawKey.toUpperCase();
      for (const entry of String(value).split(",")) {
        const target = ParseTarget(entry);
        if (target) {
          this.Add(subscriptions, { key, target, source: "env" });
        }
      }
    }
    this.envSubscriptions = subscriptions;
    this.revision++;
  }

  /** Replaces the database subscriptions with the given admin-webhooks documents. */
  SetDbDocuments(docs: WebHookDocument[] = []): void {
    const subscriptions = new Map<string, WebHookSubscription[]>();
    for (const doc of docs) {
      if (!doc?.collectionReference) {
        continue;
      }
      for (const hook of doc.webhooks || []) {
        if (!hook?.event || !hook?.type) {
          continue;
        }
        const target = ParseTarget(
          hook.type === RABBITMQ_TARGET ? RABBITMQ_TARGET : hook.url,
        );
        if (!target) {
          continue;
        }
        this.Add(subscriptions, {
          key: BuildHookKey(
            doc.collectionReference,
            hook.event,
            hook.fieldReference || undefined,
          ),
          target,
          source: "db",
          subscriptionId: doc.id,
        });
      }
    }
    this.dbSubscriptions = subscriptions;
    this.revision++;
  }

  /** Active subscriptions for a key; env first, duplicates of the same target removed. */
  Get(key: string): WebHookSubscription[] {
    const normalizedKey = key.toUpperCase();
    const result: WebHookSubscription[] = [];
    const seen = new Set<string>();
    for (const subscription of [
      ...(this.envSubscriptions.get(normalizedKey) || []),
      ...(this.dbSubscriptions.get(normalizedKey) || []),
    ]) {
      const identity = TargetIdentity(subscription.target);
      if (seen.has(identity)) {
        continue;
      }
      seen.add(identity);
      result.push(subscription);
    }
    return result;
  }

  GetAll(): WebHookSubscription[] {
    const keys = new Set(
      Array.from(this.envSubscriptions.keys()).concat(
        Array.from(this.dbSubscriptions.keys()),
      ),
    );
    return Array.from(keys).flatMap((key) => this.Get(key));
  }

  GetRevision(): number {
    return this.revision;
  }

  private Add(
    map: Map<string, WebHookSubscription[]>,
    subscription: WebHookSubscription,
  ) {
    const list = map.get(subscription.key) || [];
    if (
      !list.some(
        (s) => TargetIdentity(s.target) === TargetIdentity(subscription.target),
      )
    ) {
      list.push(subscription);
    }
    map.set(subscription.key, list);
  }
}

/** Shared by the config, the dispatchers and the sync. */
export const webHookRegistry = new WebHookRegistry();

type Marked = { [DISPATCHER_MARKER]?: string };
type Dispatcher = ((args?: HookArgs) => Promise<undefined>) & Marked;
type HookArgs = {
  data?: unknown;
  doc?: unknown;
  originalDoc?: unknown;
  findMany?: boolean;
  previousDoc?: unknown;
  operation?: string;
};

/**
 * Attaches one dispatcher per collection hook and per top-level field hook.
 * Dispatchers look up the registry when they run, so they are attached
 * once, when the config is built, and never changed at runtime.
 */
export type WebHooksOptions = {
  /**
   * Whether core accepts hooks.afterError on collections. Mzinga core up to
   * 1.0.5 rejects it in the collection config schema, so the afterError
   * dispatcher is attached only when supported.
   */
  supportsCollectionAfterError?: boolean;
};

export class WebHooks {
  constructor(
    private readonly env: Record<string, unknown> = {},
    private readonly registry: WebHookRegistry = webHookRegistry,
    private readonly options: WebHooksOptions = {},
  ) {
    this.registry.LoadFromEnv(env);
    MZingaLogger.Instance?.debug(
      `[WEBHOOKS] Loaded ${this.registry.GetAll().length} subscription(s) from environment variables`,
    );
  }

  GetRegistry(): WebHookRegistry {
    return this.registry;
  }

  /** Attaches dispatchers to a collection and its top-level fields. Idempotent; mutates and returns the collection. */
  AttachToCollection<T extends CollectionConfig>(collection: T): T {
    const hooks = (collection.hooks = collection.hooks || {}) as Record<
      string,
      unknown
    >;
    for (const hookType of COLLECTION_LEVEL_HOOKS) {
      if (hookType === "afterError") {
        if (this.options.supportsCollectionAfterError) {
          hooks.afterError = this.WrapAfterError(
            hooks.afterError,
            this.CreateDispatcher(collection.slug, hookType),
          );
        }
        continue;
      }
      hooks[hookType] = this.AppendOnce(
        hooks[hookType],
        this.CreateDispatcher(collection.slug, hookType),
      );
    }
    collection.fields = this.AttachToFields(collection.slug, collection.fields);
    return collection;
  }

  /** Returns copies of the fields with field dispatchers attached; the original field objects are not modified. */
  AttachToFields(collectionSlug: string, fields: Field[] = []): Field[] {
    return fields.map((field) => {
      const fieldName = (field as FieldBase).name;
      if (field.type === "ui" || !fieldName) {
        return field;
      }
      const currentHooks = ((field as FieldBase).hooks || {}) as Record<
        string,
        unknown
      >;
      const hooks = { ...currentHooks };
      for (const hookType of FIELD_LEVEL_HOOKS) {
        hooks[hookType] = this.AppendOnce(
          currentHooks[hookType],
          this.CreateDispatcher(collectionSlug, hookType, fieldName),
        );
      }
      return { ...field, hooks } as Field;
    });
  }

  CreateDispatcher(
    collectionSlug: string,
    hookType: string,
    fieldName?: string,
  ): Dispatcher {
    const key = BuildHookKey(collectionSlug, hookType, fieldName);
    const eventKey = fieldName
      ? `${collectionSlug}.${fieldName}`
      : collectionSlug;
    const dispatch = async (args: HookArgs = {}): Promise<undefined> => {
      const subscriptions = this.registry.Get(key);
      if (!subscriptions.length) {
        return undefined;
      }
      const eventData = {
        hook: { envKey: key, key: eventKey, type: hookType },
        data: args.data,
        doc: args.doc,
        originalDoc: args.originalDoc,
        findMany: args.findMany,
        previousDoc: args.previousDoc,
        operation: args.operation,
      };
      await Promise.all(
        subscriptions.map((subscription) =>
          this.Deliver(subscription, eventData),
        ),
      );
      // Webhooks never change the document or the hook result.
      return undefined;
    };
    return Object.assign(dispatch, { [DISPATCHER_MARKER]: key });
  }

  private async Deliver(
    subscription: WebHookSubscription,
    eventData: { hook: { envKey: string } },
  ): Promise<void> {
    const key = eventData.hook.envKey;
    if (subscription.target.type === "rabbitmq") {
      if (!this.env.RABBITMQ_URL || this.env.IS_BUILD_PROCESS) {
        MZingaLogger.Instance?.debug(
          `[RABBITMQHOOK] ${key}: RABBITMQ_URL not set. Skipping publishing event.`,
        );
        return;
      }
      if (!messageBusService.isConnected()) {
        MZingaLogger.Instance?.info(
          `[RABBITMQHOOK] ${key}: RabbitMQ connection is not established. Skipping publishing event.`,
        );
        return;
      }
      try {
        MZingaLogger.Instance?.debug(
          `[RABBITMQHOOK] ${key}: ${JSON.stringify(eventData)}`,
        );
        await messageBusService.publishEvent({ type: key, data: eventData });
      } catch (error) {
        MZingaLogger.Instance?.error(
          `Failed to publish event to RabbitMQ:`,
          error,
        );
      }
      return;
    }
    const { url } = subscription.target;
    // Fire and forget, as before; reliable delivery comes with the outbox.
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    })
      .then((response) => {
        if (!response.ok) {
          MZingaLogger.Instance?.info(
            `[URLHOOK] There was an error requesting: ${url} (key: ${key}) ${response.status}=${response.statusText}`,
          );
          return;
        }
        MZingaLogger.Instance?.debug(
          `[URLHOOK] ${url} (key: ${key}): ${JSON.stringify(eventData)}`,
        );
      })
      .catch((e) => {
        MZingaLogger.Instance?.info(
          `[URLHOOK] There was an error requesting: ${url} (key: ${key}) ${e.message}`,
        );
      });
  }

  private AppendOnce(current: unknown, dispatcher: Dispatcher): unknown[] {
    const list = ([] as unknown[]).concat(current || []);
    if (
      list.some(
        (fn) =>
          (fn as Marked)?.[DISPATCHER_MARKER] === dispatcher[DISPATCHER_MARKER],
      )
    ) {
      return list;
    }
    return [...list, dispatcher];
  }

  /**
   * afterError is a single function in core, not an array: wrap the existing
   * one, keep its result (core uses it as the error response) and notify after it.
   */
  private WrapAfterError(current: unknown, dispatcher: Dispatcher): unknown {
    if (
      (current as Marked)?.[DISPATCHER_MARKER] === dispatcher[DISPATCHER_MARKER]
    ) {
      return current;
    }
    const original =
      typeof current === "function"
        ? (current as (...args: unknown[]) => unknown)
        : undefined;
    const wrapped = async (
      err: Error,
      response: unknown,
      ...rest: unknown[]
    ): Promise<unknown> => {
      const result = original
        ? await original(err, response, ...rest)
        : undefined;
      await dispatcher({
        data: { error: { name: err?.name, message: err?.message } },
      });
      return result;
    };
    return Object.assign(wrapped, {
      [DISPATCHER_MARKER]: dispatcher[DISPATCHER_MARKER],
    });
  }
}
