const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { PeriodicExportingMetricReader, MeterProvider } = require('@opentelemetry/sdk-metrics');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Enable detailed logs for debugging
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Define resource attributes
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'express-app',
  [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
});

// Initialize tracing
const tracerProvider = new NodeTracerProvider({ resource });
const traceExporter = new OTLPTraceExporter({ url: 'http://localhost:4317/v1/traces' });
tracerProvider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));
tracerProvider.register();

// Initialize metrics
const meterProvider = new MeterProvider({ resource });
const metricExporter = new OTLPMetricExporter({ url: 'http://localhost:4317/v1/metrics' });
meterProvider.addMetricReader(new PeriodicExportingMetricReader({ exporter: metricExporter }));

console.log('✅ OpenTelemetry Tracing & Metrics Initialized');

module.exports = { tracerProvider, meterProvider };
