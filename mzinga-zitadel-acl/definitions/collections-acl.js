module.exports = {
  fields: [],
  extends: {
    fields: [],
    access: {
      read: ((args) => {
        if (!args.req.user) {
          return true;
        }
        return args.req.user.roles?.includes("admin");
      }).toString(),
    },
    collection: "collections",
    accessByRoles: {
      admin: ["admin"],
      create: ["admin"],
      delete: ["admin"],
      update: ["admin"],
    },
  },
  slug: "collections-acl",
};
