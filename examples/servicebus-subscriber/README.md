# Service Bus (RabbitMQ) Subscriber Example

This is a simple Node.js application that demonstrates how to subscribe to and process events from the main MZinga application via a RabbitMQ message bus.

## How it Works

This application connects to a RabbitMQ server, creates a temporary queue, and binds it to the `mzinga_events` exchange. It listens for messages with a specific **routing key**. When a message is received, it logs the payload to the console.

## Setup

1.  **Navigate to this directory:**
    ```bash
    cd examples/servicebus-subscriber
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Configure and Run

To make this example work, you must manually edit your `docker-compose.yml` file to configure both the `mzinga` service (the publisher) and this `servicebus-subscriber` service (the consumer).

### 1. Configure the Main App (Publisher)

In the `mzinga` service, add an environment variable to specify which event should be sent to RabbitMQ. The value must be the keyword `rabbitmq`.

For example, to publish an event every time a **player is edited**, add the following to the `environment` section of the `mzinga` service:

```yaml
services:
  mzinga:
    # ... other settings
    environment:
      # ... other variables
      - HOOKSURL_PLAYERS_AFTERCHANGE=rabbitmq
```

### 2. Configure the Subscriber App (Consumer)

In the `servicebus-subscriber` service, you must add an `environment` block to tell it how to connect to RabbitMQ and which event to listen for.

```yaml
services:
  servicebus-subscriber:
    # ... other settings
    environment:
      - RABBITMQ_URL=amqp://guest:guest@messagebus:5672/
      - ROUTING_KEY=HOOKSURL_PLAYERS_AFTERCHANGE
      - EXCHANGE_NAME=mzinga_events
```

**Important:** The `ROUTING_KEY` in the subscriber must exactly match the variable name used in the `mzinga` service (e.g., `HOOKSURL_PLAYERS_AFTERCHANGE`).

### 3. Run the Services

After adding these configurations, run the following command to build the new services and apply your changes:

```bash
 docker-compose up --build
```