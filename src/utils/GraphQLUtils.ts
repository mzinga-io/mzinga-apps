import fs from "fs/promises";
import { printSchema } from "graphql";
import type { Payload } from "mzinga";

export const GraphQLUtils = {
  generateSchema: async (payload: Payload) => {
    await fs.writeFile(
      payload.config.graphQL.schemaOutputFile,
      printSchema(payload.schema)
    );
  },
};
