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

To make the main application send webhooks to this subscriber, you must set an environment variable in the `.env` file or your `docker-compose.yml` for the `mzinga` service.

To receive a notification every time a **player is edited** (which triggers an `afterChange` event on the collection), add the following variable:

    HOOKSURL_PLAYER_AFTERCHANGE=http://localhost:4000/webhook

Now, whenever you create or update a document in the `player` collection, the main app will send a `POST` request with the change details to this subscriber application, and you will see the data logged in the terminal where you ran `npm start`.
