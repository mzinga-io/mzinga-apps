import { config } from "dotenv";
import { Connection } from "rabbitmq-client";
import { v4 as uuidv4 } from "uuid";
import { BusConfiguration } from "../../src/messageBusService";
config();

jest.setTimeout(30000);
const { PAYLOAD_PUBLIC_SERVER_URL, API_KEY, RABBITMQ_URL } = process.env;

const queueGuid = uuidv4();
const queueName = `test_queue-${queueGuid}`;
describe("MessageBusService Integration Tests", () => {
  let testConnection: Connection;
  let consumer: any;
  let organizationId;
  let projectId;
  let environmentId;
  const organization = {
    name: `org-tests-${uuidv4().substring(0, 25)}`,
    invoices: {
      vat: "1234567890",
      address: "Street number 1",
      email: "integration@tests.com",
    },
  };
  const project = {
    name: `prj-tests-${uuidv4()}`,
    organization: { relationTo: "organizations", value: undefined },
  };
  const environment = {
    name: `env-tests-${uuidv4()}`,
    project: { relationTo: "projects", value: undefined },
  };

  beforeAll(async () => {
    try {
      testConnection = new Connection(RABBITMQ_URL);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
        }, 10000);

        testConnection.on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });

        testConnection.on("connection", () => {
          clearTimeout(timeout);
          console.log("rabbitmq connection successfully!");
          consumer = testConnection.createConsumer(
            {
              queue: queueName,
              queueOptions: {
                durable: true,
                autoDelete: false,
                arguments: {
                  "x-queue-type": "quorum",
                },
              },
              exchanges: [BusConfiguration.MZingaEventsDurable],
              queueBindings: [
                {
                  exchange: BusConfiguration.MZingaEventsDurable.exchange,
                  routingKey: "HOOKSURL_ORGANIZATIONS_AFTERCHANGE",
                },
                {
                  exchange: BusConfiguration.MZingaEventsDurable.exchange,
                  routingKey: "HOOKSURL_PROJECTS_AFTERCHANGE",
                },
                {
                  exchange: BusConfiguration.MZingaEventsDurable.exchange,
                  routingKey: "HOOKSURL_ENVIRONMENTS_AFTERCHANGE",
                },
              ],
            },
            async (msg) => {
              const { body } = msg;
              const messageTypeOrder = body.type;
              expect([
                "HOOKSURL_ORGANIZATIONS_AFTERCHANGE",
                "HOOKSURL_PROJECTS_AFTERCHANGE",
                "HOOKSURL_ENVIRONMENTS_AFTERCHANGE",
              ]).toContain(messageTypeOrder);
              return 0; // ACK
            }
          );
          resolve();
        });
      });
    } catch (error) {
      console.error("Setup failed:", error);
      throw error;
    }
    const organizationResponse = await fetch(
      `${PAYLOAD_PUBLIC_SERVER_URL}/api/organizations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `users API-Key ${API_KEY}`,
        },
        body: JSON.stringify(organization),
      }
    );
    if (organizationResponse.status >= 299) {
      throw `There was an error: ${organizationResponse.status}. ${await organizationResponse.text()}`;
    }
    organizationId = (await organizationResponse.json()).doc.id;
    project.organization.value = organizationId;
    const projectResponse = await fetch(
      `${PAYLOAD_PUBLIC_SERVER_URL}/api/projects`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `users API-Key ${API_KEY}`,
        },
        body: JSON.stringify(project),
      }
    );
    if (projectResponse.status >= 299) {
      throw `There was an error: ${projectResponse.status}. ${await projectResponse.text()}`;
    }
    projectId = (await projectResponse.json()).doc.id;
    environment.project.value = projectId;
    const envResponse = await fetch(
      `${PAYLOAD_PUBLIC_SERVER_URL}/api/environments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `users API-Key ${API_KEY}`,
        },
        body: JSON.stringify(environment),
      }
    );
    if (envResponse.status >= 299) {
      throw `There was an error: ${envResponse.status}. ${await envResponse.text()}`;
    }
    environmentId = (await envResponse.json()).doc.id;
  }, 30000);

  afterAll(async () => {
    const orgResponse = await fetch(
      `${PAYLOAD_PUBLIC_SERVER_URL}/api/organizations/${organizationId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `users API-Key ${API_KEY}`,
        },
      }
    );
    console.log(
      `Delete for '${PAYLOAD_PUBLIC_SERVER_URL}/api/organizations/${organizationId}' returned ${orgResponse.status}: ${await orgResponse.text()}`
    );
    const prjResponse = await fetch(
      `${PAYLOAD_PUBLIC_SERVER_URL}/api/projects/${projectId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `users API-Key ${API_KEY}`,
        },
      }
    );
    console.log(
      `Delete for '${PAYLOAD_PUBLIC_SERVER_URL}/api/projects/${projectId}' returned ${prjResponse.status}: ${await prjResponse.text()}`
    );
    const envResponse = await fetch(
      `${PAYLOAD_PUBLIC_SERVER_URL}/api/environments/${environmentId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `users API-Key ${API_KEY}`,
        },
      }
    );
    console.log(
      `Delete for '${PAYLOAD_PUBLIC_SERVER_URL}/api/environments/${environmentId}' returned ${envResponse.status}: ${await envResponse.text()}`
    );
    try {
      if (consumer) {
        await consumer.close().catch((err) => {
          console.warn("Consumer close warning:", err);
        });
      }
      if (testConnection) {
        await testConnection.queueDelete(queueName);
        await testConnection.close().catch((err) => {
          console.warn("Connection close warning:", err);
        });
      }

      return await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Cleanup failed:", error);
      throw error;
    }
  }, 30000);

  it("should successfully connect to RabbitMQ", async () => {
    expect(testConnection).toBeDefined();
  });
});
