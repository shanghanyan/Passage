import {
  getObservabilityEnabled,
  getObservabilityTarget,
  initObservability,
} from "./lib/observability/index.js";

initObservability();

export { getObservabilityEnabled as observabilityEnabled, getObservabilityTarget as observabilityTarget };
