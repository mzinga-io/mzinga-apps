import { describe, expect, it } from "@jest/globals";
import { slugifyHook } from "../../../src/fields";
describe("SlugField", () => {
  it("should slugify value", () => {
    const input = "This is a Test!";
    expect(
      slugifyHook({
        value: input,
        data: {},
        collection: null,
        context: null,
        field: null,
        global: null,
        req: null,
        siblingData: null,
      }),
    ).toBe("this-is-a-test");
    expect(
      slugifyHook({
        value: input,
        data: {},
        originalDoc: {},
        collection: null,
        context: null,
        field: null,
        global: null,
        req: null,
        siblingData: null,
      }),
    ).toBe("this-is-a-test");
  });
  it("should return data.id", () => {
    const input = "42";
    expect(
      slugifyHook({
        value: input,
        data: { id: "42" },
        collection: null,
        context: null,
        field: null,
        global: null,
        req: null,
        siblingData: null,
      }),
    ).toBe("42");
  });
  it("should return data._id", () => {
    const input = "_42";
    expect(
      slugifyHook({
        value: input,
        data: { _id: "_42" },
        collection: null,
        context: null,
        field: null,
        global: null,
        req: null,
        siblingData: null,
      }),
    ).toBe("_42");
  });
  it("when originalDoc is provided, it should return fallback", () => {
    const input = "o_42";
    expect(
      slugifyHook({
        value: input,
        data: {
          name: "this is a test with original doc",
        },
        originalDoc: { _id: "o_42" },
        collection: null,
        context: null,
        field: null,
        global: null,
        req: null,
        siblingData: null,
      }),
    ).toBe("this-is-a-test-with-original-doc");
  });
});
