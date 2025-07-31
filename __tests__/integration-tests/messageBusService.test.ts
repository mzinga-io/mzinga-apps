import { Connection } from "rabbitmq-client";
import { config } from "dotenv";
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
          resolve();
        });
      });
      await testConnection.queueDeclare({
        queue: queueName,
        autoDelete: false,
        durable: true,
        arguments: {
          "x-queue-type": "quorum",
        },
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
  }, 15000);

  it("should successfully connect to RabbitMQ", async () => {
    expect(testConnection).toBeDefined();
  });

  it("should publish and receive message", async () => {
    const receivedMessages: any[] = [];
    consumer = testConnection.createConsumer(
      {
        queue: queueName,
        queueOptions: {
          autoDelete: false,
          durable: true,
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
        receivedMessages.push(msg.body);
        return 0; // ACK
      }
    );
    return await new Promise((resolve) => {
      setTimeout(function () {
        expect(receivedMessages.length).toBeGreaterThanOrEqual(3);
        const messageTypeOrder = receivedMessages.map((m) => m.type);
        expect(messageTypeOrder).toEqual(
          expect.arrayContaining([
            "HOOKSURL_ORGANIZATIONS_AFTERCHANGE",
            "HOOKSURL_PROJECTS_AFTERCHANGE",
            "HOOKSURL_ENVIRONMENTS_AFTERCHANGE",
          ])
        );
        // const messageOrder = receivedMessages.map((m) => m.data.doc);
        // expect(messageOrder).toContainEqual(
        //   expect.objectContaining(organization)
        // );

        // expect(messageOrder[1]).toMatchObject({
        //   id: projectId,
        //   name: project.name,
        //   organization: {
        //     relationTo: "organizations",
        //     value: expect.objectContaining({
        //       id: organizationId,
        //       name: organization.name,
        //       invoices: organization.invoices,
        //     }),
        //   },
        // });

        // expect(messageOrder[2]).toMatchObject({
        //   id: environmentId,
        //   name: environment.name,
        //   project: {
        //     relationTo: "projects",
        //     value: expect.objectContaining({
        //       id: projectId,
        //       name: project.name,
        //       organization: {
        //         relationTo: "organizations",
        //         value: expect.objectContaining({
        //           id: organizationId,
        //           name: organization.name,
        //           invoices: organization.invoices,
        //         }),
        //       },
        //     }),
        //   },
        // });
        resolve(true);
      }, 5000);
    });
  }, 15000);
});
