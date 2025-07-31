import Organizations from "../../../src/collections/Owners/Organizations";
import { Slugs } from "../../../src/collections/Slugs";

const organizationId = "42";
const projectId = "24";
describe("collections", () => {
  describe("Organizations", () => {
    it("Should not try to delete project(s) if no projects found related to the organization", async () => {
      const payloadFind = jest.fn();
      const payloadDelete = jest.fn();
      payloadFind.mockResolvedValue({ docs: [] });
      await Organizations.hooks.beforeDelete[0]({
        req: {
          payload: {
            find: payloadFind,
            delete: payloadDelete,
          },
        } as any,
        id: organizationId,
        collection: undefined,
        context: undefined,
      });
      expect(payloadDelete).toHaveBeenCalledTimes(0);
    });
  });
  it("Should try to delete project(s) if at least one project is found", async () => {
    const payloadFind = jest.fn();
    const payloadDelete = jest.fn();
    payloadFind.mockResolvedValue({
      docs: [
        {
          id: projectId,
        },
      ],
    });
    await Organizations.hooks.beforeDelete[0]({
      req: {
        payload: {
          find: payloadFind,
          delete: payloadDelete,
        },
      } as any,
      id: organizationId,
      collection: undefined,
      context: undefined,
    });
    expect(payloadFind).toHaveBeenCalledWith({
      collection: Slugs.Projects,
      where: {
        "organization.value": {
          equals: organizationId,
        },
      },
    });
    expect(payloadDelete).toHaveBeenCalledWith({
      collection: Slugs.Projects,
      where: {
        "organization.value": {
          equals: organizationId,
        },
      },
    });
  });
  it("Should try to delete also the environment(s) if at least one project is found", async () => {
    const payloadFind = jest.fn();
    const payloadDelete = jest.fn();
    payloadFind.mockResolvedValue({
      docs: [
        {
          id: projectId,
        },
      ],
    });
    await Organizations.hooks.beforeDelete[0]({
      req: {
        payload: {
          find: payloadFind,
          delete: payloadDelete,
        },
      } as any,
      id: organizationId,
      collection: undefined,
      context: undefined,
    });
    expect(payloadDelete).toHaveBeenCalledWith({
      collection: Slugs.Environments,
      where: {
        "project.value": {
          in: projectId,
        },
      },
    });
  });
});
