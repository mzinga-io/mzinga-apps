import type { Payload } from "mzinga";
import { MZingaLogger } from "../utils/MZingaLogger";
import { WebHookDocument, WebHookRegistry, webHookRegistry } from "./WebHooks";

const WEBHOOKS_COLLECTION = "admin-webhooks";
const PAGE_SIZE = 100;
const DEFAULT_INTERVAL_MS = 30_000;
const RELOAD_DEBOUNCE_MS = 250;

type ChangeStreamLike = {
  on(event: "change", listener: () => void): unknown;
  on(event: "error", listener: (error: Error) => void): unknown;
  close?: () => Promise<unknown>;
};
type WatchableDb = {
  collections?: Record<
    string,
    { watch?: (pipeline: unknown[], options: object) => ChangeStreamLike }
  >;
};

type SyncOptions = {
  collection?: string;
  /** Poll interval; 0 disables polling. */
  intervalMs?: number;
  debounceMs?: number;
};

/**
 * Keeps the registry in line with the admin-webhooks collection on every
 * instance (backoffice and API pods):
 * - MongoDB change stream on the collection, which only reports committed changes;
 * - a poll comparing count and latest updatedAt, as a safety net and for
 *   databases without change streams.
 */
export class WebHooksSync {
  private payload: Payload | null = null;
  private changeStream: ChangeStreamLike | null = null;
  private changeStreamWarned = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private fingerprint: string | null = null;
  private reloading: Promise<void> | null = null;
  private reloadAgain = false;
  private readonly collection: string;
  private readonly intervalMs: number;
  private readonly debounceMs: number;

  constructor(
    private readonly registry: WebHookRegistry = webHookRegistry,
    options: SyncOptions = {},
  ) {
    this.collection = options.collection || WEBHOOKS_COLLECTION;
    this.intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
    this.debounceMs = options.debounceMs ?? RELOAD_DEBOUNCE_MS;
  }

  async Start(payload: Payload): Promise<void> {
    this.payload = payload;
    if (!payload.collections?.[this.collection]) {
      MZingaLogger.Instance?.info(
        `[WEBHOOKS] Collection "${this.collection}" is disabled: only env subscriptions are active`,
      );
      return;
    }
    await this.Reload();
    this.StartChangeStream();
    if (this.intervalMs > 0) {
      this.pollTimer = setInterval(() => {
        this.Poll().catch((e) =>
          MZingaLogger.Instance?.error(`[WEBHOOKS] Poll failed: ${e}`),
        );
      }, this.intervalMs);
      this.pollTimer.unref?.();
    }
  }

  async Stop(): Promise<void> {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.pollTimer = null;
    this.debounceTimer = null;
    await this.CloseChangeStream();
    this.payload = null;
  }

  /** Schedules a reload; several requests close together cause one reload. */
  RequestReload(): void {
    if (!this.payload) {
      return;
    }
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.Reload().catch((e) =>
        MZingaLogger.Instance?.error(`[WEBHOOKS] Reload failed: ${e}`),
      );
    }, this.debounceMs);
    this.debounceTimer.unref?.();
  }

  /** Loads all admin-webhooks documents into the registry. Concurrent calls are serialised. */
  async Reload(): Promise<void> {
    if (this.reloading) {
      this.reloadAgain = true;
      return this.reloading;
    }
    this.reloading = (async () => {
      do {
        this.reloadAgain = false;
        await this.LoadAll();
      } while (this.reloadAgain);
    })();
    try {
      await this.reloading;
    } finally {
      this.reloading = null;
    }
  }

  async Poll(): Promise<void> {
    if (!this.payload) {
      return;
    }
    if (!this.changeStream) {
      this.StartChangeStream();
    }
    const current = await this.GetFingerprint();
    if (current !== this.fingerprint) {
      MZingaLogger.Instance?.debug(
        `[WEBHOOKS] Change detected by poll (${this.fingerprint} -> ${current})`,
      );
      await this.Reload();
    }
  }

  private async LoadAll(): Promise<void> {
    const payload = this.payload;
    if (!payload) {
      return;
    }
    // Read the fingerprint first: a change made during the load is picked up by the next poll.
    const fingerprint = await this.GetFingerprint();
    const docs: WebHookDocument[] = [];
    let page = 1;
    let hasNextPage = true;
    while (hasNextPage) {
      const result = await payload.find({
        collection: this.collection,
        depth: 0,
        limit: PAGE_SIZE,
        page,
        sort: "createdAt",
        overrideAccess: true,
      });
      docs.push(...(result.docs as WebHookDocument[]));
      hasNextPage = Boolean(result.hasNextPage);
      page++;
    }
    this.registry.SetDbDocuments(docs);
    this.fingerprint = fingerprint;
    MZingaLogger.Instance?.debug(
      `[WEBHOOKS] Loaded ${docs.length} admin-webhooks document(s), registry revision ${this.registry.GetRevision()}`,
    );
  }

  private async GetFingerprint(): Promise<string> {
    const result = await this.payload.find({
      collection: this.collection,
      depth: 0,
      limit: 1,
      sort: "-updatedAt",
      overrideAccess: true,
    });
    const latest =
      (result.docs[0] as { updatedAt?: string } | undefined)?.updatedAt || "";
    return `${result.totalDocs}:${latest}`;
  }

  private StartChangeStream(): void {
    const model = (this.payload?.db as unknown as WatchableDb | undefined)
      ?.collections?.[this.collection];
    if (!model || typeof model.watch !== "function") {
      return;
    }
    try {
      const stream = model.watch([], {});
      stream.on("change", () => this.RequestReload());
      stream.on("error", (error: Error) => {
        this.LogChangeStreamUnavailable(error);
        if (this.changeStream === stream) {
          this.changeStream = null;
        }
        stream.close?.().catch(() => undefined);
      });
      this.changeStream = stream;
    } catch (error) {
      this.LogChangeStreamUnavailable(error as Error);
      this.changeStream = null;
    }
  }

  private LogChangeStreamUnavailable(error: Error) {
    const message = `[WEBHOOKS] Change stream unavailable, falling back to polling every ${this.intervalMs}ms: ${error?.message}`;
    if (this.changeStreamWarned) {
      MZingaLogger.Instance?.debug(message);
      return;
    }
    this.changeStreamWarned = true;
    MZingaLogger.Instance?.info(message);
  }

  private async CloseChangeStream(): Promise<void> {
    const stream = this.changeStream;
    this.changeStream = null;
    if (stream?.close) {
      try {
        await stream.close();
      } catch {
        // already closed
      }
    }
  }
}

// This module is also bundled in the admin UI, where process may be undefined.
const rawInterval =
  typeof process !== "undefined"
    ? process.env?.WEBHOOKS_SYNC_INTERVAL_MS
    : undefined;
const parsedInterval = rawInterval ? Number(rawInterval) : NaN;
export const webHooksSync = new WebHooksSync(webHookRegistry, {
  intervalMs:
    Number.isFinite(parsedInterval) && parsedInterval >= 0
      ? parsedInterval
      : DEFAULT_INTERVAL_MS,
});
