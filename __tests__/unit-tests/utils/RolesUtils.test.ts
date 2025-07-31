import { RolesUtils } from "../../../src/utils/RolesUtils";

describe("utils", () => {
  describe("RolesUtils", () => {
    it("should return empty list if null inputs", () => {
      const roles = RolesUtils.GetRolesFieldOptions(undefined, undefined);
      expect(roles).toHaveLength(0);
    });
    it("should return additional roles", () => {
      const roles = RolesUtils.GetRolesFieldOptions(
        {
          PAYLOAD_PUBLIC_ADDITIONAL_ROLES: "owners",
        },
        undefined
      );
      expect(roles).toHaveLength(1);
      expect(roles[0]).toBe("owners");
    });
  });
});
