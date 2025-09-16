import type { Payload } from "mzinga";

export const DBUtils = {
  fixBooleanType: () => {
    //moved require here because otherwise client-side rendering will fail
    require("mongoose").Schema.Types.Boolean.convertToFalse.add("");
  },
  createUpdatedAtDescIndexes: (payload: Payload) => {
    for (const slug in payload.db.collections) {
      payload.db.collections[slug].schema.index(
        { updatedAt: -1 },
        {
          background: true,
        }
      );
    }
  },
  getDbCollection: (payload: Payload, slug: string) => {
    return payload.db.collections[slug];
  },
  getDbCollectionName: (payload: Payload, slug: string) => {
    return DBUtils.getDbCollection(payload, slug)?.collection.name;
  },
};
