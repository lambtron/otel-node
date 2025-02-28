const process = require("process");
const { NodeSDK } = require("@opentelemetry/sdk-node");
const { OTLPLogExporter } = require("@opentelemetry/exporter-logs-otlp-http");
const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");
const { OTLPTraceExporter } = require(
    "@opentelemetry/exporter-trace-otlp-http",
);
const { OTLPMetricExporter } = require(
    "@opentelemetry/exporter-metrics-otlp-http",
);
const { getNodeAutoInstrumentations } = require(
    "@opentelemetry/auto-instrumentations-node",
);
// const { WinstonInstrumentation } = require("@opentelemetry/instrumentation-winston");
// const { registerInstrumentations } = require("@opentelemetry/instrumentation");

// Enable debug logging if needed
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
        url: "http://otel-collector:4318/v1/traces",
        // url: "http://otel-collector:4318/api/traces",
    }),
    logExporter: new OTLPLogExporter({
        url: "http://otel-collector:4318/v1/logs",
    }),
    metricExporter: new OTLPMetricExporter({
        url: "http://otel-collector:4318/v1/metrics",
    }),
    instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
console.log("Telemetry initialized");

process.on("SIGTERM", () => {
    sdk.shutdown()
        .then(() => console.log("Telemetry shutdown complete"))
        .finally(() => process.exit(0));
});
