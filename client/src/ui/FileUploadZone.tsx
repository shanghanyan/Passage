import { useCallback, useRef, useState } from "react";
import { useUiLocale } from "../i18n/useUiLocale";
import {
  extractDocument,
  readTextFileClientSide,
  SERVER_EXTRACT_FALLBACK_NOTICE,
} from "../lib/extract-document";
import { ConnectionLostError } from "../lib/api-fetch";

interface FileUploadZoneProps {
  uiLocale: import("../i18n/strings").UiLocale;
  disabled?: boolean;
  onTextReady: (text: string, source: "paste" | "txt" | "pdf" | "image") => void;
  onError: (message: string) => void;
  onConnectionLost?: () => void;
  onExtractNotice?: (message: string) => void;
}

export function FileUploadZone({
  uiLocale,
  disabled,
  onTextReady,
  onError,
  onConnectionLost,
  onExtractNotice,
}: FileUploadZoneProps) {
  const { t } = useUiLocale(uiLocale);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);

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
        onError(err instanceof Error ? err.message : t("upload.readFailed"));
      } finally {
        setExtracting(false);
      }
    },
    [onError, onTextReady, t],
  );

  const processBinary = useCallback(
    async (file: File, kind: "pdf" | "image") => {
      setExtracting(true);
      onError("");
      try {
        const { text, usedServerFallback } = await extractDocument(file);
        if (usedServerFallback) {
          onExtractNotice?.(SERVER_EXTRACT_FALLBACK_NOTICE);
        }
        onTextReady(text, kind);
      } catch (err) {
        if (!handleConnectionError(err)) {
          onError(err instanceof Error ? err.message : t("upload.extractFailed"));
        }
      } finally {
        setExtracting(false);
      }
    },
    [handleConnectionError, onError, onExtractNotice, onTextReady, t],
  );

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled || extracting) return;

      if (file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain") {
        void processTxt(file);
        return;
      }

      if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
        void processBinary(file, "pdf");
        return;
      }

      if (file.type.startsWith("image/")) {
        void processBinary(file, "image");
        return;
      }

      onError(t("upload.unsupported"));
    },
    [disabled, extracting, onError, processBinary, processTxt, t],
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
        <p className="upload-zone__privacy-note">{t("upload.clientNotice")}</p>
        {extracting && <span className="spinner" style={{ marginTop: 12 }} />}
      </div>
    </div>
  );
}
