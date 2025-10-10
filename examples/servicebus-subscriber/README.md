# Service Bus (RabbitMQ) Subscriber Example

This is a simple Node.js application that demonstrates how to subscribe to and process events from the main MZinga application via a RabbitMQ message bus.

## How it Works

This application connects to a RabbitMQ server, creates a temporary queue, and binds it to the `mzinga_events` exchange. It listens for messages with a specific **routing key**. When a message is received, it logs the payload to the console.

---

## Running Locally with npm

1.**Install dependencies:**

```bash
npm install
````

2.**Set environment variables:**

Create a `.env` file in this directory (`examples/servicebus-subscriber`) with the following content:

```bash
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
ROUTING_KEY=HOOKSURL_PLAYERS_AFTERCHANGE
EXCHANGE_NAME=mzinga_events
```

**Note:** Ensure the `RABBITMQ_URL` points to your local RabbitMQ instance. The `ROUTING_KEY` must match the event hook configured in the main MZinga application.

3.**Start the application:**

```bash
npm start
```
  
The subscriber will connect to RabbitMQ and start listening for messages.

4.**Required services:**
    - **RabbitMQ:** You can run a local RabbitMQ instance with:
      ```sh
      docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
      ```

---

## Running with Docker Compose

This subscriber is included in the main `docker-compose.yml` file at the root of the project, but it is not enabled by default.

### 1. Configure the Main App (Publisher)

In the `mzinga` service in the root `docker-compose.yml`, add an environment variable to specify which event should be sent to RabbitMQ. The value must be the keyword `rabbitmq`.

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

In the `servicebus-subscriber` service in the root `docker-compose.yml`, you must add an `environment` block to tell it how to connect to RabbitMQ and which event to listen for.

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

After adding these configurations, run the following command from the project root to build the new services and apply your changes:

```bash
 docker-compose up --build
```
