#!/usr/bin/env node
/**
 * Passage launcher — pick Local Phoenix or Arize AX Cloud, then start server + client.
 *
 * Double-click "Launch Passage.app" (macOS) or run: node launch.mjs
 */
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.join(ROOT, "server");
const CLIENT_DIR = path.join(ROOT, "client");
const LOG_FILE = path.join(ROOT, ".passage-launch.log");
const SERVER_URL = "http://localhost:3001";
const CLIENT_URL = "http://localhost:5173";

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  if (process.env.PASSAGE_LAUNCH_QUIET !== "1") console.log(msg);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickObservabilityTarget() {
  const fromArg = process.argv.find((a) => a.startsWith("--obs="));
  if (fromArg) return fromArg.split("=")[1];

  if (process.argv.includes("--local") || process.argv.includes("--phoenix")) return "phoenix";
  if (process.argv.includes("--cloud") || process.argv.includes("--ax")) return "ax";

  if (process.env.OBSERVABILITY_TARGET) return process.env.OBSERVABILITY_TARGET;

  if (process.platform === "darwin") {
    try {
      const choice = execSync(
        `osascript -e 'display dialog "Choose observability for Passage:" buttons {"Local Phoenix", "Arize AX Cloud", "Cancel"} default button 1 with title "Passage Launcher"' -e 'button returned of result'`,
        { encoding: "utf8" },
      ).trim();

      if (choice === "Local Phoenix") return "phoenix";
      if (choice === "Arize AX Cloud") return "ax";
      process.exit(0);
    } catch {
      process.exit(0);
    }
  }

  return "phoenix";
}

function ensureEnvFile() {
  const envPath = path.join(SERVER_DIR, ".env");
  if (!fs.existsSync(envPath)) {
    throw new Error("Missing server/.env — copy server/.env.example and fill in keys (see README).");
  }
}

function ensureDeps() {
  for (const dir of [SERVER_DIR, CLIENT_DIR]) {
    if (!fs.existsSync(path.join(dir, "node_modules"))) {
      log(`Installing dependencies in ${path.basename(dir)}…`);
      execSync("npm install", { cwd: dir, stdio: "inherit" });
    }
  }
}

function dockerDaemonReady() {
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function ensureDockerDaemon() {
  if (dockerDaemonReady()) return { startedDockerDesktop: false };

  if (process.platform === "darwin") {
    log("Docker is off — starting Docker Desktop…");
    execSync("open -a Docker", { stdio: "ignore" });

    for (let i = 0; i < 90; i += 1) {
      if (dockerDaemonReady()) {
        log("Docker Desktop ready");
        return { startedDockerDesktop: true };
      }
      await sleep(1000);
    }

    throw new Error("Docker Desktop did not become ready in time");
  }

  throw new Error("Docker is not running — start Docker and try again");
}

async function startPhoenixDocker() {
  const { startedDockerDesktop } = await ensureDockerDaemon();

  try {
    execSync("docker compose -f docker-compose.phoenix.yml up -d", {
      cwd: ROOT,
      stdio: "inherit",
    });
    log("Phoenix Docker started → http://localhost:6006");
    return { startedDockerDesktop, managePhoenix: true };
  } catch (err) {
    stopPhoenixDocker({ startedDockerDesktop });
    throw err;
  }
}

function stopPhoenixDocker({ startedDockerDesktop }) {
  try {
    execSync("docker compose -f docker-compose.phoenix.yml down", {
      cwd: ROOT,
      stdio: "ignore",
    });
    log("Phoenix Docker stopped");
  } catch {
    log("Warning: could not stop Phoenix Docker");
  }

  if (startedDockerDesktop && process.platform === "darwin") {
    try {
      execSync('osascript -e \'quit app "Docker"\'', { stdio: "ignore" });
      log("Docker Desktop quit");
    } catch {
      log("Warning: could not quit Docker Desktop");
    }
  }
}

function waitForUrl(url, label, attempts = 60) {
  return new Promise((resolve) => {
    let tries = 0;
    const tick = () => {
      tries += 1;
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          log(`${label} ready`);
          resolve(true);
          return;
        }
        retry();
      });
      req.on("error", retry);
      req.setTimeout(1500, () => {
        req.destroy();
        retry();
      });

      function retry() {
        if (tries >= attempts) {
          log(`Warning: ${label} not responding yet at ${url}`);
          resolve(false);
          return;
        }
        setTimeout(tick, 1000);
      }
    };
    tick();
  });
}

function openBrowser(url) {
  try {
    if (process.platform === "darwin") execSync(`open "${url}"`);
    else if (process.platform === "win32") execSync(`start "" "${url}"`, { shell: true });
    else execSync(`xdg-open "${url}"`);
  } catch {
    log(`Open manually: ${url}`);
  }
}

function postLauncherHeartbeat() {
  return new Promise((resolve) => {
    const req = http.request(
      `${SERVER_URL}/api/launcher/heartbeat`,
      { method: "POST" },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      },
    );
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function waitForLauncherApi() {
  for (let i = 0; i < 45; i += 1) {
    if (await postLauncherHeartbeat()) {
      log("Launcher session API ready");
      return;
    }
    await sleep(1000);
  }

  throw new Error(
    "Port 3001 is in use by an old Passage server. Quit any running copy, or run: lsof -ti:3001 | xargs kill — then launch again.",
  );
}

function fetchLauncherSession() {
  return new Promise((resolve) => {
    const req = http.get(`${SERVER_URL}/api/launcher/session`, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(null);
        }
      });
    });
    req.on("error", () => resolve(null));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

function notifyStarted() {
  if (process.platform !== "darwin") return;
  try {
    execSync(
      `osascript -e 'display notification "Close the browser tab when you are done." with title "Passage running at ${CLIENT_URL}"'`,
    );
  } catch {
    // non-fatal
  }
}

async function waitForBrowserTabClose(isShuttingDown) {
  log("Passage running — close the browser tab to stop.");

  let sawHeartbeat = false;
  for (let i = 0; i < 180 && !isShuttingDown(); i += 1) {
    const session = await fetchLauncherSession();
    if (session?.lastHeartbeat > 0) {
      sawHeartbeat = true;
      break;
    }
    await sleep(1000);
  }

  if (!sawHeartbeat) {
    log("No browser tab detected — stopping Passage.");
    return;
  }

  let staleChecks = 0;
  while (!isShuttingDown()) {
    await sleep(5000);
    const session = await fetchLauncherSession();
    const staleMs = Date.now() - (session?.lastHeartbeat ?? 0);
    if (staleMs > 45000) {
      staleChecks += 1;
      if (staleChecks >= 3) {
        log("Browser tab closed (heartbeat stopped).");
        return;
      }
    } else {
      staleChecks = 0;
    }
  }
}

async function main() {
  fs.writeFileSync(LOG_FILE, "");
  process.env.PASSAGE_LAUNCHER = "1";
  const target = pickObservabilityTarget();
  log(`Observability target: ${target}`);

  ensureEnvFile();
  ensureDeps();

  let dockerState = { startedDockerDesktop: false, managePhoenix: false };
  if (target === "phoenix") {
    dockerState = await startPhoenixDocker();
  } else {
    log("Arize AX mode — traces go to https://app.arize.com (set ARIZE_SPACE_ID + ARIZE_API_KEY in server/.env)");
  }

  const childEnv = {
    ...process.env,
    OBSERVABILITY_TARGET: target,
    PASSAGE_LAUNCHER: "1",
  };

  const server = spawn("npm", ["run", "dev"], {
    cwd: SERVER_DIR,
    env: childEnv,
    stdio: process.env.PASSAGE_LAUNCH_QUIET === "1" ? "ignore" : "inherit",
    shell: true,
  });

  const client = spawn("npm", ["run", "dev"], {
    cwd: CLIENT_DIR,
    env: childEnv,
    stdio: process.env.PASSAGE_LAUNCH_QUIET === "1" ? "ignore" : "inherit",
    shell: true,
  });

  let shuttingDown = false;
  const isShuttingDown = () => shuttingDown;

  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;

    server.kill("SIGTERM");
    client.kill("SIGTERM");

    if (dockerState.managePhoenix) {
      stopPhoenixDocker({ startedDockerDesktop: dockerState.startedDockerDesktop });
    }

    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  server.on("exit", (code) => {
    if (!shuttingDown) {
      log(`Server exited unexpectedly (code ${code ?? "?"}). Check .passage-launch.log`);
      shutdown();
    }
  });

  client.on("exit", (code) => {
    if (!shuttingDown) {
      log(`Client exited unexpectedly (code ${code ?? "?"}). Check .passage-launch.log`);
      shutdown();
    }
  });

  const serverReady = await waitForUrl(`${SERVER_URL}/api/health`, "Server");
  if (!serverReady) {
    throw new Error("Server did not start — check .passage-launch.log (Redis/Claude keys in server/.env?)");
  }

  await waitForLauncherApi();

  await waitForUrl(CLIENT_URL, "Client");
  openBrowser(CLIENT_URL);
  notifyStarted();

  if (target === "phoenix") {
    log("Phoenix UI → http://localhost:6006");
  }

  await waitForBrowserTabClose(isShuttingDown);
  shutdown();
}

main().catch((err) => {
  log(`Launch failed: ${err.message}`);
  if (process.platform === "darwin") {
    execSync(
      `osascript -e 'display alert "Passage launch failed" message "${err.message.replace(/"/g, "'")}" as critical'`,
    );
  }
  process.exit(1);
});
