import { config } from "dotenv";
const crypto = require("node:crypto");
config();
const { PAYLOAD_PUBLIC_SERVER_URL, API_KEY } = process.env;
describe("collections", () => {
  describe("Organizations", () => {
    describe("Backoffice delete propagation", () => {
      let organizationId;
      let projectId;
      let environmentId;
      const organization = {
        name: `org-tests-${crypto.randomUUID().substring(0, 25)}`,
        invoices: {
          vat: "1234567890",
          address: "Street number 1",
          email: "integration@tests.com",
        },
      };
      const project = {
        name: `prj-tests-${crypto.randomUUID()}`,
        organization: { relationTo: "organizations", value: undefined },
      };
      const environment = {
        name: `env-tests-${crypto.randomUUID()}`,
        project: { relationTo: "projects", value: undefined },
      };
      beforeAll(async () => {
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
          throw `There was an error: ${
            organizationResponse.status
          }. ${await organizationResponse.text()}`;
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
          throw `There was an error: ${
            projectResponse.status
          }. ${await projectResponse.text()}`;
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
          throw `There was an error: ${
            envResponse.status
          }. ${await envResponse.text()}`;
        }
        environmentId = (await envResponse.json()).doc.id;
      });
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
          `Delete for '${PAYLOAD_PUBLIC_SERVER_URL}/api/organizations/${organizationId}' returned ${
            orgResponse.status
          }: ${await orgResponse.text()}`
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
          `Delete for '${PAYLOAD_PUBLIC_SERVER_URL}/api/projects/${projectId}' returned ${
            prjResponse.status
          }: ${await prjResponse.text()}`
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
          `Delete for '${PAYLOAD_PUBLIC_SERVER_URL}/api/environments/${environmentId}' returned ${
            envResponse.status
          }: ${await envResponse.text()}`
        );
      });
      it("Should delete related projects, environments for the specific organization", async () => {
        const orgResponse = await fetch(
          `${PAYLOAD_PUBLIC_SERVER_URL}/api/organizations/${organizationId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `users API-Key ${API_KEY}`,
            },
          }
        );
        expect(orgResponse.status).toBe(200);
        const prjResponse = await fetch(
          `${PAYLOAD_PUBLIC_SERVER_URL}/api/projects/${projectId}`,
          {
            method: "GET",
            headers: {
              Authorization: `users API-Key ${API_KEY}`,
            },
          }
        );
        expect(prjResponse.status).toBe(404);
        const envResponse = await fetch(
          `${PAYLOAD_PUBLIC_SERVER_URL}/api/environments/${environmentId}`,
          {
            method: "GET",
            headers: {
              Authorization: `users API-Key ${API_KEY}`,
            },
          }
        );
        expect(envResponse.status).toBe(404);
      });
    });
  });
});
