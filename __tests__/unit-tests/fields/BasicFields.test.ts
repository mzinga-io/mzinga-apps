import type { FieldBase } from "payload/types";
import * as fields from "../../../src/fields";

describe("fields", () => {
  const byUserDefaultValues = [
    {
      input: {},
      expected: undefined,
    },
    { input: { user: undefined }, expected: undefined },
    { input: { user: { id: "12345" } }, expected: "12345" },
  ];
  const fieldsMappings = {
    AuthorField: {
      name: "author",
      defaultValues: byUserDefaultValues,
    },
    ByField: {
      name: "by",
      defaultValues: byUserDefaultValues,
    },
    NameField: {
      name: "name",
    },
  };
  for (const field in fieldsMappings) {
    const mappedField = fieldsMappings[field];
    if (!fields[field]) {
      continue;
    }
    const fieldGet = fields[field].Get() as FieldBase;
    describe(field, () => {
      it(`'name' should be '${mappedField.name}'`, () => {
        expect(fields[field].Name).toBe(mappedField.name);
      });
    });
    if (mappedField.defaultValues) {
      describe(`${field} default values`, () => {
        for (const defaultValueTest of mappedField.defaultValues) {
          it(`input=${JSON.stringify(
            defaultValueTest.input
          )} should be ${JSON.stringify(defaultValueTest.expected)}`, () => {
            expect(fieldGet.defaultValue(defaultValueTest.input)).toBe(
              defaultValueTest.expected
            );
          });
        }
      });
    }
  }
});
