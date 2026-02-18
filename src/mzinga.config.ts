import { loader } from "@monaco-editor/react";
import { webpackBundler } from "@mzinga/bundler-webpack";
import { mongooseAdapter } from "@mzinga/db-mongodb";
import { postgresAdapter } from "@mzinga/db-postgres";
import { slateEditor } from "@mzinga/richtext-slate";
import payload from "mzinga";
import { buildConfig, Config } from "mzinga/config";
import type { SanitizedCollectionConfig } from "mzinga/types";
import { collections } from "./collections";
import { Slugs } from "./collections/Slugs";
import AdministerInstance from "./components/AdministerInstance";
import Avatar from "./components/Avatar";
import PoweredByMzinga from "./components/PoweredByMzinga";
import UnauthorizedUploadField from "./components/fields/UnauthorizedUploadField";
import Icon from "./components/graphics/Icon";
import Logo from "./components/graphics/Logo";
import { ConfigLoader } from "./configs/ConfigLoader";
import { WebHooks } from "./hooks/WebHooks";
import { ConfigUtils } from "./utils/ConfigUtils";
import { EnvUtils } from "./utils/EnvUtils";
import { MZingaLogger } from "./utils/MZingaLogger";
const path = require("path");
const { Env, Meta } = new ConfigLoader().Load();
const corsConfigs = Env.CORS_CONFIGS || "";
const csrfConfigs = Env.CSRF_CONFIGS || "";
const utils = new ConfigUtils(collections, null, { UnauthorizedUploadField });
const MONGODB_URI = Env.MONGODB_URI || "";
const POSTGRES_URI = Env.POSTGRES_URI || "";
const PAYLOAD_PUBLIC_SERVER_URL =
  Env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3000";
loader.config({
  paths: {
    vs: `${PAYLOAD_PUBLIC_SERVER_URL}/monaco-editor/min/vs`,
  },
});
const isReadPreferenceSecondary = () => {
  return MONGODB_URI.indexOf("readPreference=secondary") > -1;
};
const dbConfig = { db: null };
if (POSTGRES_URI) {
  MZingaLogger.Instance?.debug("Connecting to PostgreSQL database");
  dbConfig.db = postgresAdapter({
    pool: {
      connectionString: POSTGRES_URI,
    },
  });
} else {
  MZingaLogger.Instance?.debug("Connecting to MongoDB database");
  dbConfig.db = mongooseAdapter({
    url: MONGODB_URI,
    ...(isReadPreferenceSecondary()
      ? {
          connectOptions: {
            autoIndex:
              EnvUtils.GetAsBoolean(Env.MONGOOSE_ENABLE_AUTO_INDEX) || false,
            autoCreate: false,
          },
        }
      : {}),
  });
}

const webHooks = new WebHooks(Env);

const config = {
  i18n: {
    resources: {
      en: {
        general: {
          "export-list-csv": "Export list (CSV)",
          "export-list-json": "Export list (JSON)",
        },
      },
      it: {
        general: {
          "export-list-csv": "Esporta lista (CSV)",
          "export-list-json": "Esporta lista (JSON)",
        },
      },
    },
  },
  serverURL: PAYLOAD_PUBLIC_SERVER_URL,
  endpoints: [
    {
      path: "/admin/restart-instance",
      method: "post",
      handler: async (req) => {
        const { user } = req;
        if (!user) {
          MZingaLogger.Instance?.debug("No req.user found. Skipping");
          return { statusCode: 401 };
        }
        if (!user.roles?.includes("admin")) {
          MZingaLogger.Instance?.debug(
            `User ${user.id} not an admin. Skipping`,
          );
          return { statusCode: 401 };
        }
        await payload.create({
          collection: Slugs.AdminOperations,
          data: {
            operation: "restart-instance",
            user: {
              relationTo: Slugs.Users,
              value: user.id,
            },
          },
          locale: "en",
        });
        MZingaLogger.Instance?.info(
          `Restarting instance. Requested by user: ${user.id}`,
        );
        process.exit(1);
      },
    },
  ],
  admin: {
    disable: EnvUtils.GetAsBoolean(process.env.PAYLOAD_DISABLE_ADMIN) || false,
    bundler: webpackBundler(),
    user: Slugs.Users,
    indexHTML: path.resolve(__dirname, "./index.html"),
    meta: {
      titleSuffix: Meta?.TitleSuffix,
      favicon: "/assets/favicon.ico",
      ogImage: "/assets/logo.svg",
    },
    avatar: Avatar,
    components: {
      ...(Env.CAN_HIDE_PRESENTED_BY
        ? {}
        : { beforeNavLinks: [PoweredByMzinga] }),
      beforeDashboard: [AdministerInstance],
      graphics: {
        Icon,
        Logo,
      },
    },
    webpack: (config: any) => {
      return {
        ...config,
        resolve: {
          ...config.resolve,
          fallback: {
            ...config.resolve.fallback,
            tls: false,
            net: false,
            querystring: false,
            os: false,
            path: false,
            child_process: false,
            crypto: false,
            fs: false,
            util: require.resolve("util/"),
            worker_threads: false,
            tty: require.resolve("tty-browserify"),
            stream: require.resolve("stream-browserify"),
          },
          alias: {
            ...config.resolve.alias,
            redis: false,
            "rabbitmq-client": false,
            "node-fetch": false,
            payload: path.resolve("./node_modules/mzinga"),
          },
        },
      };
    },
  },
  editor: slateEditor({}),
  db: dbConfig.db,
  cookiePrefix: utils.GetCookiePrefix(),
  collections: utils.GetFilteredCollections(),
  rateLimit: {
    max: 10000,
    window: 10000,
  },
  upload: {
    limits: {
      fileSize: Env.UPLOADS_FILE_SIZE_BYTES || 5000000,
    },
  },
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, "generated-schema.graphql"),
    disable: Env.GRAPHQL_DISABLE || false,
    disablePlaygroundInProduction:
      EnvUtils.GetAsBoolean(Env.GRAPHQL_DISABLE_PLAYGROUND_IN_PRODUCTION) ||
      true,
  },
  telemetry: false,
  localization: {
    locales: Env.LOCALES ? Env.LOCALES.split(",") : ["en", "it"],
    defaultLocale: Env.DEFAULT_LOCALE ? Env.DEFAULT_LOCALE : "it",
    fallback: true,
  },
} as Config;
if (corsConfigs) {
  config.cors = corsConfigs === "*" ? corsConfigs : corsConfigs.split(",");
}
if (csrfConfigs) {
  config.csrf = csrfConfigs.split(",");
}
const buildConfigAsync = async () => {
  const serverURL = Env.CONTAINER_PORT
    ? `http://localhost:${Env.CONTAINER_PORT}`
    : Env.PAYLOAD_PUBLIC_CONFIG_SERVER_URL || config.serverURL;
  let additionalCollections = [];
  try {
    if (!Env.IS_BUILD_PROCESS) {
      MZingaLogger.Instance?.debug(
        `Fetching: "${serverURL}/configs/custom-collections"`,
      );
    }
    const response = Env.IS_BUILD_PROCESS
      ? { json: () => [] }
      : await fetch(`${serverURL}/configs/custom-collections`);
    additionalCollections = await response.json();
    utils.FilterValidCollections(config, additionalCollections);
  } catch (e) {
    MZingaLogger.Instance?.error(e);
  }
  config.plugins = await utils.GetEnabledPlugins(additionalCollections);

  const builtConfig = await buildConfig(config);

  // Enrich builtin and plugin collections with WebHooks
  builtConfig.collections = utils
    .FilterInvalidRelationships(builtConfig.collections)
    .filter(Boolean)
    .map((collection) => ({
      ...collection,
      hooks: webHooks.EnrichCollection(collection),
      fields: webHooks.EnrichFields(collection.slug, collection.fields),
    })) as SanitizedCollectionConfig[];

  return builtConfig;
};
export default buildConfigAsync();
