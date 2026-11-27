import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { EventEmitter } from "events";
import type { Payload } from "mzinga";
import { WebHookRegistry } from "../../../src/hooks/WebHooks";
import { WebHooksSync } from "../../../src/hooks/WebHooksSync";

jest.mock("rabbitmq-client", () => ({
  Connection: jest.fn(),
}));

const KEY = "HOOKSURL_STORIES_AFTERCHANGE";

const webhookDoc = (id: string, url: string, updatedAt: string) => ({
  id,
  collectionReference: "stories",
  updatedAt,
  webhooks: [{ event: "afterChange", type: "http", url }],
});

/** Minimal stand-in for payload.find on admin-webhooks, with an optional change stream. */
const buildPayload = (
  initialDocs: ReturnType<typeof webhookDoc>[],
  options: { withChangeStream?: boolean; failWatch?: boolean } = {},
) => {
  const state = { docs: [...initialDocs] };
  const stream = Object.assign(new EventEmitter(), {
    close: jest.fn(() => Promise.resolve()),
  });
  const watch = jest.fn(() => {
    if (options.failWatch) {
      throw new Error("not a replica set");
    }
    return stream;
  });
  const find = jest.fn(
    async (args: { sort?: string; page?: number; limit: number }) => {
      const sorted = [...state.docs].sort((a, b) =>
        args.sort === "-updatedAt"
          ? b.updatedAt.localeCompare(a.updatedAt)
          : a.id.localeCompare(b.id),
      );
      const start = (args.page ? args.page - 1 : 0) * args.limit;
      return {
        docs: sorted.slice(start, start + args.limit),
        totalDocs: sorted.length,
        hasNextPage: start + args.limit < sorted.length,
      };
    },
  );
  const payload = {
    collections: { "admin-webhooks": {} },
    db: options.withChangeStream
      ? { collections: { "admin-webhooks": { watch } } }
      : {},
    find,
  } as unknown as Payload & { collections: Record<string, object> };
  return { payload, state, stream, watch, find };
};

describe("hooks", () => {
  describe("WebHooksSync", () => {
    let registry: WebHookRegistry;
    let sync: WebHooksSync;

    beforeEach(() => {
      registry = new WebHookRegistry();
    });
    afterEach(async () => {
      await sync?.Stop();
      jest.useRealTimers();
    });

    it("loads every page of admin-webhooks on start", async () => {
      const docs = Array.from({ length: 150 }, (_, i) =>
        webhookDoc(String(i).padStart(3, "0"), `http://h/${i}`, "2026-01-01"),
      );
      const { payload } = buildPayload(docs);
      sync = new WebHooksSync(registry, { intervalMs: 0 });
      await sync.Start(payload);
      expect(registry.Get(KEY)).toHaveLength(150);
    });

    it("does nothing when admin-webhooks is disabled", async () => {
      const { payload, find } = buildPayload([]);
      payload.collections = {};
      sync = new WebHooksSync(registry, { intervalMs: 0 });
      await sync.Start(payload);
      expect(find).not.toHaveBeenCalled();
    });

    it("reloads on poll when a document is added, updated or deleted", async () => {
      const { payload, state } = buildPayload([
        webhookDoc("1", "http://old", "2026-01-01"),
      ]);
      sync = new WebHooksSync(registry, { intervalMs: 0 });
      await sync.Start(payload);

      state.docs = [webhookDoc("1", "http://new", "2026-01-02")];
      await sync.Poll();
      expect(
        registry
          .Get(KEY)
          .map((s) => (s.target.type === "http" ? s.target.url : undefined)),
      ).toEqual(["http://new"]);

      state.docs = [];
      await sync.Poll();
      expect(registry.Get(KEY)).toHaveLength(0);
    });

    it("skips the reload when nothing changed", async () => {
      const { payload, find } = buildPayload([
        webhookDoc("1", "http://a", "2026-01-01"),
      ]);
      sync = new WebHooksSync(registry, { intervalMs: 0 });
      await sync.Start(payload);
      find.mockClear();
      await sync.Poll();
      // Only the fingerprint query runs.
      expect(find).toHaveBeenCalledTimes(1);
    });

    it("reloads when the change stream reports a change", async () => {
      jest.useFakeTimers();
      const { payload, state, stream, watch } = buildPayload(
        [webhookDoc("1", "http://a", "2026-01-01")],
        { withChangeStream: true },
      );
      sync = new WebHooksSync(registry, { intervalMs: 0, debounceMs: 10 });
      await sync.Start(payload);
      expect(watch).toHaveBeenCalledTimes(1);

      state.docs.push(webhookDoc("2", "http://b", "2026-01-02"));
      stream.emit("change", {});
      stream.emit("change", {});
      await jest.advanceTimersByTimeAsync(20);
      expect(registry.Get(KEY)).toHaveLength(2);
    });

    it("falls back to polling and retries the change stream after an error", async () => {
      const { payload, stream, watch } = buildPayload([], {
        withChangeStream: true,
      });
      sync = new WebHooksSync(registry, { intervalMs: 0 });
      await sync.Start(payload);
      stream.emit("error", new Error("connection lost"));
      expect(stream.close).toHaveBeenCalled();
      await sync.Poll();
      expect(watch).toHaveBeenCalledTimes(2);
    });

    it("keeps working when change streams are not supported", async () => {
      const { payload, state } = buildPayload([], {
        withChangeStream: true,
        failWatch: true,
      });
      sync = new WebHooksSync(registry, { intervalMs: 0 });
      await sync.Start(payload);
      state.docs.push(webhookDoc("1", "http://a", "2026-01-01"));
      await sync.Poll();
      expect(registry.Get(KEY)).toHaveLength(1);
    });

    it("serialises concurrent reloads and applies the latest state", async () => {
      const { payload, state } = buildPayload([]);
      sync = new WebHooksSync(registry, { intervalMs: 0 });
      await sync.Start(payload);
      state.docs.push(webhookDoc("1", "http://a", "2026-01-01"));
      const first = sync.Reload();
      state.docs.push(webhookDoc("2", "http://b", "2026-01-02"));
      const second = sync.Reload();
      await Promise.all([first, second]);
      expect(registry.Get(KEY)).toHaveLength(2);
    });

    it("polls on the configured interval", async () => {
      jest.useFakeTimers();
      const { payload, state } = buildPayload([]);
      sync = new WebHooksSync(registry, { intervalMs: 1000 });
      await sync.Start(payload);
      state.docs.push(webhookDoc("1", "http://a", "2026-01-01"));
      await jest.advanceTimersByTimeAsync(1100);
      expect(registry.Get(KEY)).toHaveLength(1);
    });
  });
});
