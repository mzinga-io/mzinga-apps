# Webhook Subscriber Example

This is a simple Express.js application that demonstrates how to receive and process webhooks from the main Mzinga application.

## How it Works

This server listens for `POST` requests on the `/webhook` endpoint. When a webhook is received from the main application, it logs the entire payload to the console so you can inspect the data.

---

## Running Locally with npm

1.**Install dependencies:**

```sh
npm install
```

2.**Start the server:**

```sh
npm start
```

The server will start and listen on `http://localhost:4000`.

3.**Configure the Main App to Send Webhooks**

To make the main application send webhooks to this subscriber, you must set an environment variable in the main MZinga application.

For example, to receive a notification every time a **story is edited**, add the following variable to your `.env` file in the root of the project:

```yaml
HOOKSURL_TEAMS_FIELD_DESCRIPTION_AFTERCHANGE=http://localhost:4000/webhook
```

> **Note:** When running both the main app and the subscriber locally (not in Docker), you must use `localhost` in the webhook URL.

---

## Running with Docker Compose

This subscriber is included in the main `docker-compose.yml` file at the root of the project, but it is not enabled by default.

### 1. Configure the Main App (Publisher)

In the `mzinga` service in the root `docker-compose.yml`, add an environment variable to specify the webhook URL. The URL must point to the `webhook-subscriber` service.

For example, to publish an event every time a **team's description is edited**, add the following to the `environment` section of the `mzinga` service:

```yaml
services:
  mzinga:
    # ... other settings
    environment:
      # ... other variables
      - HOOKSURL_TEAMS_FIELD_DESCRIPTION_AFTERCHANGE=http://webhook-subscriber:4000/webhook
```

**Important:** When running inside Docker, the hostname in the URL must be the service name (`webhook-subscriber`), not `localhost`.

### 2. Run the Services

After adding the configuration, run the following command from the project root to build the new services and apply your changes:

```bash
 docker-compose up --build
```