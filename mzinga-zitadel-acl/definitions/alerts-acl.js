module.exports = {
  "fields": [],
  "extends": {
    "fields": [],
    "access": {
      "read": "(args) => { if(!args.req.user){ return true; } return args.req.user.roles?.includes(\"admin\"); }"
    },
    "collection": "alerts",
    "accessByRoles": {
      "admin": [
        "admin"
      ],
      "create": [
        "admin"
      ],
      "delete": [
        "admin"
      ],
      "update": [
        "admin"
      ]
    }
  },
  "slug": "alerts-acl"
};