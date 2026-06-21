import { register } from "@arizeai/phoenix-otel";
import Anthropic from "@anthropic-ai/sdk";
import { AnthropicInstrumentation } from "@arizeai/openinference-instrumentation-anthropic";
import type { TracerProvider } from "@opentelemetry/api";

export function initPhoenixTracing(): TracerProvider {
  const url =
    process.env.PHOENIX_COLLECTOR_ENDPOINT ??
    process.env.PHOENIX_HOST ??
    "http://localhost:6006";

  const registerConfig: Parameters<typeof register>[0] = {
    projectName: process.env.PHOENIX_PROJECT_NAME ?? "immigration-redaction-demo",
    url,
  };

  if (process.env.PHOENIX_API_KEY) {
    registerConfig.apiKey = process.env.PHOENIX_API_KEY;
  }

  const tracerProvider = register(registerConfig);

  const instrumentation = new AnthropicInstrumentation({ tracerProvider });
  instrumentation.manuallyInstrument(Anthropic);

  console.log(`Observability [Phoenix] → ${url} (project: ${registerConfig.projectName})`);
  return tracerProvider;
}
