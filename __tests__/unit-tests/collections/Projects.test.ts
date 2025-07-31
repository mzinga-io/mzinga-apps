import Projects from "../../../src/collections/Owners/Projects";
import { Slugs } from "../../../src/collections/Slugs";

const environmentId = "42";
const projectId = "24";
describe("collections", () => {
  describe("Projects", () => {
    it("Should try to delete the environment(s) if related the specific project", async () => {
      const payloadFind = jest.fn();
      const payloadDelete = jest.fn();
      payloadFind.mockResolvedValue({
        docs: [
          {
            id: environmentId,
          },
        ],
      });
      await Projects.hooks.beforeDelete[0]({
        req: {
          payload: {
            find: payloadFind,
            delete: payloadDelete,
          },
        } as any,
        id: projectId,
        collection: undefined,
        context: undefined,
      });
      expect(payloadDelete).toHaveBeenCalledWith({
        collection: Slugs.Environments,
        where: {
          "project.value": {
            equals: projectId,
          },
        },
      });
    });
  });
});
