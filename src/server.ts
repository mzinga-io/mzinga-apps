import { initRedis } from "@aengz/payload-redis-cache";
import nodemailerSendgrid from "@newesissrl/nodemailer-sendgrid";
import { ZitadelRoutes } from "@newesissrl/payload-zitadel-plugin/dist/routes";
import assert from "assert";
import express from "express";
import fs from "fs/promises";
import payload from "mzinga";
import type { Collection } from "mzinga/dist/collections/config/types";
import payloadPkg from "mzinga/package.json";
import { PayloadRequest } from "mzinga/types";
import net from "net";
import path from "path";
import vm from "vm";
import { CustomEntities } from "./customizations/CustomEntities";
import { messageBusService } from "./messageBusService";
import { DBUtils } from "./utils/DBUtils";
import { EnvUtils } from "./utils/EnvUtils";
import { GraphQLUtils } from "./utils/GraphQLUtils";
import { MZingaLogger } from "./utils/MZingaLogger";
DBUtils.fixBooleanType();

const cookieParser = require("cookie-parser");
const customEntities = new CustomEntities(process.env.TENANT);
const mongoURLRegex = new RegExp(/mongodb:\/\/([\S]*):(\d*)\//i);
require("dotenv").config();
const app = express();
app.use(
  express.json({
    limit: process.env.JSON_LIMITS_SIZE || "20mb",
  })
);
app.use(cookieParser());
const sendGridAPIKey = process.env.SENDGRID_API_KEY;
// Redirect root to Admin panel
app.get("/", (_, res) => {
  res.redirect("/admin");
});

app.use(
  "/monaco-editor",
  express.static(path.resolve(__dirname, "../node_modules/monaco-editor"))
);
app.use("/assets", express.static(path.resolve(__dirname, "../assets")));

const envConfigFileName = "env-config.js";
const envConfigPath = path.resolve(__dirname, `./${envConfigFileName}`);
app.use(`/${envConfigFileName}`, express.static(envConfigPath));

const debugHooks = (req, res) => {
  const { collection, field, hook } = req.params;
  const { body } = req;
  MZingaLogger.Instance?.debug(
    `[HOOKS] ${collection}${field ? `.${field}` : ""}.${hook}: ${JSON.stringify(
      body
    )}`
  );
  res.send("OK");
};
app.use("/debug/hooks/:collection/:field/:hook", debugHooks);
app.use("/debug/hooks/:collection/:hook", debugHooks);
app.get("/configs/custom-collections", async (_, res) => {
  const results = [];
  try {
    results.push(await customEntities.GetAll());
  } catch (e) {}
  const json = results
    .flat()
    .map((r) => {
      if (!r.result) {
        MZingaLogger.Instance?.info(r.cause);
        return null;
      }
      return r.data;
    })
    .filter(Boolean)
    .flat();
  res.json(json);
});
const start = async () => {
  if (process.env.RABBITMQ_URL) {
    // Try connecting to RabbitMQ if env is set
    try {
      await messageBusService.connect(process.env.RABBITMQ_URL);
    } catch (error) {
      MZingaLogger.Instance?.error("Failed to connect to RabbitMQ:", error);
    }
  }

  if (
    process.env.REDIS_URI &&
    EnvUtils.GetAsBoolean(process.env.PAYLOAD_PUBLIC_ENABLE_CACHE_PLUGIN)
  ) {
    initRedis({
      redisUrl: process.env.REDIS_URI,
      redisNamespace: process.env.TENANT,
      redisIndexesName: `${process.env.TENANT}-cache-index`,
    });
  }
  app.listen(process.env.PORT || 3000);
  await payload.init({
    ...(sendGridAPIKey
      ? {
          email: {
            transportOptions: nodemailerSendgrid({
              apiKey: sendGridAPIKey,
            }),
            fromAddress: "admin@mzinga.io",
            fromName: "Mzinga.io",
          },
        }
      : {}),
    secret: process.env.PAYLOAD_SECRET || "",
    express: app,
    loggerOptions: MZingaLogger.LoggerOptions,
    onInit: () => {
      payload.logger.info(
        `Payload@v${payloadPkg.version}(tenant=${process.env.TENANT}, env=${
          process.env.ENV
        }) Admin URL: ${payload.getAdminURL()}`
      );
    },
  });
  DBUtils.createUpdatedAtDescIndexes(payload);
  GraphQLUtils.generateSchema(payload);
  if (
    process.env.PAYLOAD_PUBLIC_ZITADEL_REDIRECT_URI &&
    EnvUtils.GetAsBoolean(process.env.PAYLOAD_PUBLIC_ENABLE_ZITADEL_PLUGIN)
  ) {
    ZitadelRoutes(app);
  }
  app.get("/probes/backoffice/health", async (_, res) => {
    if (!(await fs.stat(envConfigPath))) {
      res.status(404).send(`${envConfigFileName} not found`);
      return;
    }
    const envConfigContent = await fs.readFile(envConfigPath, {
      encoding: "utf8",
    });
    try {
      const script = new vm.Script(envConfigContent);
      const ctx = vm.createContext({ window: {} });
      script.runInContext(ctx);
      assert.equal(
        ctx.window._env_ != null,
        true,
        `The file "${envConfigFileName}" doesn't contain the mandatory "_env_" property`
      );
    } catch (e) {
      res.status(500).send({ msg: e.message, content: envConfigContent });
      return;
    }
    res.status(200).send(`Valid "${envConfigFileName}" file found`);
  });
  app.get("/probes/api/health", async (req: PayloadRequest, res) => {
    const collectionWithAuth = Object.values(req.payload.collections).find(
      (c: Collection) => Boolean(c.config.auth)
    );
    if (!collectionWithAuth) {
      res.status(404).send(`No collection with "auth" property found`);
      return;
    }
    try {
      await req.payload.find({
        collection: (collectionWithAuth as any).config.slug,
        limit: 1,
      });
    } catch (e) {
      res
        .status(500)
        .send(`Cannot find "${(collectionWithAuth as any).config.slug}"`);
      return;
    }
    res.sendStatus(200);
  });
  app.get("/probes/ready", (req: PayloadRequest, res) => {
    const { url } = req.payload.db;
    if (!url) {
      res.sendStatus(500);
      return;
    }
    const values = mongoURLRegex.exec(url);
    if (values.length <= 1) {
      res
        .status(500)
        .send(
          `mongoURL provided not fitting the regex ${mongoURLRegex.source}`
        );
      return;
    }
    values.shift();
    let [host, port] = values;
    if (host.indexOf("@") > -1) {
      host = host.split("@")[1];
    }
    const tcpClient = new net.Socket();
    tcpClient.connect(+port, host, () => {
      res.sendStatus(200);
      tcpClient.destroy();
    });
  });

  app.get("/probes/startup", (req: PayloadRequest, res) => {
    if (
      !(req.payload.collections && Object.keys(req.payload.collections).length)
    ) {
      res.sendStatus(500);
      return;
    }
    res.sendStatus(200);
  });
};
start();
process.on("SIGINT", async function () {
  await messageBusService.close();
  process.exit();
});
