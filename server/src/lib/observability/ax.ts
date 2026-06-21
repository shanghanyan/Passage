import Anthropic from "@anthropic-ai/sdk";
import { AnthropicInstrumentation } from "@arizeai/openinference-instrumentation-anthropic";
import { SEMRESATTRS_PROJECT_NAME } from "@arizeai/openinference-semantic-conventions";
import type { TracerProvider } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

export function initArizeAxTracing(): TracerProvider {
  const spaceId = process.env.ARIZE_SPACE_ID;
  const apiKey = process.env.ARIZE_API_KEY;
  if (!spaceId || !apiKey) {
    throw new Error("ARIZE_SPACE_ID and ARIZE_API_KEY are required when OBSERVABILITY_TARGET=ax");
  }

  const projectName = process.env.ARIZE_PROJECT_NAME ?? "immigration-redaction-demo";
  const endpoint = process.env.ARIZE_COLLECTOR_ENDPOINT ?? "https://otlp.arize.com/v1/traces";

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [SEMRESATTRS_PROJECT_NAME]: projectName,
    }),
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: endpoint,
          headers: {
            "space_id": spaceId,
            "api_key": apiKey,
          },
        }),
      ),
    ],
  });

  provider.register();

  const instrumentation = new AnthropicInstrumentation({ tracerProvider: provider });
  instrumentation.manuallyInstrument(Anthropic);

  console.log(`Observability [Arize AX] → ${endpoint} (project: ${projectName})`);
  return provider;
}
