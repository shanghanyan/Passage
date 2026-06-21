import { useEffect } from "react";

/** Keeps launcher alive while this tab is open; signals shutdown on close. */
export function useLauncherSession() {
  useEffect(() => {
    let active = true;

    const heartbeat = () => {
      if (!active || document.visibilityState === "hidden") return;
      void fetch("/api/launcher/heartbeat", { method: "POST", keepalive: true }).catch(() => undefined);
    };

    const goodbye = () => {
      if (!active) return;
      navigator.sendBeacon?.("/api/launcher/goodbye", "");
    };

    heartbeat();
    const interval = window.setInterval(heartbeat, 4000);
    document.addEventListener("visibilitychange", heartbeat);
    // pagehide only — beforeunload + pagehide together caused premature shutdown on refresh/HMR
    window.addEventListener("pagehide", goodbye);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", heartbeat);
      window.removeEventListener("pagehide", goodbye);
    };
  }, []);
}
