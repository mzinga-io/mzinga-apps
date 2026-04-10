import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Connection } from "rabbitmq-client";
import {
  BusConfiguration,
  messageBusService,
} from "../../../src/messageBusService";
import { MZingaLogger } from "../../../src/utils/MZingaLogger";

// Mock BusConfiguration
// Mock rabbitmq-client
jest.mock("rabbitmq-client", () => ({
  Connection: jest.fn(),
}));

// Mock MZingaLogger
jest.mock("../../../src/utils/MZingaLogger", () => ({
  MZingaLogger: {
    Instance: {
      error: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    },
  },
}));
const {
  TENANT = "unknown",
  ENV = "local",
  RABBITMQ_VHOST = "/",
  RABBITMQ_ACQUIRE_TIMEOUT = "",
  RABBITMQ_CONNECTION_TIMEOUT = "",
} = process.env;
const MockConnection = Connection as jest.MockedClass<typeof Connection>;
const mockLogger = MZingaLogger.Instance as jest.Mocked<
  typeof MZingaLogger.Instance
>;

describe("services", () => {
  describe("messageBusService", () => {
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

      // Setup Connection mock
      MockConnection.mockImplementation(() => mockConnection);
    });

    it("Should return false for null connection", () => {
      expect(messageBusService.isConnected()).toBeFalsy();
    });
    describe("Connection", () => {
      it("should successfully connect to RabbitMQ", async () => {
        const url = "amqp://localhost:5672";
        await messageBusService.connect(url);
        expect(MockConnection).toHaveBeenCalledWith({
          acquireTimeout: +(RABBITMQ_ACQUIRE_TIMEOUT || 20_000),
          connectionName: [TENANT, ENV].join("-"),
          connectionTimeout: +(RABBITMQ_CONNECTION_TIMEOUT || 10_000),
          url,
          vhost: RABBITMQ_VHOST,
        });
        expect(mockConnection.on).toHaveBeenCalledWith(
          "error",
          expect.any(Function),
        );
        expect(mockConnection.on).toHaveBeenCalledWith(
          "connection",
          expect.any(Function),
        );
        expect(mockConnection.createPublisher).toHaveBeenCalledWith({
          exchanges: [
            BusConfiguration.MZingaEventsDurable,
            BusConfiguration.MZingaEvents,
          ],
        });
      });

      it("should handle connection errors", async () => {
        const error = new Error("Connection failed");
        MockConnection.mockImplementation(() => {
          throw error;
        });

        await expect(
          messageBusService.connect("amqp://localhost:5672"),
        ).rejects.toThrow("Connection failed");

        expect(mockLogger.error).toHaveBeenCalledWith(
          `Failed to connect to RabbitMQ: ${error}`,
        );
      });

      it("should properly close the connection", async () => {
        await messageBusService.connect("amqp://localhost:5672");
        await messageBusService.close();

        expect(mockPublisher.close).toHaveBeenCalled();
        expect(mockConnection.close).toHaveBeenCalled();
      });
    });

    describe("Event Publishing", () => {
      beforeEach(async () => {
        await messageBusService.connect("amqp://localhost:5672");
      });

      it("should publish event with correct routing key", async () => {
        const event = {
          type: "ORGANIZATION_CREATED",
          data: { id: "123", name: "Test Org" },
        };

        await messageBusService.publishEvent(event);

        expect(mockPublisher.send).toHaveBeenCalledWith(
          {
            durable: true,
            exchange: BusConfiguration.MZingaEvents.exchange,
            routingKey: "ORGANIZATION_CREATED",
          },
          event,
        );

        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Successfully published event to RabbitMQ"),
        );
      });

      it("should throw error when publishing without connection", async () => {
        await messageBusService.close();

        const event = {
          type: "TEST_EVENT",
          data: {},
        };

        await expect(messageBusService.publishEvent(event)).rejects.toThrow(
          "Not connected to RabbitMQ",
        );
      });

      it("should handle publishing errors", async () => {
        const error = new Error("Publishing failed");
        mockPublisher.send.mockImplementationOnce(() => Promise.reject(error));

        const event = {
          type: "TEST_ERROR",
          data: {},
        };

        await expect(messageBusService.publishEvent(event)).rejects.toThrow();

        expect(mockLogger.error).toHaveBeenCalledWith(
          `Failed to publish event: ${error}`,
        );
      });
    });
  });
});
