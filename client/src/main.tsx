import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import App from "./App";
import "./styles/passage-v2.css";
import "./styles/passage-app.css";

initSentry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
