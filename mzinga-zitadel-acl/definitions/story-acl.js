module.exports = {
  "fields": [],
  "extends": {
    "fields": [],
    "access": {
      "read": "(args) => { if(!args.req.user){ return true; } return args.req.user.roles?.includes(\"admin\"); }"
    },
    "collection": "stories",
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
  "slug": "story-acl"
};