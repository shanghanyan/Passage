import { useEffect, useState } from "react";

export default function App() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [stubResponse, setStubResponse] = useState("");

  useEffect(() => {
    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        redacted_text: "⟦PII:NAME:1⟧ received a Request for Evidence.",
        target_language: "Spanish",
        session_id: "phase-0-demo",
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { translated_text: string }) => {
        setStubResponse(data.translated_text);
        setStatus("ok");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main>
      <h1>Passage</h1>
      <p>Privacy-first immigration document translator</p>

      <section aria-live="polite">
        {status === "loading" && <p>Connecting to backend…</p>}
        {status === "error" && (
          <p role="alert">Backend round-trip failed — is the server running on port 3001?</p>
        )}
        {status === "ok" && (
          <>
            <p>Backend round-trip ok.</p>
            <blockquote>{stubResponse}</blockquote>
          </>
        )}
      </section>
    </main>
  );
}
