![Node.js](https://img.shields.io/badge/Node.js-18.x-brightgreen?logo=node.js)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Dockerized](https://img.shields.io/badge/Docker-Supported-blue?logo=docker)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green?logo=mongodb)
![Redis](https://img.shields.io/badge/Cache-Redis-red?logo=redis)
![RabbitMQ](https://img.shields.io/badge/Messaging-RabbitMQ-orange?logo=rabbitmq)
![Payload CMS](https://img.shields.io/badge/CMS-Payload-000000?logo=payloadcms&logoColor=white)
![CI/CD](https://img.shields.io/badge/CI/CD-Ready-blueviolet?logo=githubactions)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

**MZinga** is a modern, modular **Content Management System (CMS)** built on top of [Payload CMS](https://payloadcms.com/) version 2, forked by Newesis srl as [Mzinga Core](https://github.com/mzinga-io/mzinga-core), designed for high extensibility and seamless integration with **MongoDB**, **Redis**, and **RabbitMQ**. Tailored for SaaS and enterprise environments, MZinga provides a scalable, secure, and developer-friendly platform for managing complex applications and workflows.

## 🚀 Key Features

- **Payload-Powered Foundation**
  Built on Payload CMS for flexible content and data management.

- **Database & Messaging Integration**
  - **MongoDB** for NoSQL data storage
  - **Redis** for distributed caching and performance optimization
  - **RabbitMQ** for asynchronous task orchestration and message-driven workflows

- **Scheduled Tasks**
  Native support for cron-style jobs to automate operations such as ETL pipelines, email dispatch, or data synchronization.

- **Custom Entities**
  Define and manage dynamic, modular data models without touching core logic.

- **Advanced Admin Operations**
  Extendable admin panel to manage users, roles, content, audit logs, batch operations, and data import/export.

- **Security & Observability**
  - Role-based access control (RBAC)
  - JWT-based authentication
  - Detailed audit logs
  - Built-in system metrics, health checks, and structured logging

- **High Availability & Scalability**
  Multi-region, multi-zone deployment support with automated failover and elastic scaling.

- **Automated Backups**
  Scheduled backups and recovery points to ensure data integrity and service continuity.

- **Built-in Observability**
  Telemetry and monitoring tools to track system health, performance, and usage in real time.

## 🧩 Ideal Use Cases

- SaaS platforms with customizable content structures and automation workflows
- Enterprise applications that require orchestration of distributed services and asynchronous jobs
- Cloud-native systems requiring high availability, security, and operational insight

## 📋 System Overview

| Feature           | Description                                        |
| ----------------- | -------------------------------------------------- |
| **Base Platform** | Payload CMS                                        |
| **Databases**     | MongoDB, Redis, RabbitMQ                           |
| **Core Features** | Scheduled tasks, custom entities, admin operations |
| **Security**      | RBAC, JWT authentication, audit logs               |
| **Deployment**    | Multi-zone, multi-region, cloud-native             |
| **Resilience**    | Automated backups and recovery workflows           |
| **Monitoring**    | Built-in observability and telemetry               |

# SETUP

## Prerequisites

Before you begin, ensure you have the following tools installed on your system:

1. **Node.js:** Version 18.x or later. [Download Node.js.](https://nodejs.org)
2. **npm:** Node.js package manager. Comes bundled with Node.js.
3. **Docker:** Required for containerizing the application. [Download Docker.](https://docs.docker.com/desktop/install/)
4. **Git:** Version control system. [Download Git.](https://git-scm.com/downloads)

## Basic Configuration

To run MZinga locally, you need to configure several environment variables. These can be set in a `.env` file at the project root.

### Required Configuration Keys

| Key                                  | Description                                                              | Example Value                                                                    | Required |
| ------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | -------- |
| `MONGODB_URI`                        | MongoDB connection string.                                               | mongodb://admin:admin@localhost:27017/app?authSource=admin&directConnection=true | Yes      |
| `PAYLOAD_SECRET`                     | Secret key for Payload CMS session and JWT signing.                      | 4jtCl9pogpqA0Axv                                                                 | Yes      |
| `PORT`                               | Port on which the MZinga app will run.                                   | 3031                                                                             | No       |
| `PAYLOAD_PUBLIC_SERVER_URL`          | Public URL for the Payload server (used for links, etc.).                | [http://localhost:3031](http://localhost:3031)                                   | No       |
| `TENANT`                             | Tenant identifier (used for multi-tenancy or data separation).           | local-tenant                                                                     | Yes      |
| `ENV`                                | Environment (e.g., `prod`, `dev`).                                       | prod                                                                             | Yes      |
| `DISABLE_TRACING`                    | Set to `1` to disable OpenTelemetry tracing (recommended for local dev). | 1                                                                                | No       |
| `REDIS_URI`                          | Redis connection string (required if using Redis cache plugin).          | redis://localhost:6379                                                           | No\*     |
| `PAYLOAD_PUBLIC_ENABLE_CACHE_PLUGIN` | Enable Redis cache plugin (`true` or `false`).                           | true                                                                             | No\*     |
| `DRIVER_OPTS_DEVICE`                 | Path for Docker volume data. **Warning:** Defaults to `/tmp` for temporary development. Change to a persistent path (e.g., `~/mzinga-data`) to prevent data loss on restart. | /tmp | Yes      |
| `DRIVER_OPTS_TYPE`                   | Docker volume driver type.                                               | none                                                                             | Yes      |
| `DRIVER_OPTS_OPTIONS`                | Docker volume driver options.                                            | bind                                                                             | Yes      |
| `MZINGA_DOCKER_COMPOSE_REPLICAS`     | Number of replicas for Docker Compose services.                          | 0                                                                                | No       |
| `MONGO_HOST`\*\*                     | Hostname or IP for MongoDB (used in some healthchecks).                  | 192.168.1.233                                                                    | Yes      |

\*`REDIS_URI` and `PAYLOAD_PUBLIC_ENABLE_CACHE_PLUGIN` are only required if you want to enable Redis caching.
\*\*`MONGO_HOST`'s value changes everytime you connect to a new network. This is the IP address of your machine on the local network. To get its value, open a terminal and run `ifconfig | grep 192`, the IP after inet is your machine's IP.

> **Note:** If you use Docker Compose, these variables are automatically picked up from `.env`.

---

## Running with Docker Compose

You can run the stack using Docker Compose in two modes.

### For a Persistent Environment (Recommended)

Use this method to ensure your data (database, uploads, etc.) is saved permanently and survives Docker restarts.

1.  **Create a persistent directory on your machine:**
    Choose a permanent location to store your data, for example, in your home directory.

    ```sh
    mkdir -p ~/mzinga-data
    ```

2.  **Configure your `.env` file:**
    Set `DRIVER_OPTS_DEVICE` to the **absolute path** of the directory you just created.

    ```sh
    # Example for macOS:
    # DRIVER_OPTS_DEVICE=/Users/your-user/mzinga-data
    #
    # Example for Linux:
    # DRIVER_OPTS_DEVICE=/home/your-user/mzinga-data

    DRIVER_OPTS_DEVICE= # <-- SET YOUR ABSOLUTE PATH HERE
    ```
    Also ensure the other required variables are set:
    ```sh
    MONGO_HOST=[your_192_ip_address]
    DRIVER_OPTS_TYPE="none"
    DRIVER_OPTS_OPTIONS="bind"
    ```

3.  **Start all services:**
    ```sh
    docker compose up
    ```

### For a Temporary, Disposable Environment

Use this method for quick tests where you do not need to keep your data.

> **Warning:** Using `/tmp` means all your data will be deleted when you shut down or restart Docker.

1.  **Ensure your `.env` file is configured as follows:**

    ```sh
    MONGO_HOST=[your_192_ip_address]
    DRIVER_OPTS_TYPE="none"
    DRIVER_OPTS_OPTIONS="bind"
    DRIVER_OPTS_DEVICE=/tmp
    ```

2.  **Create needed volume folders (and/or clean them up if needed):**
    This command is useful to ensure you start with a clean slate.

    ```sh
    echo "Cleanup"
    rm -rf /tmp/database /tmp/mzinga /tmp/messagebus
    
    echo "Create"
    mkdir -p /tmp/database /tmp/mzinga /tmp/messagebus
    ```

3.  **Start all services:**

    ```sh
    docker compose up
    ```

4.  **Access the app:**
    Open [http://localhost:3000](http://localhost:3000) (or the port you set in `PORT`).

---

## Running Locally with npm

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **Start the application:**

   ```sh
   npm run dev
   ```

3. **Access the app:**
   Open [http://localhost:3000](http://localhost:3000) (or the port you set in `PORT`).

4. **Required services:**
   - **MongoDB:** You can run a local MongoDB instance with:

     ```sh
     docker run --rm -it -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=admin mongo:latest
     ```

   - **Redis (optional, for cache):**

     ```sh
     docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest
     ```

---

## Additional Notes

- For development, you can use the default values provided in the `.env` example. You can use the `.env.template` file as a starting point and edit it accordingly.
- If you change ports or credentials, update your `.env` and `docker-compose.yml` accordingly.
- For advanced configuration, see the comments in `docker-compose.yml` and `src/mzinga.config.ts`.

## Webhook Notifications in MZinga

In the MZinga domain, the term **webhook notification** refers to both traditional HTTP webhooks (HTTP POST requests to external URLs) and events published to RabbitMQ. This is a broader definition than in most software projects, where "webhook" typically means only HTTP callbacks. In MZinga, both mechanisms are configured and triggered in the same way, allowing you to integrate with external systems using either HTTP or RabbitMQ.

You can configure webhook notifications in two ways. Both can be used at the same time.

### Option 1: In the admin UI (no restart)

1. Open **Admin > Admin Webhooks** and create an entry.
2. Choose the collection (custom entities are listed too). Then add one or more rows, each with:
   - **event**: the hook type, for example `afterChange`;
   - **type**: `HTTP` or `RabbitMQ`;
   - **url**: the endpoint to call (HTTP only; must start with `http://` or `https://`);
   - **fieldReference** (optional): a top-level field name, to use a field-level hook. Only field-level events are allowed with a field reference.

Changes apply to every running instance (backoffice and API) without a restart:

- With MongoDB as a replica set, instances follow a change stream on the `admin-webhooks` collection and apply changes within about a second.
- Each instance also checks for changes every `WEBHOOKS_SYNC_INTERVAL_MS` milliseconds (default `30000`; `0` disables the check). This is the fallback when change streams are not available.

### Option 2: With environment variables (restart needed)

1. **Set an environment variable using the following format:**

   ```bash
   HOOKSURL_<COLLECTION_SLUG>_<HOOK_TYPE>=<TARGETS>
   HOOKSURL_<COLLECTION_SLUG>_FIELD_<FIELD_NAME>_<HOOK_TYPE>=<TARGETS>
   ```

   - `<COLLECTION_SLUG>`: the collection slug in upper case, exactly as the slug is written (e.g. `STORIES`, `SCHEDULED-TASKS`).
   - `<FIELD_NAME>`: a top-level field name in upper case (e.g. `LASTEXECUTION`).
   - `<HOOK_TYPE>`: the event type (e.g. `AFTERCHANGE`, `BEFORECHANGE`).
   - `<TARGETS>`: a comma-separated list of HTTP endpoints and/or `rabbitmq` (any letter case).

   **Example for RabbitMQ:**

   ```bash
   HOOKSURL_SCHEDULED-TASKS_FIELD_LASTEXECUTION_AFTERCHANGE=rabbitmq
   ```

   **Example for HTTP webhook:**

   ```bash
   HOOKSURL_STORIES_FIELD_TITLE_AFTERCHANGE=https://your-webhook-endpoint.com/notify
   ```

2. **If using RabbitMQ, set the `RABBITMQ_URL` variable.** Without it, `rabbitmq` targets are skipped.

   ```bash
   RABBITMQ_URL=amqp://guest:guest@localhost:5672/
   ```

3. **Restart your app** after changing environment variables.

Environment variable subscriptions and UI subscriptions are combined. When both point to the same target for the same event, the notification is sent only once.

### How It Works

- When the specified event occurs (e.g., the `lastExecution` field is updated), MZinga sends a notification to the configured HTTP endpoint or publishes an event to RabbitMQ.
- The payload includes details about the event, such as the data, document, operation type, and more.
- RabbitMQ events are published to the `mzinga_events` topic exchange, with the `HOOKSURL_...` key as routing key. They are also routed to the durable `mzinga_events_durable` exchange.
- If RabbitMQ is unreachable, the event is skipped and logged, and the write still succeeds. Publishing resumes when the connection is back.
- HTTP notifications are sent once, without retries. Guaranteed delivery is planned.

### Supported Hook Types

- `BEFOREVALIDATE`, `BEFORECHANGE`, `AFTERCHANGE`, `AFTERREAD` (field-level)
- `BEFOREOPERATION`, `BEFOREVALIDATE`, `BEFORECHANGE`, `AFTERCHANGE`, `BEFOREREAD`, `AFTERREAD`, `BEFOREDELETE`, `AFTERDELETE`, `AFTERERROR`, `BEFORELOGIN`, `AFTERLOGIN`, `AFTERLOGOUT`, `AFTERME`, `AFTERREFRESH`, `AFTERFORGOTPASSWORD` (collection-level)
- `AFTERERROR` needs a Mzinga core version that accepts `afterError` hooks on collections; core 1.0.5 and earlier reject it, and the subscription is then ignored. It fires for errors returned by the REST API (not GraphQL), and its payload contains the error name and message.
- Read hooks (`BEFOREREAD`, `AFTERREAD`) fire on every read, so use them sparingly.

---

## Best Practices

- **[Naming conventions for Git Branches — a Cheatsheet](https://medium.com/@abhay.pixolo/naming-conventions-for-git-branches-a-cheatsheet-8549feca2534)**
- **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#specification):** A specification for adding human and machine readable meaning to commit messages
- **Use Consistent Naming:** Ensure that your page titles and file names are consistent to make navigation easier.
- **Organize Hierarchically:** Group related pages and files under parent folders for logical organization.
- **Regular Updates:** Keep your documentation up-to-date with project changes.
- **Use Templates:** For frequently used structures, create templates to standardize documentation.
