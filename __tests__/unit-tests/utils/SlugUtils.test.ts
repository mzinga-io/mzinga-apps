import { SlugUtils } from "../../../src/utils/SlugUtils";
describe("utils", () => {
  describe("SlugUtils", () => {
    it("Slugify should not throw for null/undefined/empty input", () => {
      expect(SlugUtils.Slugify(null)).toBe("");
      expect(SlugUtils.Slugify(undefined)).toBe("");
      expect(SlugUtils.Slugify("")).toBe("");
    });
    it("Slugify should 'slugify' the input value", () => {
      expect(SlugUtils.Slugify("my Wonderful text")).toBe("my-wonderful-text");
    });
    it("IsValidSlug should return 'true' for valid input", () => {
      expect(SlugUtils.IsValidSlug("my-wonderful-text")).toBe(true);
    });
    it("IsValidSlug should return 'false' for invalid input", () => {
      expect(SlugUtils.IsValidSlug("my-Wonderful-text")).toBe(false);
    });
  });
});
