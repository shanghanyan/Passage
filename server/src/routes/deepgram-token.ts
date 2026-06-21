import type { Request, Response } from "express";
import { mintDeepgramClientToken } from "../lib/deepgram.js";
import { captureExternalError } from "../lib/sentry.js";

export async function postDeepgramToken(_req: Request, res: Response): Promise<void> {
  try {
    const result = await mintDeepgramClientToken();
    if (result.mode === "client") {
      res.json({ mode: "client", token: result.token, expiresIn: result.expiresIn });
    } else {
      res.json({ mode: "server-proxy", message: result.message });
    }
  } catch (err) {
    captureExternalError("deepgram-token", err);
    res.status(502).json({ error: "Failed to mint Deepgram token" });
  }
}
