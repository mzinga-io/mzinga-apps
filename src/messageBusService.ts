import type { Publisher } from "rabbitmq-client";
import { Connection } from "rabbitmq-client";
import { MZingaLogger } from "./utils/MZingaLogger";

declare type Event = {
  type: string;
  data: any;
};

const BusConfiguration = {
  MZingaEvents: {
    exchange: "mzinga_events",
    type: "topic",
  },
  MZingaEventsDurable: {
    exchange: "mzinga_events_durable",
    type: "topic",
    durable: true,
    autoDelete: false,
    internal: true,
  },
};
class MessageBusService {
  private connection: Connection | null = null;
  private publisher: Publisher = null;

  isConnected(): Boolean {
    return !!this.connection;
  }
  async connect(url: string): Promise<void> {
    try {
      this.connection = new Connection(url);
      this.connection.on("error", (err) => {
        MZingaLogger.Instance?.error(`RabbitMQ connection error: ${err}`);
      });

      this.connection.on("connection", () => {
        MZingaLogger.Instance?.debug("Connection successfully established");
      });
      this.connection.exchangeDeclare(BusConfiguration.MZingaEvents);
      this.connection.exchangeDeclare(BusConfiguration.MZingaEventsDurable);
      this.connection.exchangeBind({
        source: BusConfiguration.MZingaEvents.exchange,
        destination: BusConfiguration.MZingaEventsDurable.exchange,
        routingKey: "#",
      });

      this.publisher = this.connection.createPublisher({
        exchanges: [
          BusConfiguration.MZingaEventsDurable,
          BusConfiguration.MZingaEvents,
        ],
      });

      MZingaLogger.Instance?.debug("RabbitMQ setup completed");
    } catch (error) {
      MZingaLogger.Instance?.error(`Failed to connect to RabbitMQ: ${error}`);
      throw error;
    }
  }

  async publishEvent(event: Event): Promise<void> {
    if (!this.connection || !this.publisher) {
      throw new Error("Not connected to RabbitMQ");
    }

    try {
      const routingKey = event.type;
      await this.publisher.send(
        {
          exchange: BusConfiguration.MZingaEvents.exchange,
          routingKey,
          durable: true,
        },
        event
      );

      MZingaLogger.Instance?.debug(
        `Successfully published event to RabbitMQ: ${routingKey}`
      );
    } catch (error) {
      MZingaLogger.Instance?.error(`Failed to publish event: ${error}`);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.publisher) {
        await this.publisher.close();
        this.publisher = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    } catch (error) {
      MZingaLogger.Instance?.error(`Error closing RabbitMQ: ${error}`);
      throw error;
    }
  }
}
const messageBusService = new MessageBusService();

export { messageBusService, BusConfiguration };
