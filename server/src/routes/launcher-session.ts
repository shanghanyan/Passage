import type { Express, Request, Response } from "express";
import {
  getLauncherSessionState,
  recordLauncherGoodbye,
  recordLauncherHeartbeat,
} from "../lib/session-store.js";

export function registerLauncherRoutes(app: Express): void {
  app.post("/api/launcher/heartbeat", (_req, res) => {
    void recordLauncherHeartbeat()
      .then(() => res.json({ ok: true }))
      .catch(() => res.json({ ok: true }));
  });

  app.post("/api/launcher/goodbye", (_req, res) => {
    void recordLauncherGoodbye()
      .then(() => res.json({ ok: true }))
      .catch(() => res.json({ ok: true }));
  });

  app.get("/api/launcher/session", (_req, res) => {
    void getLauncherSessionState()
      .then(({ lastHeartbeat, closed }) => {
        res.json({ ok: true, lastHeartbeat, closed });
      })
      .catch(() => {
        res.json({ ok: true, lastHeartbeat: 0, closed: false });
      });
  });
}
