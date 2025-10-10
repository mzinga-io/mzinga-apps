# Webhook Subscriber Example

This is a simple Express.js application that demonstrates how to receive and process webhooks from the main Mzinga application.

## How it Works

This server listens for `POST` requests on the `/webhook` endpoint. When a webhook is received from the main application, it logs the entire payload to the console so you can inspect the data.

## Setup and Running

1.**Navigate to this directory:**

    cd examples/webhook-subscriber

2.**Install dependencies:**

    npm install

3.**Start the server:**

    npm start

The server will start and listen on `http://localhost:4000`.

## Configure the Main App

To make the main application send webhooks to this subscriber, you must manually edit your `docker-compose.yml` file and add an environment variable to the `mzinga` service.

For example, to receive a notification every time a **player is edited**, add the following variable under the `environment:` section of the `mzinga` service:

    services:
      mzinga:
        # ... other settings
        environment:
          # ... other variables
          - HOOKSURL_PLAYER_AFTERCHANGE=http://webhook-subscriber:4000/webhook

After adding the variable, restart your services with `docker-compose up -d` for the changes to take effect.
