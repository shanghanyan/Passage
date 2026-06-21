import { register } from "@arizeai/phoenix-otel";
import Anthropic from "@anthropic-ai/sdk";
import { AnthropicInstrumentation } from "@arizeai/openinference-instrumentation-anthropic";

let enabled = false;

try {
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

  enabled = true;
  console.log(`Phoenix tracing enabled → ${url} (project: ${registerConfig.projectName})`);
} catch (err) {
  console.warn("Phoenix tracing disabled:", (err as Error).message);
}

export const phoenixEnabled = enabled;
