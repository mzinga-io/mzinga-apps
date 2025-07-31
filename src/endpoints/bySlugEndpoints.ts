export const bySlugEndpoints = [
  {
    method: "get",
    path: "/byslug/:slug",
    handler: async function (req, res) {
      const {
        payload,
        params,
        collection: {
          config: { slug: collectionSlug },
        },
      } = req;
      const { slug } = params;
      const { locale } = req.query;
      const result = await payload.find({
        collection: collectionSlug,
        locale,
        where: {
          slug: {
            equals: slug,
          },
        },
      });
      if (!result?.docs?.length) {
        res.status(404).send("Not found");
        return;
      }
      res.json(result.docs[0]);
    },
  },
];
