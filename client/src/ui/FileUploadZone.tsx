import { useCallback, useRef, useState } from "react";
import { useUiLocale } from "../i18n/useUiLocale";
import {
  extractDocumentOnServer,
  isServerExtractType,
  readTextFileClientSide,
  SERVER_EXTRACT_NOTICE,
} from "../lib/extract-document";
import { ConnectionLostError } from "../lib/api-fetch";

interface FileUploadZoneProps {
  uiLocale: import("../i18n/strings").UiLocale;
  disabled?: boolean;
  onTextReady: (text: string, source: "paste" | "txt" | "pdf" | "image") => void;
  onError: (message: string) => void;
  onConnectionLost?: () => void;
}

type PendingServerFile = { file: File; kind: "pdf" | "image" };

export function FileUploadZone({ uiLocale, disabled, onTextReady, onError, onConnectionLost }: FileUploadZoneProps) {
  const { t } = useUiLocale(uiLocale);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [pending, setPending] = useState<PendingServerFile | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConnectionError = useCallback(
    (err: unknown) => {
      if (err instanceof ConnectionLostError) {
        onConnectionLost?.();
        return true;
      }
      return false;
    },
    [onConnectionLost],
  );

  const processTxt = useCallback(
    async (file: File) => {
      setExtracting(true);
      onError("");
      try {
        const text = await readTextFileClientSide(file);
        onTextReady(text, "txt");
      } catch (err) {
        onError(err instanceof Error ? err.message : "Could not read text file");
      } finally {
        setExtracting(false);
      }
    },
    [onError, onTextReady],
  );

  const processServerFile = useCallback(
    async (file: File, kind: "pdf" | "image") => {
      setExtracting(true);
      onError("");
      try {
        const text = await extractDocumentOnServer(file);
        onTextReady(text, kind);
        setPending(null);
        setAcknowledged(false);
      } catch (err) {
        if (!handleConnectionError(err)) {
          onError(err instanceof Error ? err.message : "Extraction failed");
        }
      } finally {
        setExtracting(false);
      }
    },
    [handleConnectionError, onError, onTextReady],
  );

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled || extracting) return;

      if (file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain") {
        void processTxt(file);
        return;
      }

      if (isServerExtractType(file)) {
        const kind = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf" ? "pdf" : "image";
        setPending({ file, kind });
        setAcknowledged(false);
        return;
      }

      onError("Unsupported file type. Use .txt, .pdf, or an image (PNG, JPG, WebP).");
    },
    [disabled, extracting, onError, processTxt],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  return (
    <div className="upload-section">
      <div
        className={`upload-zone${dragOver ? " upload-zone--active" : ""}${disabled || extracting ? " upload-zone--disabled" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !extracting) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && !extracting && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.pdf,image/png,image/jpeg,image/webp,image/gif"
          hidden
          disabled={disabled || extracting}
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div className="upload-icon">
          <i className="ti ti-upload" />
        </div>
        <h3>{extracting ? t("upload.processing") : t("upload.title")}</h3>
        <p>{t("upload.hint")}</p>
        {extracting && <span className="spinner" style={{ marginTop: 12 }} />}
      </div>

      {pending && (
        <div className="upload-privacy-gate" role="alert">
          <div className="upload-privacy-gate__icon">
            <i className="ti ti-alert-triangle" />
          </div>
          <p className="upload-privacy-gate__notice">{SERVER_EXTRACT_NOTICE}</p>
          <label className="upload-privacy-gate__ack">
            <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
            {t("upload.ack")}
          </label>
          <div className="tool-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!acknowledged || extracting}
              onClick={() => void processServerFile(pending.file, pending.kind)}
            >
              {extracting ? (
                <>
                  <span className="spinner" /> {t("upload.processing")}
                </>
              ) : (
                <>
                  <i className="ti ti-cloud-upload" /> {t("upload.proceed")}{" "}
                  {pending.kind === "pdf" ? "PDF" : "image"}
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={extracting}
              onClick={() => {
                setPending(null);
                setAcknowledged(false);
              }}
            >
              {t("upload.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
