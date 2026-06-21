import type { TracerProvider } from "@opentelemetry/api";
import { initArizeAxTracing } from "./ax.js";
import { initPhoenixTracing } from "./phoenix.js";

export type ObservabilityTarget = "phoenix" | "ax";

let enabled = false;
let activeTarget: ObservabilityTarget = "phoenix";

export function resolveObservabilityTarget(): ObservabilityTarget {
  const raw = (process.env.OBSERVABILITY_TARGET ?? "phoenix").toLowerCase();
  if (raw === "ax" || raw === "arize" || raw === "arize-ax") return "ax";
  return "phoenix";
}

export function initObservability(): TracerProvider | null {
  activeTarget = resolveObservabilityTarget();

  try {
    const provider = activeTarget === "ax" ? initArizeAxTracing() : initPhoenixTracing();
    enabled = true;
    return provider;
  } catch (err) {
    console.warn(`Observability disabled (${activeTarget}):`, (err as Error).message);
    enabled = false;
    return null;
  }
}

export function getObservabilityEnabled(): boolean {
  return enabled;
}

export function getObservabilityTarget(): ObservabilityTarget {
  return activeTarget;
}
