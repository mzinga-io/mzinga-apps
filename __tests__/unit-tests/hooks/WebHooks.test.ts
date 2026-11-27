import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { CollectionConfig, Field, FieldBase } from "mzinga/types";
import {
  BuildHookKey,
  DISPATCHER_MARKER,
  WebHookRegistry,
  WebHooks,
} from "../../../src/hooks/WebHooks";
import { messageBusService } from "../../../src/messageBusService";

jest.mock("rabbitmq-client", () => ({
  Connection: jest.fn(),
}));

const RABBITMQ_ENV = { RABBITMQ_URL: "amqp://localhost:5672" };

const buildCollection = (
  overrides: Partial<CollectionConfig> = {},
): CollectionConfig => ({
  slug: "stories",
  fields: [
    { name: "title", type: "text" },
    { name: "body", type: "textarea" },
  ],
  ...overrides,
});

type TestHook = ((args?: object) => Promise<unknown>) & {
  [DISPATCHER_MARKER]?: string;
};
const dispatchersOf = (hooks: unknown[] = []) =>
  (hooks as TestHook[]).filter((fn) => fn?.[DISPATCHER_MARKER]);

describe("hooks", () => {
  describe("WebHookRegistry", () => {
    it("builds keys in the HOOKSURL format", () => {
      expect(BuildHookKey("stories", "afterChange")).toBe(
        "HOOKSURL_STORIES_AFTERCHANGE",
      );
      expect(BuildHookKey("stories", "afterChange", "title")).toBe(
        "HOOKSURL_STORIES_FIELD_TITLE_AFTERCHANGE",
      );
    });

    it("loads comma-separated targets from env variables", () => {
      const registry = new WebHookRegistry();
      registry.LoadFromEnv({
        HOOKSURL_STORIES_AFTERCHANGE: "http://a.example/hook, rabbitmq,",
        OTHER_VARIABLE: "ignored",
      });
      const subscriptions = registry.Get("HOOKSURL_STORIES_AFTERCHANGE");
      expect(subscriptions.map((s) => s.target)).toEqual([
        { type: "http", url: "http://a.example/hook" },
        { type: "rabbitmq" },
      ]);
      expect(subscriptions.every((s) => s.source === "env")).toBe(true);
      expect(registry.GetAll()).toHaveLength(2);
    });

    it("accepts RABBITMQ in any case, as documented in the README", () => {
      const registry = new WebHookRegistry();
      registry.LoadFromEnv({ HOOKSURL_STORIES_AFTERCHANGE: "RABBITMQ" });
      expect(registry.Get("HOOKSURL_STORIES_AFTERCHANGE")[0].target).toEqual({
        type: "rabbitmq",
      });
    });

    it("merges database subscriptions with env subscriptions without duplicates", () => {
      const registry = new WebHookRegistry();
      registry.LoadFromEnv({
        HOOKSURL_STORIES_BEFOREVALIDATE: "http://example.com/webhook",
      });
      registry.SetDbDocuments([
        {
          id: "1",
          collectionReference: "stories",
          webhooks: [
            { event: "beforeValidate", type: "rabbitmq" },
            {
              event: "beforeValidate",
              type: "http",
              url: "http://example.com/webhook",
            },
          ],
        },
      ]);
      const subscriptions = registry.Get("HOOKSURL_STORIES_BEFOREVALIDATE");
      expect(subscriptions.map((s) => [s.source, s.target.type])).toEqual([
        ["env", "http"],
        ["db", "rabbitmq"],
      ]);
    });

    it("maps field references to field keys", () => {
      const registry = new WebHookRegistry();
      registry.SetDbDocuments([
        {
          id: "1",
          collectionReference: "stories",
          webhooks: [
            {
              event: "beforeChange",
              type: "http",
              url: "http://example.com/webhook2",
              fieldReference: "title",
            },
          ],
        },
      ]);
      expect(
        registry.Get("HOOKSURL_STORIES_FIELD_TITLE_BEFORECHANGE"),
      ).toHaveLength(1);
      expect(registry.Get("HOOKSURL_STORIES_BEFORECHANGE")).toHaveLength(0);
    });

    it("replaces database subscriptions on update and removes them on delete", () => {
      const registry = new WebHookRegistry();
      const key = "HOOKSURL_STORIES_AFTERCHANGE";
      registry.SetDbDocuments([
        {
          id: "1",
          collectionReference: "stories",
          webhooks: [{ event: "afterChange", type: "http", url: "http://old" }],
        },
      ]);
      registry.SetDbDocuments([
        {
          id: "1",
          collectionReference: "stories",
          webhooks: [{ event: "afterChange", type: "http", url: "http://new" }],
        },
      ]);
      expect(registry.Get(key).map((s) => s.target)).toEqual([
        { type: "http", url: "http://new" },
      ]);
      registry.SetDbDocuments([]);
      expect(registry.Get(key)).toHaveLength(0);
    });

    it("ignores incomplete database entries", () => {
      const registry = new WebHookRegistry();
      registry.SetDbDocuments([
        { id: "1", webhooks: [{ event: "afterChange", type: "rabbitmq" }] },
        {
          id: "2",
          collectionReference: "stories",
          webhooks: [
            { type: "rabbitmq" },
            { event: "afterChange" },
            { event: "afterChange", type: "http" },
          ],
        },
      ]);
      expect(registry.GetAll()).toHaveLength(0);
    });

    it("increments the revision on every change", () => {
      const registry = new WebHookRegistry();
      const start = registry.GetRevision();
      registry.LoadFromEnv({});
      registry.SetDbDocuments([]);
      expect(registry.GetRevision()).toBe(start + 2);
    });
  });

  describe("WebHooks dispatchers", () => {
    let registry: WebHookRegistry;
    let fetchMock: jest.Mock<typeof fetch>;

    beforeEach(() => {
      registry = new WebHookRegistry();
      fetchMock = jest.fn<typeof fetch>(() =>
        Promise.resolve({ ok: true, status: 200 } as Response),
      );
      global.fetch = fetchMock;
    });

    it("attaches exactly one dispatcher per hook, however many times it runs", () => {
      const webHooks = new WebHooks({}, registry);
      const collection = buildCollection();
      webHooks.AttachToCollection(collection);
      webHooks.AttachToCollection(collection);
      webHooks.AttachToCollection(collection);
      expect(dispatchersOf(collection.hooks.afterChange)).toHaveLength(1);
      expect(dispatchersOf(collection.hooks.beforeRead)).toHaveLength(1);
      const title = collection.fields[0] as FieldBase;
      expect(dispatchersOf(title.hooks.afterChange)).toHaveLength(1);
    });

    it("keeps existing hooks first", async () => {
      const webHooks = new WebHooks({}, registry);
      const existing = jest.fn(() => "42");
      const collection = buildCollection({
        hooks: { afterChange: [existing as never] },
      });
      webHooks.AttachToCollection(collection);
      expect(collection.hooks.afterChange).toHaveLength(2);
      expect(collection.hooks.afterChange[0]).toBe(existing);
    });

    it("does not modify field objects shared with other collections", () => {
      const webHooks = new WebHooks({}, registry);
      const sharedField: Field = { name: "title", type: "text", hooks: {} };
      const stories = buildCollection({ fields: [sharedField] });
      const tags = buildCollection({ slug: "tags", fields: [sharedField] });
      webHooks.AttachToCollection(stories);
      webHooks.AttachToCollection(tags);
      expect(sharedField.hooks).toEqual({});
      const storiesKey = (stories.fields[0] as FieldBase).hooks.afterChange[0][
        DISPATCHER_MARKER
      ];
      const tagsKey = (tags.fields[0] as FieldBase).hooks.afterChange[0][
        DISPATCHER_MARKER
      ];
      expect(storiesKey).toBe("HOOKSURL_STORIES_FIELD_TITLE_AFTERCHANGE");
      expect(tagsKey).toBe("HOOKSURL_TAGS_FIELD_TITLE_AFTERCHANGE");
    });

    it("skips ui fields and fields without a name", () => {
      const webHooks = new WebHooks({}, registry);
      const uiField = { name: "preview", type: "ui", admin: {} } as Field;
      const rowField: Field = { type: "row", fields: [] };
      const collection = buildCollection({ fields: [uiField, rowField] });
      webHooks.AttachToCollection(collection);
      expect(collection.fields[0]).toBe(uiField);
      expect(collection.fields[1]).toBe(rowField);
    });

    it("does nothing when no subscription matches", async () => {
      const webHooks = new WebHooks({}, registry);
      const collection = webHooks.AttachToCollection(buildCollection());
      const result = await dispatchersOf(collection.hooks.afterChange)[0]({
        doc: { id: "1" },
      });
      expect(result).toBeUndefined();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("applies subscriptions added after the hooks were attached", async () => {
      const webHooks = new WebHooks({}, registry);
      const collection = webHooks.AttachToCollection(buildCollection());
      const dispatcher = dispatchersOf(collection.hooks.afterChange)[0];
      registry.SetDbDocuments([
        {
          id: "1",
          collectionReference: "stories",
          webhooks: [
            { event: "afterChange", type: "http", url: "http://example.com" },
          ],
        },
      ]);
      await dispatcher({ doc: { id: "1" }, operation: "update" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      registry.SetDbDocuments([]);
      await dispatcher({ doc: { id: "1" }, operation: "update" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("sends an env subscription exactly once", async () => {
      const webHooks = new WebHooks(
        { HOOKSURL_STORIES_AFTERCHANGE: "http://example.com/hook" },
        registry,
      );
      const collection = buildCollection();
      webHooks.AttachToCollection(collection);
      webHooks.AttachToCollection(collection);
      for (const hook of collection.hooks.afterChange) {
        await (hook as TestHook)({ doc: { id: "1" } });
      }
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("posts the same payload as before to HTTP targets", async () => {
      const webHooks = new WebHooks(
        { HOOKSURL_STORIES_FIELD_TITLE_AFTERCHANGE: "http://example.com/hook" },
        registry,
      );
      const collection = webHooks.AttachToCollection(buildCollection());
      const titleHooks = (collection.fields[0] as FieldBase).hooks.afterChange;
      const args = {
        data: { title: "new" },
        originalDoc: { title: "old" },
        previousDoc: undefined,
        findMany: undefined,
        operation: "update",
      };
      const result = await (titleHooks[0] as TestHook)(args);
      expect(result).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith("http://example.com/hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hook: {
            envKey: "HOOKSURL_STORIES_FIELD_TITLE_AFTERCHANGE",
            key: "stories.title",
            type: "afterChange",
          },
          data: args.data,
          originalDoc: args.originalDoc,
          operation: "update",
        }),
      });
    });

    it("never throws when an HTTP target fails", async () => {
      fetchMock.mockImplementation(() => Promise.reject(new Error("down")));
      const webHooks = new WebHooks(
        { HOOKSURL_STORIES_AFTERCHANGE: "http://example.com/hook" },
        registry,
      );
      const collection = webHooks.AttachToCollection(buildCollection());
      await expect(
        dispatchersOf(collection.hooks.afterChange)[0]({ doc: {} }),
      ).resolves.toBeUndefined();
    });

    it("checks the RabbitMQ connection when the event is sent", async () => {
      const connected = jest
        .spyOn(messageBusService, "isConnected")
        .mockReturnValue(false);
      const publish = jest
        .spyOn(messageBusService, "publishEvent")
        .mockImplementation(() => Promise.resolve());
      const webHooks = new WebHooks(
        { ...RABBITMQ_ENV, HOOKSURL_STORIES_BEFOREVALIDATE: "rabbitmq" },
        registry,
      );
      const collection = webHooks.AttachToCollection(buildCollection());
      const dispatcher = dispatchersOf(collection.hooks.beforeValidate)[0];

      await dispatcher({ data: null, operation: "create" });
      expect(publish).not.toHaveBeenCalled();

      connected.mockReturnValue(true);
      const args = {
        data: null,
        doc: null,
        findMany: undefined,
        previousDoc: undefined,
        originalDoc: null,
        operation: "create",
      };
      await dispatcher(args);
      expect(publish).toHaveBeenCalledWith({
        type: "HOOKSURL_STORIES_BEFOREVALIDATE",
        data: {
          hook: {
            envKey: "HOOKSURL_STORIES_BEFOREVALIDATE",
            key: "stories",
            type: "beforeValidate",
          },
          ...args,
        },
      });
      connected.mockRestore();
      publish.mockRestore();
    });

    it("does not post RabbitMQ subscriptions as HTTP when RABBITMQ_URL is missing", async () => {
      const webHooks = new WebHooks(
        { HOOKSURL_STORIES_AFTERCHANGE: "rabbitmq" },
        registry,
      );
      const collection = webHooks.AttachToCollection(buildCollection());
      await dispatchersOf(collection.hooks.afterChange)[0]({ doc: {} });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("does not attach afterError when core rejects it on collections", () => {
      const webHooks = new WebHooks(
        { HOOKSURL_STORIES_AFTERERROR: "http://example.com/hook" },
        registry,
      );
      const collection = webHooks.AttachToCollection(buildCollection());
      expect(collection.hooks.afterError).toBeUndefined();
    });

    it("wraps afterError as a single function when core supports it", async () => {
      const original = jest.fn(() => ({ response: "x", status: 500 }));
      const webHooks = new WebHooks(
        { HOOKSURL_STORIES_AFTERERROR: "http://example.com/hook" },
        registry,
        { supportsCollectionAfterError: true },
      );
      const collection = buildCollection({
        hooks: { afterError: original as never },
      });
      webHooks.AttachToCollection(collection);
      webHooks.AttachToCollection(collection);
      const afterError = collection.hooks.afterError as unknown as (
        ...args: unknown[]
      ) => Promise<unknown>;
      expect(typeof afterError).toBe("function");
      const result = await afterError(new Error("boom"), "response", {}, null);
      expect(result).toEqual({ response: "x", status: 500 });
      expect(original).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
      expect(body.hook.envKey).toBe("HOOKSURL_STORIES_AFTERERROR");
      expect(body.data).toEqual({ error: { name: "Error", message: "boom" } });
    });

    it("returns undefined from afterError when there was no original hook", async () => {
      const webHooks = new WebHooks({}, registry, {
        supportsCollectionAfterError: true,
      });
      const collection = webHooks.AttachToCollection(buildCollection());
      const afterError = collection.hooks.afterError as unknown as (
        ...args: unknown[]
      ) => Promise<unknown>;
      await expect(
        afterError(new Error("boom"), "response", {}, null),
      ).resolves.toBeUndefined();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
