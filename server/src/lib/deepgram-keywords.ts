/** Deepgram STT keyword boosting for non-English personal names (defense-in-depth with client redaction). */
export function sttKeywordsForLanguage(sttLanguage: string): string[] {
  const lang = sttLanguage.toLowerCase();

  const common: string[] = [
    "Maria:Garcia:5",
    "Jose:Hernandez:5",
    "Nguyen:5",
    "Tran:5",
    "Kim:5",
    "Patel:5",
    "Hassan:5",
  ];

  if (lang.startsWith("vi")) {
    return [...common, "Nguyen:10", "Tran:10", "Pham:8", "Le:8", "Hoang:8", "Vo:8"];
  }
  if (lang.startsWith("ko")) {
    return [...common, "Kim:10", "Park:10", "Lee:10", "Choi:8", "Jung:8"];
  }
  if (lang.startsWith("zh")) {
    return [...common, "Wang:10", "Li:10", "Zhang:10", "Chen:8", "Liu:8"];
  }
  if (lang.startsWith("ar")) {
    return [...common, "Mohammed:10", "Ahmed:10", "Hassan:10", "Ali:8", "Fatima:8"];
  }
  if (lang.startsWith("tl") || lang.startsWith("fil")) {
    return [...common, "Santos:10", "Reyes:10", "Cruz:10", "Bautista:8"];
  }
  if (lang.startsWith("hi")) {
    return [...common, "Patel:10", "Singh:10", "Kumar:10", "Sharma:8"];
  }
  if (lang.startsWith("uk")) {
    return [...common, "Kovalenko:10", "Shevchenko:10", "Melnyk:8"];
  }
  if (lang.startsWith("es")) {
    return [...common, "Garcia:10", "Rodriguez:10", "Martinez:8", "Lopez:8"];
  }

  return common;
}

export function deepgramListenQueryParams(language: string): URLSearchParams {
  const params = new URLSearchParams({
    model: "nova-3",
    language: language.trim() || "en-US",
    smart_format: "true",
    punctuate: "true",
  });

  params.append("redact", "pii");
  params.append("redact", "numbers");

  for (const kw of sttKeywordsForLanguage(language)) {
    params.append("keywords", kw);
  }

  return params;
}
