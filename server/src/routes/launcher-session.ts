import type { Express, Request, Response } from "express";

let lastHeartbeat = 0;
let tabClosed = false;

export function registerLauncherRoutes(app: Express): void {
  app.post("/api/launcher/heartbeat", (_req, res) => {
    tabClosed = false;
    lastHeartbeat = Date.now();
    res.json({ ok: true });
  });

  app.post("/api/launcher/goodbye", (_req, res) => {
    tabClosed = true;
    res.json({ ok: true });
  });

  app.get("/api/launcher/session", (_req, res) => {
    res.json({ ok: true, lastHeartbeat, closed: tabClosed });
  });
}
