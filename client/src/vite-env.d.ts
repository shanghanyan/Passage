/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_CLIENT_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
