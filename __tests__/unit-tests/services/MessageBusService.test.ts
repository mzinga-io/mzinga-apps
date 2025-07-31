import { messageBusService } from "../../../src/messageBusService";

describe("services", () => {
  describe("MessageBusService", () => {
    it("Should return false for null connection", () => {
      expect(messageBusService.isConnected()).toBeFalsy();
    });
  });
});
