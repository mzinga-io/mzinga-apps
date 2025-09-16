import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  defaultResource,
  detectResources,
  envDetector,
  hostDetector,
  osDetector,
  processDetector,
  resourceFromAttributes,
} from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import {
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { traceProviderConfig } from "./utils/TraceProviderConfig";
const ATTR_SERVICE_NAMESPACE = "service.namespace";

import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { containerDetector } from "@opentelemetry/resource-detector-container";
import { LokiExporter } from "./lokiExporter";
require("dotenv").config();
const DISABLE_TRACING = (process.env.DISABLE_TRACING || "0") == "1";
function main() {
  const OTEL_LOG_LEVEL = process.env.OTEL_LOG_LEVEL || DiagLogLevel.INFO;
  diag.setLogger(new DiagConsoleLogger(), OTEL_LOG_LEVEL as DiagLogLevel);
  if (DISABLE_TRACING) {
    diag.info("Tracing is DISABLED");
    return;
  }
  const pkg = require("../package.json");
  const mzingaPkg = require("mzinga/package.json");
  const IDENTIFIER = [
    process.env.TENANT || (Math.random() + 1).toString(36).substring(7),
    process.env.ENV,
  ].join("-");
  const serviceName = [process.env.SERVICE_NAME || pkg.name, IDENTIFIER].join(
    "-"
  );
  const OTEL_EXPORTER_URL =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";
  const exporter = new OTLPTraceExporter({});
  const detectors = [
    containerDetector,
    envDetector,
    hostDetector,
    osDetector,
    processDetector,
  ];
  detectResources({
    detectors,
  });

  const resource = defaultResource().merge(
    resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: pkg.version,
      payload_version: mzingaPkg.version,
      [ATTR_SERVICE_NAMESPACE]: IDENTIFIER,
      env: process.env.ENV,
      tenant: process.env.TENANT,
    })
  );

  const tracerProvider = new NodeTracerProvider({
    resource,
    spanProcessors: [
      new BatchSpanProcessor(exporter),
      process.env.OTEL_CONSOLE_EXPORTER &&
        new SimpleSpanProcessor(new LokiExporter()),
    ],
  });

  registerInstrumentations({
    tracerProvider: tracerProvider,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-express": {
          enabled: true,
        },
        "@opentelemetry/instrumentation-mongodb": {
          enabled: true,
          enhancedDatabaseReporting: true,
        },
        "@opentelemetry/instrumentation-mongoose": { enabled: true },
        "@opentelemetry/instrumentation-graphql": { enabled: true },
        "@opentelemetry/instrumentation-fs": {
          enabled: true,
          requireParentSpan: true,
        },
        "@opentelemetry/instrumentation-dataloader": {
          enabled: false,
          requireParentSpan: true,
        },
        "@opentelemetry/instrumentation-http": {
          enabled: true,
          ignoreIncomingRequestHook: (incomingMessage) => {
            return (
              incomingMessage.url?.indexOf("/metrics") > -1 ||
              incomingMessage.url?.indexOf("/probes") > -1
            );
          },
          ignoreOutgoingRequestHook: (requestOptions) => {
            return (
              requestOptions.path?.indexOf("/metrics") > -1 ||
              requestOptions.path?.indexOf("/probes") > -1
            );
          },
        },
        "@opentelemetry/instrumentation-aws-lambda": {
          enabled: false,
        },
      }),
    ],
  });

  diag.info(`Tracing initialized for ${serviceName} to ${OTEL_EXPORTER_URL}`);
  tracerProvider.register(traceProviderConfig);
  // gracefully shut down the SDK on process exit
  process.on("SIGTERM", () => {
    //sdk
    tracerProvider
      .shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error) => console.log("Error terminating tracing", error))
      .finally(() => process.exit(0));
  });
}
main();
