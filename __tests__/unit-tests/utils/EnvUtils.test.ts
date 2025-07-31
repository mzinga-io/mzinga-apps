import { EnvUtils } from "../../../src/utils/EnvUtils";

describe("utils", () => {
  describe("EnvUtils", () => {
    it("'GetAsBoolean' should return false", () => {
      expect(EnvUtils.GetAsBoolean("")).toBeFalsy();
      expect(EnvUtils.GetAsBoolean(undefined)).toBeFalsy();
      expect(EnvUtils.GetAsBoolean("false")).toBeFalsy();
    });
    it("'GetAsBoolean' should return true", () => {
      expect(EnvUtils.GetAsBoolean("true")).toBeTruthy();
      expect(EnvUtils.GetAsBoolean("1")).toBeTruthy();
    });
  });
});
