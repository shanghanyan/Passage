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

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  if (process.env.PASSAGE_LAUNCH_QUIET !== "1") console.log(msg);
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

function waitForUrl(url, label, attempts = 30) {
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

async function main() {
  fs.writeFileSync(LOG_FILE, "");
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

  await waitForUrl("http://localhost:3001/api/health", "Server");
  await waitForUrl("http://localhost:5173", "Client");
  openBrowser("http://localhost:5173");

  if (target === "phoenix") {
    log("Phoenix UI → http://localhost:6006");
  }

  if (process.env.PASSAGE_LAUNCH_QUIET === "1" && process.platform === "darwin") {
    execSync(
      `osascript -e 'display notification "App at http://localhost:5173" with title "Passage started"'`,
    );
  }

  log("Passage running. Press Ctrl+C in this window to stop (or quit Launch Passage.app).");

  await new Promise(() => {});
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
