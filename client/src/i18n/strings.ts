export type UiLocale = "en" | "es" | "fr";

export type StringKey =
  | "app.tagline"
  | "nav.newDocument"
  | "phase.paste"
  | "phase.privacy"
  | "phase.translating"
  | "phase.results"
  | "phase.yourDocument"
  | "phase.blocked"
  | "landing.eyebrow"
  | "landing.title"
  | "landing.body"
  | "landing.privacy"
  | "landing.cta"
  | "input.title"
  | "input.notice"
  | "input.translateTo"
  | "input.orPaste"
  | "input.placeholder"
  | "input.analyze"
  | "input.analyzing"
  | "input.samples"
  | "upload.title"
  | "upload.hint"
  | "upload.processing"
  | "upload.ack"
  | "upload.proceed"
  | "upload.cancel"
  | "tab.translation"
  | "tab.privacy"
  | "tab.voice"
  | "tab.documents"
  | "connection.title"
  | "connection.body"
  | "connection.retry"
  | "connection.startOver"
  | "tts.speed"
  | "tts.speedNormal"
  | "tts.speed2x"
  | "tts.speed4x"
  | "docs.loading"
  | "docs.disclaimer"
  | "docs.empty"
  | "docs.error";

const en: Record<StringKey, string> = {
  "app.tagline": "Privacy-first immigration document translation",
  "nav.newDocument": "New document",
  "phase.paste": "1 · Paste",
  "phase.privacy": "2 · Privacy review",
  "phase.translating": "3 · Translating",
  "phase.results": "4 · Your document",
  "phase.yourDocument": "4 · Your document",
  "phase.blocked": "4 · Blocked",
  "landing.eyebrow": "For immigrants navigating U.S. paperwork",
  "landing.title": "Understand official letters without giving up your privacy",
  "landing.body":
    "Passage detects sensitive information in your browser, replaces it with tokens, and only then sends text for translation. You review every scrubbed preview before anything leaves your device.",
  "landing.privacy": "Client-side redaction · Tokenized translation · Optional voice Q&A",
  "landing.cta": "Get started",
  "input.title": "Add document section",
  "input.notice":
    "PII detection runs in your browser. Nothing is sent until you review the scrubbed preview and press send for translation.",
  "input.translateTo": "Translate to",
  "input.orPaste": "or paste text",
  "input.placeholder": "Paste the document text here…",
  "input.analyze": "Analyze & redact",
  "input.analyzing": "Analyzing…",
  "input.samples": "Or try a synthetic test document:",
  "upload.title": "Upload document",
  "upload.hint": "Drag & drop or click — .txt (private), .pdf, or image",
  "upload.processing": "Processing file…",
  "upload.ack": "I understand — proceed with server-side extraction",
  "upload.proceed": "Upload",
  "upload.cancel": "Cancel",
  "tab.translation": "Translation",
  "tab.privacy": "Privacy",
  "tab.voice": "Voice Q&A",
  "tab.documents": "Related documents",
  "connection.title": "Connection lost",
  "connection.body":
    "Passage cannot reach the server right now. Your redacted text is still in the browser — nothing was sent. Check that the server is running and try again.",
  "connection.retry": "Retry connection",
  "connection.startOver": "Start over",
  "tts.speed": "Speed",
  "tts.speedNormal": "1×",
  "tts.speed2x": "2×",
  "tts.speed4x": "4×",
  "docs.loading": "Identifying process and related document types…",
  "docs.disclaimer":
    "General information only — requirements vary by case and jurisdiction. This is not legal advice and does not tell anyone what to file.",
  "docs.empty": "Complete translation to see commonly associated document types.",
  "docs.error": "Could not load related documents. Try again later.",
};

const es: Record<StringKey, string> = {
  ...en,
  "app.tagline": "Traducción de documentos migratorios con privacidad primero",
  "nav.newDocument": "Nuevo documento",
  "phase.paste": "1 · Pegar",
  "phase.privacy": "2 · Revisión de privacidad",
  "phase.translating": "3 · Traduciendo",
  "phase.results": "4 · Su documento",
  "phase.yourDocument": "4 · Su documento",
  "phase.blocked": "4 · Bloqueado",
  "landing.eyebrow": "Para personas que navegan trámites en EE. UU.",
  "landing.title": "Entienda cartas oficiales sin renunciar a su privacidad",
  "landing.body":
    "Passage detecta información sensible en su navegador, la reemplaza con tokens y solo entonces envía el texto para traducción. Usted revisa cada vista previa antes de que algo salga de su dispositivo.",
  "landing.privacy": "Redacción local · Traducción tokenizada · Preguntas por voz opcionales",
  "landing.cta": "Comenzar",
  "input.title": "Agregar sección del documento",
  "input.notice":
    "La detección de PII se ejecuta en su navegador. Nada se envía hasta que revise la vista previa y presione enviar para traducir.",
  "input.translateTo": "Traducir a",
  "input.orPaste": "o pegue texto",
  "input.placeholder": "Pegue el texto del documento aquí…",
  "input.analyze": "Analizar y redactar",
  "input.analyzing": "Analizando…",
  "input.samples": "O pruebe un documento de prueba:",
  "upload.title": "Subir documento",
  "upload.hint": "Arrastre o haga clic — .txt (privado), .pdf o imagen",
  "upload.processing": "Procesando archivo…",
  "upload.ack": "Entiendo — continuar con extracción en el servidor",
  "upload.proceed": "Subir",
  "upload.cancel": "Cancelar",
  "tab.translation": "Traducción",
  "tab.privacy": "Privacidad",
  "tab.voice": "Preguntas por voz",
  "tab.documents": "Documentos relacionados",
  "connection.title": "Conexión perdida",
  "connection.body":
    "Passage no puede contactar al servidor. Su texto redactado sigue en el navegador. Verifique que el servidor esté activo e intente de nuevo.",
  "connection.retry": "Reintentar conexión",
  "connection.startOver": "Empezar de nuevo",
  "tts.speed": "Velocidad",
  "tts.speedNormal": "1×",
  "tts.speed2x": "2×",
  "tts.speed4x": "4×",
  "docs.loading": "Identificando trámite y tipos de documentos relacionados…",
  "docs.disclaimer":
    "Información general — los requisitos varían según el caso. No es asesoría legal ni indica qué debe presentar alguien.",
  "docs.empty": "Complete la traducción para ver tipos de documentos comúnmente asociados.",
  "docs.error": "No se pudieron cargar los documentos relacionados.",
};

const fr: Record<StringKey, string> = {
  ...en,
  "app.tagline": "Traduction de documents d'immigration axée sur la confidentialité",
  "nav.newDocument": "Nouveau document",
  "phase.paste": "1 · Coller",
  "phase.privacy": "2 · Revue confidentialité",
  "phase.translating": "3 · Traduction",
  "phase.results": "4 · Votre document",
  "phase.yourDocument": "4 · Votre document",
  "phase.blocked": "4 · Bloqué",
  "landing.eyebrow": "Pour naviguer les démarches aux États-Unis",
  "landing.title": "Comprendre les lettres officielles sans sacrifier sa vie privée",
  "landing.body":
    "Passage détecte les informations sensibles dans le navigateur, les remplace par des jetons, puis envoie le texte pour traduction. Chaque aperçu nettoyé est revu avant tout envoi.",
  "landing.privacy": "Caviardage local · Traduction tokenisée · Q&R vocale optionnelle",
  "landing.cta": "Commencer",
  "input.title": "Ajouter une section du document",
  "input.notice":
    "La détection des PII s'exécute dans le navigateur. Rien n'est envoyé avant la revue de l'aperçu et l'envoi pour traduction.",
  "input.translateTo": "Traduire en",
  "input.orPaste": "ou coller du texte",
  "input.placeholder": "Collez le texte du document ici…",
  "input.analyze": "Analyser et caviarder",
  "input.analyzing": "Analyse…",
  "input.samples": "Ou essayer un document de test :",
  "upload.title": "Téléverser un document",
  "upload.hint": "Glisser-déposer ou cliquer — .txt (privé), .pdf ou image",
  "upload.processing": "Traitement du fichier…",
  "upload.ack": "Je comprends — procéder à l'extraction côté serveur",
  "upload.proceed": "Téléverser",
  "upload.cancel": "Annuler",
  "tab.translation": "Traduction",
  "tab.privacy": "Confidentialité",
  "tab.voice": "Q&R vocale",
  "tab.documents": "Documents associés",
  "connection.title": "Connexion perdue",
  "connection.body":
    "Passage ne peut pas joindre le serveur. Le texte caviardé reste dans le navigateur. Vérifiez que le serveur fonctionne et réessayez.",
  "connection.retry": "Réessayer",
  "connection.startOver": "Recommencer",
  "tts.speed": "Vitesse",
  "tts.speedNormal": "1×",
  "tts.speed2x": "2×",
  "tts.speed4x": "4×",
  "docs.loading": "Identification du processus et des documents associés…",
  "docs.disclaimer":
    "Information générale — les exigences varient selon le dossier. Ce n'est pas un conseil juridique.",
  "docs.empty": "Terminez la traduction pour voir les types de documents associés.",
  "docs.error": "Impossible de charger les documents associés.",
};

const TABLE: Record<UiLocale, Record<StringKey, string>> = { en, es, fr };

export function uiLocaleFromLangCode(langCode: string): UiLocale {
  if (langCode === "es") return "es";
  if (langCode === "fr") return "fr";
  return "en";
}

export function t(locale: UiLocale, key: StringKey): string {
  return TABLE[locale][key] ?? TABLE.en[key] ?? key;
}
