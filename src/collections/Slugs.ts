import { ConfigLoader } from "../configs/ConfigLoader";
const Env = ConfigLoader?.LoadEnv() || {};

const Slugs = {
  Users: "users",
  Stories: "stories",
  Tags: "tags",
  Media: "media",
  AlertTypes: "alertTypes",
  Alerts: "alerts",
  Files: "files",
  Videos: "videos",
  MediaGalleries: "mediaGalleries",
  Blocks: {
    Content: "content",
    EmbeddedForm: "embeddedForm",
    Media: "media",
    oEmbed: "oembed",
  },
  CustomEntities: "customEntities",
  Communications: "communications",
  Organizations: "organizations",
  Projects: "projects",
  Environments: "environments",
  Assets: "assets",
  Plugins: {
    Forms: "forms",
    FormSubmissions: "form-submissions",
  },
  AdminOperations: "admin-operations",
  AdminDBIndexes: "admin-dbindexes",
  ScheduledTasks: "scheduled-tasks",
  GetCollections() {
    return Env.PAYLOAD_PUBLIC_SLUGS_COLLECTIONS || "collections";
  },
};

export { Slugs };
