import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { FieldBase } from "mzinga/types";
import { Connection } from "rabbitmq-client";
import AlertTypes from "../../../src/collections/AlertTypes";
import { Slugs } from "../../../src/collections/Slugs";
import Stories from "../../../src/collections/Stories";
import { WebHooks } from "../../../src/hooks/WebHooks";
import {
  BusConfiguration,
  messageBusService,
} from "../../../src/messageBusService";
jest.mock("rabbitmq-client", () => ({
  Connection: jest.fn(),
}));
const MockConnection = Connection as jest.MockedClass<typeof Connection>;
describe("hooks", () => {
  describe("WebHooks", () => {
    it("should enrich collection hooks based on env variable", () => {
      const webHooks = new WebHooks({
        HOOKSURL_STORIES_BEFOREVALIDATE: "http://example.com/webhook",
      });
      const hooks = webHooks.EnrichCollection(Stories);
      expect(hooks.beforeValidate).toBeDefined();
    });
    it("should enrich fields hooks based on env variable", () => {
      const webHooks = new WebHooks({
        HOOKSURL_STORIES_FIELD_TITLE_BEFOREVALIDATE:
          "http://example.com/webhook",
      });
      const rowFields = AlertTypes.fields.find((f) => f.type == "row").fields;
      const fields = webHooks.EnrichFields(Slugs.AlertTypes, rowFields);
      expect(
        (
          fields.find(
            (f) => (f as FieldBase).name === "iconURLVisual",
          ) as FieldBase
        ).hooks,
      ).toBeUndefined();
    });
    it("should enrich field hooks based on env variable", () => {
      const webHooks = new WebHooks({
        HOOKSURL_STORIES_FIELD_TITLE_BEFOREVALIDATE:
          "http://example.com/webhook",
      });
      const hooks = webHooks.EnrichField(
        Slugs.Stories,
        Stories.fields.find((f) => (f as FieldBase).name === "title"),
      );
      expect(hooks.beforeValidate).toBeDefined();
    });
    it("hooks coming from DB should enrich hooks from env", () => {
      const webHooks = new WebHooks(
        {
          HOOKSURL_STORIES_BEFOREVALIDATE: "http://example.com/webhook",
        },
        [
          {
            collectionReference: "stories",
            webhooks: [
              {
                event: "beforeValidate",
                type: "rabbitmq",
              },
            ],
          },
        ],
      );
      expect(webHooks.GetEnv().HOOKSURL_STORIES_BEFOREVALIDATE).toBe(
        "http://example.com/webhook,rabbitmq",
      );
    });
    it("hooks coming from DB should be in env", () => {
      const webHooks = new WebHooks(
        {
          HOOKSURL_STORIES_BEFOREVALIDATE: "http://example.com/webhook",
        },
        [
          {
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
        ],
      );
      const webHooksEnv = webHooks.GetEnv();
      expect(webHooksEnv.HOOKSURL_STORIES_BEFOREVALIDATE).toBe(
        "http://example.com/webhook",
      );
      expect(webHooksEnv.HOOKSURL_STORIES_FIELD_TITLE_BEFORECHANGE).toBe(
        "http://example.com/webhook2",
      );
    });
    describe("URL based hooks", () => {
      it("should manage multiple URLs (and exclude invalid values)", () => {
        const webHooks = new WebHooks({
          HOOKSURL_STORIES_BEFOREVALIDATE:
            "http://example.com/webhook,http://example.com/webhook2,,http://example.com/webhook3",
        });
        const hooks = webHooks.EnrichCollection(Stories);
        expect(hooks.beforeValidate.length).toBe(3);
      });
      it("should fetch URL with hook data", async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
        });
        const webHooks = new WebHooks({
          HOOKSURL_STORIES_BEFOREVALIDATE: "http://example.com/webhook",
        });
        const hooks = webHooks.EnrichCollection(Stories);
        const args = {
          data: null,
          doc: null,
          findMany: undefined,
          previousDoc: undefined,
          originalDoc: null,
          operation: "create",
        } as any;
        await hooks.beforeValidate[0](args);
        expect(global.fetch).toHaveBeenCalledWith(
          "http://example.com/webhook",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              hook: {
                envKey: "HOOKSURL_STORIES_BEFOREVALIDATE",
                key: "stories",
                type: "beforeValidate",
              },
              ...args,
            }),
          }),
        );
      });
    });
    describe("RabbitMQ hooks", () => {
      let mockConnection: any;
      let mockPublisher: any;
      beforeEach(() => {
        jest.clearAllMocks();

        // Create mock functions
        const mockSend = jest.fn().mockImplementation(() => Promise.resolve());
        const mockClose = jest.fn().mockImplementation(() => Promise.resolve());
        const mockOn = jest.fn();

        mockPublisher = {
          send: mockSend,
          close: mockClose,
        };

        mockConnection = {
          on: mockOn,
          createPublisher: jest.fn().mockReturnValue(mockPublisher),
          close: mockClose,
          exchangeDeclare: jest.fn(),
          exchangeBind: jest.fn(),
        };
        MockConnection.mockImplementation(() => mockConnection);
      });
      it("should NOT enrich collection hooks with rabbitmq if not connected", async () => {
        const rabbitmqUrl = "amqp://localhost:5672";
        const webHooks = new WebHooks({
          RABBITMQ_URL: rabbitmqUrl,
          HOOKSURL_STORIES_BEFOREVALIDATE: "rabbitmq",
        });
        const hooks = webHooks.EnrichCollection(Stories);
        expect(messageBusService.isConnected()).toBeFalsy();
        expect(hooks.beforeValidate).toBeDefined();
        expect(hooks.beforeValidate.length).toBe(0);
      });
      it("should enrich collection hooks with rabbitmq", async () => {
        const rabbitmqUrl = "amqp://localhost:5672";
        const webHooks = new WebHooks({
          RABBITMQ_URL: rabbitmqUrl,
          HOOKSURL_STORIES_BEFOREVALIDATE: "rabbitmq",
        });
        await messageBusService.connect(rabbitmqUrl);
        const hooks = webHooks.EnrichCollection(Stories);
        expect(hooks.beforeValidate).toBeDefined();
        expect(hooks.beforeValidate.length).toBe(1);
      });
      it("should publish event", async () => {
        const rabbitmqUrl = "amqp://localhost:5672";
        const webHooks = new WebHooks({
          RABBITMQ_URL: rabbitmqUrl,
          HOOKSURL_STORIES_BEFOREVALIDATE: "rabbitmq",
        });
        await messageBusService.connect(rabbitmqUrl);
        const hooks = webHooks.EnrichCollection(Stories);
        const args = {
          data: null,
          doc: null,
          findMany: undefined,
          previousDoc: undefined,
          originalDoc: null,
          operation: "create",
        } as any;
        hooks.beforeValidate[0](args);
        expect(mockPublisher.send).toHaveBeenCalledWith(
          {
            durable: true,
            exchange: BusConfiguration.MZingaEvents.exchange,
            routingKey: "HOOKSURL_STORIES_BEFOREVALIDATE",
          },
          {
            type: "HOOKSURL_STORIES_BEFOREVALIDATE",
            data: {
              hook: {
                envKey: "HOOKSURL_STORIES_BEFOREVALIDATE",
                key: "stories",
                type: "beforeValidate",
              },
              ...args,
            },
          },
        );
      });
    });
  });
});
