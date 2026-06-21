export type UiLocale = "en" | "es" | "fr" | "zh" | "vi" | "ko" | "pt" | "ar" | "hi" | "tl" | "uk";

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
  | "landing.scroll"
  | "landing.langHint"
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
  | "connection.restored"
  | "connection.stillDown"
  | "tts.speed"
  | "tts.speedNormal"
  | "tts.speed2x"
  | "tts.speed4x"
  | "docs.loading"
  | "docs.disclaimer"
  | "docs.empty"
  | "docs.error"
  | "workspace.startOver"
  | "workspace.yourDocument"
  | "workspace.translating"
  | "privacy.title"
  | "privacy.notice"
  | "privacy.sendBlockedTitle"
  | "privacy.detectedByType"
  | "privacy.spansFound"
  | "privacy.recallScore"
  | "privacy.observability"
  | "privacy.scrubbedPreview"
  | "privacy.tapTokenHint"
  | "privacy.fullScreenEdit"
  | "privacy.sendForTranslation"
  | "privacy.sendBlockedBtn"
  | "privacy.showPayload"
  | "privacy.hidePayload"
  | "privacy.claudePayload"
  | "privacy.markMissedOptional"
  | "privacy.translatingNotice"
  | "privacy.noticeCanSend"
  | "privacy.noticeFixGaps"
  | "privacy.tokenMap"
  | "privacy.keys"
  | "manual.markAdditional"
  | "manual.notice"
  | "manual.redactPrefix"
  | "manual.redactSuffix"
  | "manual.manualMarks"
  | "manual.remove"
  | "manual.reanalyzing"
  | "manual.reanalyzeWithMarks"
  | "manual.sourceAriaLabel"
  | "manual.selectToolbarAria"
  | "manual.matchPrompt"
  | "manual.redactThisOnly"
  | "manual.redactAllOccurrences"
  | "edit.title"
  | "edit.notice"
  | "edit.originalLabel"
  | "edit.placeholder"
  | "edit.cancel"
  | "edit.reanalyzing"
  | "edit.reanalyze"
  | "edit.manualRedactions"
  | "edit.redactAs"
  | "edit.selectToolbarAria"
  | "loading.scanning.title"
  | "loading.scanning.subtitle"
  | "loading.translating.title"
  | "loading.translating.subtitle"
  | "pii.NAME"
  | "pii.A_NUMBER"
  | "pii.SSN"
  | "pii.PASSPORT"
  | "pii.ADDRESS"
  | "pii.DOB"
  | "upload.unsupported"
  | "upload.readFailed"
  | "upload.extractFailed"
  | "upload.serverNotice"
  | "input.demoOnlyTitle"
  | "voice.completeFirst"
  | "voice.micDisclaimerTitle"
  | "voice.micDisclaimerBody"
  | "voice.askAboutLetter"
  | "voice.connecting"
  | "voice.listening"
  | "voice.speakOrType"
  | "voice.startMic"
  | "voice.stopMic"
  | "voice.sendQuestion"
  | "voice.asking"
  | "voice.transcriptLabel"
  | "voice.transcriptLocal"
  | "voice.transcriptPlaceholder"
  | "voice.scrubbedQuestion"
  | "voice.processingTitle"
  | "voice.processingSubtitle"
  | "voice.whatItSays"
  | "voice.whatItMeans"
  | "voice.readBackPlaceholder"
  | "voice.listenToAnswer"
  | "voice.typeQuestionFirst"
  | "voice.autoListen"
  | "voice.autoListenHint"
  | "tts.listenExplanation"
  | "tts.loadingAudio"
  | "tts.playing"
  | "tts.englishVoiceFallback"
  | "tts.nativeVoiceNote"
  | "tts.payloadSummary"
  | "tts.noExplanation";

import { WORKFLOW_UI } from "./workflow-ui";
import { VOICE_TTS_UI } from "./voice-tts-ui";

function over(base: Record<StringKey, string>, patch: Partial<Record<StringKey, string>>): Record<StringKey, string> {
  return { ...base, ...patch };
}

const en: Record<StringKey, string> = {
  "app.tagline": "Understand official letters without giving up your privacy.",
  "nav.newDocument": "New document",
  "phase.paste": "1 · Paste",
  "phase.privacy": "2 · Privacy review",
  "phase.translating": "3 · Translating",
  "phase.results": "4 · Related documents",
  "phase.yourDocument": "4 · Related documents",
  "phase.blocked": "4 · Blocked",
  "landing.eyebrow": "For immigrants navigating U.S. paperwork",
  "landing.title": "Understand official letters without giving up your privacy",
  "landing.body":
    "Passage detects sensitive information in your browser, replaces it with tokens, and only then sends text for translation. You review every scrubbed preview before anything leaves your device.",
  "landing.privacy": "Client-side redaction · Tokenized translation · Optional voice Q&A",
  "landing.cta": "Get started",
  "landing.scroll": "Scroll",
  "landing.langHint": "Site text and document translation both use this language.",
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
  "connection.title": "Process killed",
  "connection.body":
    "Unable to connect. The Passage server is no longer running. Restart with Launch Passage.app or npm run launch in Terminal, then retry.",
  "connection.retry": "Retry connection",
  "connection.startOver": "Start over",
  "connection.restored": "Connection restored",
  "connection.stillDown":
    "Still unable to connect — restart Passage with Launch Passage.app or npm run launch.",
  "tts.speed": "Speed",
  "tts.speedNormal": "1×",
  "tts.speed2x": "2×",
  "tts.speed4x": "4×",
  "docs.loading": "Identifying process and related document types…",
  "docs.disclaimer":
    "General information only — requirements vary by case and jurisdiction. This is not legal advice and does not tell anyone what to file.",
  "docs.empty": "Complete translation to see commonly associated document types.",
  "docs.error": "Could not load related documents. Try again later.",
  "workspace.startOver": "Start over",
  "workspace.yourDocument": "Your document",
  "workspace.translating": "Translating…",
} as Record<StringKey, string>;

const es = over(en, {
  "app.tagline": "Traducción de documentos migratorios con privacidad primero",
  "nav.newDocument": "Nuevo documento",
  "phase.paste": "1 · Pegar",
  "phase.privacy": "2 · Revisión de privacidad",
  "phase.translating": "3 · Traduciendo",
  "phase.results": "4 · Documentos relacionados",
  "phase.yourDocument": "4 · Documentos relacionados",
  "phase.blocked": "4 · Bloqueado",
  "landing.eyebrow": "Para personas que navegan trámites en EE. UU.",
  "landing.title": "Entienda cartas oficiales sin renunciar a su privacidad",
  "landing.body":
    "Passage detecta información sensible en su navegador, la reemplaza con tokens y solo entonces envía el texto para traducción. Usted revisa cada vista previa antes de que algo salga de su dispositivo.",
  "landing.privacy": "Redacción local · Traducción tokenizada · Preguntas por voz opcionales",
  "landing.cta": "Comenzar",
  "landing.scroll": "Desplazar",
  "landing.langHint": "El sitio y la traducción del documento usan este idioma.",
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
  "connection.title": "Proceso detenido",
  "connection.body":
    "No se puede conectar. El servidor de Passage ya no está en ejecución. Reinicie con Launch Passage.app o npm run launch en la terminal e intente de nuevo.",
  "connection.retry": "Reintentar conexión",
  "connection.startOver": "Empezar de nuevo",
  "connection.restored": "Conexión restablecida",
  "connection.stillDown":
    "Sigue sin conexión — reinicie Passage con Launch Passage.app o npm run launch.",
  "tts.speed": "Velocidad",
  "docs.loading": "Identificando trámite y tipos de documentos relacionados…",
  "docs.disclaimer":
    "Información general — los requisitos varían según el caso. No es asesoría legal ni indica qué debe presentar alguien.",
  "docs.empty": "Complete la traducción para ver tipos de documentos comúnmente asociados.",
  "docs.error": "No se pudieron cargar los documentos relacionados.",
  "workspace.startOver": "Empezar de nuevo",
  "workspace.yourDocument": "Su documento",
  "workspace.translating": "Traduciendo…",
});

const fr = over(en, {
  "app.tagline": "Traduction de documents d'immigration axée sur la confidentialité",
  "nav.newDocument": "Nouveau document",
  "phase.paste": "1 · Coller",
  "phase.privacy": "2 · Revue confidentialité",
  "phase.translating": "3 · Traduction",
  "phase.results": "4 · Documents associés",
  "phase.yourDocument": "4 · Documents associés",
  "phase.blocked": "4 · Bloqué",
  "landing.eyebrow": "Pour naviguer les démarches aux États-Unis",
  "landing.title": "Comprendre les lettres officielles sans sacrifier sa vie privée",
  "landing.body":
    "Passage détecte les informations sensibles dans le navigateur, les remplace par des jetons, puis envoie le texte pour traduction. Chaque aperçu nettoyé est revu avant tout envoi.",
  "landing.privacy": "Caviardage local · Traduction tokenisée · Q&R vocale optionnelle",
  "landing.cta": "Commencer",
  "landing.scroll": "Défiler",
  "landing.langHint": "Le site et la traduction du document utilisent cette langue.",
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
  "connection.title": "Processus arrêté",
  "connection.body":
    "Connexion impossible. Le serveur Passage n'est plus en cours d'exécution. Relancez avec Launch Passage.app ou npm run launch dans le terminal, puis réessayez.",
  "connection.retry": "Réessayer",
  "connection.startOver": "Recommencer",
  "connection.restored": "Connexion rétablie",
  "connection.stillDown":
    "Toujours impossible de se connecter — relancez Passage avec Launch Passage.app ou npm run launch.",
  "tts.speed": "Vitesse",
  "docs.loading": "Identification du processus et des documents associés…",
  "docs.disclaimer":
    "Information générale — les exigences varient selon le dossier. Ce n'est pas un conseil juridique.",
  "docs.empty": "Terminez la traduction pour voir les types de documents associés.",
  "docs.error": "Impossible de charger les documents associés.",
  "workspace.startOver": "Recommencer",
  "workspace.yourDocument": "Votre document",
  "workspace.translating": "Traduction…",
});

const zh = over(en, {
  "app.tagline": "在保护隐私的前提下理解官方信函",
  "nav.newDocument": "新文档",
  "phase.paste": "1 · 粘贴",
  "phase.privacy": "2 · 隐私审查",
  "phase.translating": "3 · 翻译中",
  "phase.results": "4 · 相关文件",
  "phase.yourDocument": "4 · 相关文件",
  "phase.blocked": "4 · 已阻止",
  "landing.eyebrow": "为在美国办理手续的人",
  "landing.title": "在不放弃隐私的情况下理解官方信函",
  "landing.body":
    "Passage 在浏览器中检测敏感信息，用标记替换后再发送翻译。任何内容离开设备前，您都会审查脱敏预览。",
  "landing.privacy": "本地脱敏 · 标记化翻译 · 可选语音问答",
  "landing.cta": "开始",
  "landing.scroll": "向下滚动",
  "landing.langHint": "网站文字与文档翻译均使用此语言。",
  "input.title": "添加文档内容",
  "input.notice": "PII 检测在浏览器中运行。在您审查脱敏预览并发送翻译之前，不会发送任何内容。",
  "input.translateTo": "翻译为",
  "input.orPaste": "或粘贴文本",
  "input.placeholder": "在此粘贴文档文本…",
  "input.analyze": "分析并脱敏",
  "input.analyzing": "分析中…",
  "input.samples": "或试用测试文档：",
  "upload.title": "上传文档",
  "upload.hint": "拖放或点击 — .txt（私密）、.pdf 或图片",
  "upload.processing": "正在处理文件…",
  "upload.ack": "我理解 — 继续使用服务器端提取",
  "upload.proceed": "上传",
  "upload.cancel": "取消",
  "tab.translation": "翻译",
  "tab.privacy": "隐私",
  "tab.voice": "语音问答",
  "tab.documents": "相关文件",
  "connection.title": "进程已终止",
  "connection.body":
    "无法连接。Passage 服务器已停止运行。请通过 Launch Passage.app 或在终端运行 npm run launch 重新启动，然后重试。",
  "connection.retry": "重试连接",
  "connection.startOver": "重新开始",
  "connection.restored": "连接已恢复",
  "connection.stillDown": "仍无法连接 — 请用 Launch Passage.app 或 npm run launch 重新启动 Passage。",
  "tts.speed": "速度",
  "docs.loading": "正在识别流程和相关文件类型…",
  "docs.disclaimer": "仅供参考 — 要求因个案而异。这不是法律建议。",
  "docs.empty": "完成翻译后可查看常见相关文件类型。",
  "docs.error": "无法加载相关文件。",
  "workspace.startOver": "重新开始",
  "workspace.yourDocument": "您的文档",
  "workspace.translating": "翻译中…",
});

const vi = over(en, {
  "app.tagline": "Hiểu thư chính thức mà không đánh đổi quyền riêng tư",
  "nav.newDocument": "Tài liệu mới",
  "phase.paste": "1 · Dán",
  "phase.privacy": "2 · Xem xét quyền riêng tư",
  "phase.translating": "3 · Đang dịch",
  "phase.results": "4 · Tài liệu liên quan",
  "phase.yourDocument": "4 · Tài liệu liên quan",
  "phase.blocked": "4 · Bị chặn",
  "landing.eyebrow": "Cho người làm thủ tục tại Hoa Kỳ",
  "landing.title": "Hiểu thư chính thức mà không đánh đổi quyền riêng tư",
  "landing.body":
    "Passage phát hiện thông tin nhạy cảm trong trình duyệt, thay bằng mã, rồi mới gửi dịch. Bạn xem xét bản xem trước đã che trước khi gửi đi.",
  "landing.privacy": "Che dữ liệu cục bộ · Dịch bằng mã · Hỏi đáp giọng nói tùy chọn",
  "landing.cta": "Bắt đầu",
  "landing.scroll": "Cuộn",
  "landing.langHint": "Văn bản trang web và bản dịch đều dùng ngôn ngữ này.",
  "input.title": "Thêm phần tài liệu",
  "input.notice": "Phát hiện PII chạy trong trình duyệt. Không gửi gì cho đến khi bạn xem xét bản xem trước.",
  "input.translateTo": "Dịch sang",
  "input.orPaste": "hoặc dán văn bản",
  "input.placeholder": "Dán văn bản tài liệu tại đây…",
  "input.analyze": "Phân tích và che",
  "input.analyzing": "Đang phân tích…",
  "input.samples": "Hoặc thử tài liệu mẫu:",
  "upload.title": "Tải lên tài liệu",
  "upload.hint": "Kéo thả hoặc nhấp — .txt (riêng tư), .pdf hoặc ảnh",
  "upload.processing": "Đang xử lý tệp…",
  "upload.ack": "Tôi hiểu — tiếp tục trích xuất phía máy chủ",
  "upload.proceed": "Tải lên",
  "upload.cancel": "Hủy",
  "tab.translation": "Bản dịch",
  "tab.privacy": "Quyền riêng tư",
  "tab.voice": "Hỏi đáp giọng nói",
  "tab.documents": "Tài liệu liên quan",
  "connection.title": "Tiến trình đã dừng",
  "connection.body":
    "Không thể kết nối. Máy chủ Passage không còn chạy. Khởi động lại bằng Launch Passage.app hoặc npm run launch trong terminal, rồi thử lại.",
  "connection.retry": "Thử lại",
  "connection.startOver": "Bắt đầu lại",
  "connection.restored": "Đã kết nối lại",
  "connection.stillDown": "Vẫn không kết nối được — khởi động lại Passage bằng Launch Passage.app hoặc npm run launch.",
  "tts.speed": "Tốc độ",
  "docs.loading": "Đang xác định quy trình và loại tài liệu liên quan…",
  "docs.disclaimer": "Thông tin chung — yêu cầu khác nhau theo từng hồ sơ. Không phải tư vấn pháp lý.",
  "docs.empty": "Hoàn tất bản dịch để xem các loại tài liệu liên quan.",
  "docs.error": "Không thể tải tài liệu liên quan.",
  "workspace.startOver": "Bắt đầu lại",
  "workspace.yourDocument": "Tài liệu của bạn",
  "workspace.translating": "Đang dịch…",
});

const ko = over(en, {
  "app.tagline": "개인정보를 포기하지 않고 공문을 이해하세요",
  "nav.newDocument": "새 문서",
  "phase.paste": "1 · 붙여넣기",
  "phase.privacy": "2 · 개인정보 검토",
  "phase.translating": "3 · 번역 중",
  "phase.results": "4 · 관련 서류",
  "phase.yourDocument": "4 · 관련 서류",
  "phase.blocked": "4 · 차단됨",
  "landing.eyebrow": "미국 서류를 진행하는 분을 위해",
  "landing.title": "개인정보를 포기하지 않고 공문을 이해하세요",
  "landing.body":
    "Passage는 브라우저에서 민감 정보를 감지하고 토큰으로 바꾼 뒤 번역을 보냅니다. 기기 밖으로 나가기 전에 편집된 미리보기를 검토합니다.",
  "landing.privacy": "로컬 편집 · 토큰화 번역 · 선택적 음성 Q&A",
  "landing.cta": "시작하기",
  "landing.scroll": "스크롤",
  "landing.langHint": "사이트 텍스트와 문서 번역 모두 이 언어를 사용합니다.",
  "input.title": "문서 내용 추가",
  "input.notice": "PII 감지는 브라우저에서 실행됩니다. 편집된 미리보기를 검토하기 전까지는 아무것도 전송되지 않습니다.",
  "input.translateTo": "번역 언어",
  "input.orPaste": "또는 텍스트 붙여넣기",
  "input.placeholder": "문서 텍스트를 여기에 붙여넣으세요…",
  "input.analyze": "분석 및 편집",
  "input.analyzing": "분석 중…",
  "input.samples": "또는 샘플 문서 사용:",
  "upload.title": "문서 업로드",
  "upload.hint": "끌어다 놓거나 클릭 — .txt(비공개), .pdf 또는 이미지",
  "upload.processing": "파일 처리 중…",
  "upload.ack": "이해했습니다 — 서버 추출 진행",
  "upload.proceed": "업로드",
  "upload.cancel": "취소",
  "tab.translation": "번역",
  "tab.privacy": "개인정보",
  "tab.voice": "음성 Q&A",
  "tab.documents": "관련 서류",
  "connection.title": "프로세스 종료됨",
  "connection.body":
    "연결할 수 없습니다. Passage 서버가 더 이상 실행 중이 아닙니다. Launch Passage.app 또는 터미널에서 npm run launch로 다시 시작한 후 재시도하세요.",
  "connection.retry": "다시 연결",
  "connection.startOver": "처음부터",
  "connection.restored": "연결이 복구되었습니다",
  "connection.stillDown": "여전히 연결할 수 없습니다 — Launch Passage.app 또는 npm run launch로 Passage를 다시 시작하세요.",
  "tts.speed": "속도",
  "docs.loading": "절차 및 관련 서류 유형 확인 중…",
  "docs.disclaimer": "일반 정보 — 요건은 사례마다 다릅니다. 법률 자문이 아닙니다.",
  "docs.empty": "번역을 완료하면 관련 서류 유형을 볼 수 있습니다.",
  "docs.error": "관련 서류를 불러올 수 없습니다.",
  "workspace.startOver": "처음부터",
  "workspace.yourDocument": "내 문서",
  "workspace.translating": "번역 중…",
});

const pt = over(en, {
  "app.tagline": "Entenda cartas oficiais sem abrir mão da privacidade",
  "nav.newDocument": "Novo documento",
  "phase.paste": "1 · Colar",
  "phase.privacy": "2 · Revisão de privacidade",
  "phase.translating": "3 · Traduzindo",
  "phase.results": "4 · Documentos relacionados",
  "phase.yourDocument": "4 · Documentos relacionados",
  "phase.blocked": "4 · Bloqueado",
  "landing.eyebrow": "Para quem navega processos nos EUA",
  "landing.title": "Entenda cartas oficiais sem abrir mão da privacidade",
  "landing.body":
    "O Passage detecta informações sensíveis no navegador, substitui por tokens e só então envia para tradução. Você revisa cada prévia antes de sair do dispositivo.",
  "landing.privacy": "Redação local · Tradução tokenizada · Perguntas por voz opcionais",
  "landing.cta": "Começar",
  "landing.scroll": "Rolar",
  "landing.langHint": "O site e a tradução do documento usam este idioma.",
  "input.title": "Adicionar seção do documento",
  "input.notice": "A detecção de PII roda no navegador. Nada é enviado até você revisar a prévia.",
  "input.translateTo": "Traduzir para",
  "input.orPaste": "ou cole o texto",
  "input.placeholder": "Cole o texto do documento aqui…",
  "input.analyze": "Analisar e redigir",
  "input.analyzing": "Analisando…",
  "input.samples": "Ou experimente um documento de teste:",
  "upload.title": "Enviar documento",
  "upload.hint": "Arraste ou clique — .txt (privado), .pdf ou imagem",
  "upload.processing": "Processando arquivo…",
  "upload.ack": "Entendo — continuar com extração no servidor",
  "upload.proceed": "Enviar",
  "upload.cancel": "Cancelar",
  "tab.translation": "Tradução",
  "tab.privacy": "Privacidade",
  "tab.voice": "Perguntas por voz",
  "tab.documents": "Documentos relacionados",
  "connection.title": "Processo encerrado",
  "connection.body":
    "Não foi possível conectar. O servidor Passage não está mais em execução. Reinicie com Launch Passage.app ou npm run launch no terminal e tente novamente.",
  "connection.retry": "Tentar novamente",
  "connection.startOver": "Recomeçar",
  "connection.restored": "Conexão restabelecida",
  "connection.stillDown": "Ainda sem conexão — reinicie o Passage com Launch Passage.app ou npm run launch.",
  "tts.speed": "Velocidade",
  "docs.loading": "Identificando processo e tipos de documentos relacionados…",
  "docs.disclaimer": "Informação geral — requisitos variam por caso. Não é aconselhamento jurídico.",
  "docs.empty": "Conclua a tradução para ver tipos de documentos associados.",
  "docs.error": "Não foi possível carregar documentos relacionados.",
  "workspace.startOver": "Recomeçar",
  "workspace.yourDocument": "Seu documento",
  "workspace.translating": "Traduzindo…",
});

const ar = over(en, {
  "app.tagline": "افهم الرسائل الرسمية دون التخلي عن خصوصيتك",
  "nav.newDocument": "مستند جديد",
  "phase.paste": "1 · لصق",
  "phase.privacy": "2 · مراجعة الخصوصية",
  "phase.translating": "3 · ترجمة",
  "phase.results": "4 · مستندات ذات صلة",
  "phase.yourDocument": "4 · مستندات ذات صلة",
  "phase.blocked": "4 · محظور",
  "landing.eyebrow": "لمن يتعامل مع إجراءات الهجرة في أمريكا",
  "landing.title": "افهم الرسائل الرسمية دون التخلي عن خصوصيتك",
  "landing.body":
    "يكتشف Passage المعلومات الحساسة في المتصفح ويستبدلها برموز ثم يرسل للترجمة. تراجع المعاينة قبل مغادرة جهازك.",
  "landing.privacy": "تعديل محلي · ترجمة برموز · أسئلة صوتية اختيارية",
  "landing.cta": "ابدأ",
  "landing.scroll": "مرّر",
  "landing.langHint": "نص الموقع وترجمة المستند يستخدمان هذه اللغة.",
  "input.title": "إضافة قسم من المستند",
  "input.notice": "اكتشاف PII يعمل في المتصفح. لا يُرسل شيء حتى تراجع المعاينة.",
  "input.translateTo": "الترجمة إلى",
  "input.orPaste": "أو الصق النص",
  "input.placeholder": "الصق نص المستند هنا…",
  "input.analyze": "تحليل وتعديل",
  "input.analyzing": "جارٍ التحليل…",
  "input.samples": "أو جرّب مستندًا تجريبيًا:",
  "upload.title": "رفع مستند",
  "upload.hint": "اسحب أو انقر — .txt (خاص) أو .pdf أو صورة",
  "upload.processing": "جارٍ معالجة الملف…",
  "upload.ack": "أفهم — المتابعة بالاستخراج على الخادم",
  "upload.proceed": "رفع",
  "upload.cancel": "إلغاء",
  "tab.translation": "الترجمة",
  "tab.privacy": "الخصوصية",
  "tab.voice": "أسئلة صوتية",
  "tab.documents": "مستندات ذات صلة",
  "connection.title": "تم إيقاف العملية",
  "connection.body":
    "تعذّر الاتصال. خادم Passage لم يعد يعمل. أعد التشغيل عبر Launch Passage.app أو npm run launch في الطرفية، ثم أعد المحاولة.",
  "connection.retry": "إعادة المحاولة",
  "connection.startOver": "البدء من جديد",
  "connection.restored": "تم استعادة الاتصال",
  "connection.stillDown": "لا يزال الاتصال مستحيلاً — أعد تشغيل Passage عبر Launch Passage.app أو npm run launch.",
  "tts.speed": "السرعة",
  "docs.loading": "جارٍ تحديد الإجراء وأنواع المستندات ذات الصلة…",
  "docs.disclaimer": "معلومات عامة — المتطلبات تختلف. ليست استشارة قانونية.",
  "docs.empty": "أكمل الترجمة لرؤية أنواع المستندات المرتبطة.",
  "docs.error": "تعذّر تحميل المستندات ذات الصلة.",
  "workspace.startOver": "البدء من جديد",
  "workspace.yourDocument": "مستندك",
  "workspace.translating": "جارٍ الترجمة…",
});

const hi = over(en, {
  "app.tagline": "अपनी गोपनीयता छोड़े बिना आधिकारिक पत्र समझें",
  "nav.newDocument": "नया दस्तावेज़",
  "phase.paste": "1 · पेस्ट",
  "phase.privacy": "2 · गोपनीयता समीक्षा",
  "phase.translating": "3 · अनुवाद",
  "phase.results": "4 · संबंधित दस्तावेज़",
  "phase.yourDocument": "4 · संबंधित दस्तावेज़",
  "phase.blocked": "4 · अवरुद्ध",
  "landing.eyebrow": "अमेरिका में प्रक्रिया करने वालों के लिए",
  "landing.title": "अपनी गोपनीयता छोड़े बिना आधिकारिक पत्र समझें",
  "landing.body":
    "Passage ब्राउज़र में संवेदनशील जानकारी पहचानता है, टोकन से बदलता है, फिर अनुवाद भेजता है। भेजने से पहले आप संपादित पूर्वावलोकन देखते हैं।",
  "landing.privacy": "स्थानीय संपादन · टोकनयुक्त अनुवाद · वैकल्पिक आवाज़ Q&A",
  "landing.cta": "शुरू करें",
  "landing.scroll": "स्क्रॉल",
  "landing.langHint": "साइट पाठ और दस्तावेज़ अनुवाद दोनों इस भाषा का उपयोग करते हैं।",
  "input.title": "दस्तावेज़ अनुभाग जोड़ें",
  "input.notice": "PII पहचान ब्राउज़र में चलती है। समीक्षा से पहले कुछ नहीं भेजा जाता।",
  "input.translateTo": "अनुवाद भाषा",
  "input.orPaste": "या पाठ पेस्ट करें",
  "input.placeholder": "दस्तावेज़ पाठ यहाँ पेस्ट करें…",
  "input.analyze": "विश्लेषण और संपादन",
  "input.analyzing": "विश्लेषण…",
  "input.samples": "या एक परीक्षण दस्तावेज़ आज़माएँ:",
  "upload.title": "दस्तावेज़ अपलोड",
  "upload.hint": "खींचें या क्लिक — .txt (निजी), .pdf या छवि",
  "upload.processing": "फ़ाइल संसाधित…",
  "upload.ack": "मैं समझता/समझती हूँ — सर्वर निष्कर्षण जारी",
  "upload.proceed": "अपलोड",
  "upload.cancel": "रद्द",
  "tab.translation": "अनुवाद",
  "tab.privacy": "गोपनीयता",
  "tab.voice": "आवाज़ Q&A",
  "tab.documents": "संबंधित दस्तावेज़",
  "connection.title": "प्रक्रिया बंद हो गई",
  "connection.body":
    "कनेक्ट नहीं हो सका। Passage सर्वर अब नहीं चल रहा। Launch Passage.app या टर्मिनल में npm run launch से पुनः प्रारंभ करें, फिर पुनः प्रयास करें।",
  "connection.retry": "पुनः प्रयास",
  "connection.startOver": "फिर से शुरू",
  "connection.restored": "कनेक्शन बहाल",
  "connection.stillDown": "अभी भी कनेक्ट नहीं — Launch Passage.app या npm run launch से Passage पुनः प्रारंभ करें।",
  "tts.speed": "गति",
  "docs.loading": "प्रक्रिया और संबंधित दस्तावेज़ पहचान…",
  "docs.disclaimer": "सामान्य जानकारी — आवश्यकताएँ भिन्न होती हैं। कानूनी सलाह नहीं।",
  "docs.empty": "संबंधित दस्तावेज़ देखने के लिए अनुवाद पूरा करें।",
  "docs.error": "संबंधित दस्तावेज़ लोड नहीं हो सके।",
  "workspace.startOver": "फिर से शुरू",
  "workspace.yourDocument": "आपका दस्तावेज़",
  "workspace.translating": "अनुवाद हो रहा है…",
});

const tl = over(en, {
  "app.tagline": "Unawain ang opisyal na liham nang hindi isinasakripisyo ang privacy",
  "nav.newDocument": "Bagong dokumento",
  "phase.paste": "1 · I-paste",
  "phase.privacy": "2 · Privacy review",
  "phase.translating": "3 · Nagsasalin",
  "phase.results": "4 · Kaugnay na dokumento",
  "phase.yourDocument": "4 · Kaugnay na dokumento",
  "phase.blocked": "4 · Na-block",
  "landing.eyebrow": "Para sa mga nag-aasikaso ng papeles sa U.S.",
  "landing.title": "Unawain ang opisyal na liham nang hindi isinasakripisyo ang privacy",
  "landing.body":
    "Tinutukoy ng Passage ang sensitibong impormasyon sa browser, pinalitan ng mga token, bago isalin. Sinusuri mo ang preview bago lumabas sa device.",
  "landing.privacy": "Local redaction · Tokenized translation · Opsyonal na voice Q&A",
  "landing.cta": "Magsimula",
  "landing.scroll": "Mag-scroll",
  "landing.langHint": "Ang site at salin ng dokumento ay gumagamit ng wikang ito.",
  "input.title": "Magdagdag ng seksyon ng dokumento",
  "input.notice": "Ang PII detection ay tumatakbo sa browser. Walang ipinapadala hanggang sa review.",
  "input.translateTo": "Isalin sa",
  "input.orPaste": "o i-paste ang teksto",
  "input.placeholder": "I-paste ang teksto ng dokumento dito…",
  "input.analyze": "Suriin at i-redact",
  "input.analyzing": "Sinusuri…",
  "input.samples": "O subukan ang test document:",
  "upload.title": "Mag-upload ng dokumento",
  "upload.hint": "I-drag o i-click — .txt (pribado), .pdf o larawan",
  "upload.processing": "Pinoproseso ang file…",
  "upload.ack": "Naiintindihan ko — magpatuloy sa server extraction",
  "upload.proceed": "I-upload",
  "upload.cancel": "Kanselahin",
  "tab.translation": "Salin",
  "tab.privacy": "Privacy",
  "tab.voice": "Voice Q&A",
  "tab.documents": "Kaugnay na dokumento",
  "connection.title": "Huminto ang proseso",
  "connection.body":
    "Hindi makakonekta. Hindi na tumatakbo ang Passage server. I-restart gamit ang Launch Passage.app o npm run launch sa terminal, pagkatapos subukang muli.",
  "connection.retry": "Subukang muli",
  "connection.startOver": "Magsimulang muli",
  "connection.restored": "Naibalik ang koneksyon",
  "connection.stillDown": "Hindi pa rin makakonekta — i-restart ang Passage gamit ang Launch Passage.app o npm run launch.",
  "tts.speed": "Bilis",
  "docs.loading": "Tinutukoy ang proseso at kaugnay na dokumento…",
  "docs.disclaimer": "Pangkalahatang impormasyon — nag-iiba ang requirements. Hindi legal advice.",
  "docs.empty": "Kumpletuhin ang salin para makita ang kaugnay na dokumento.",
  "docs.error": "Hindi ma-load ang kaugnay na dokumento.",
  "workspace.startOver": "Magsimulang muli",
  "workspace.yourDocument": "Iyong dokumento",
  "workspace.translating": "Nagsasalin…",
});

const uk = over(en, {
  "app.tagline": "Розумійте офіційні листи, не жертвуючи конфіденційністю",
  "nav.newDocument": "Новий документ",
  "phase.paste": "1 · Вставити",
  "phase.privacy": "2 · Перевірка конфіденційності",
  "phase.translating": "3 · Переклад",
  "phase.results": "4 · Пов’язані документи",
  "phase.yourDocument": "4 · Пов’язані документи",
  "phase.blocked": "4 · Заблоковано",
  "landing.eyebrow": "Для тих, хто проходить процедури в США",
  "landing.title": "Розумійте офіційні листи, не жертвуючи конфіденційністю",
  "landing.body":
    "Passage виявляє чутливу інформацію в браузері, замінює токенами і лише потім надсилає на переклад. Ви переглядаєте попередній перегляд перед відправкою.",
  "landing.privacy": "Локальне редагування · Токенізований переклад · Голосові Q&A",
  "landing.cta": "Почати",
  "landing.scroll": "Прокрутити",
  "landing.langHint": "Текст сайту та переклад документа використовують цю мову.",
  "input.title": "Додати розділ документа",
  "input.notice": "Виявлення PII працює в браузері. Нічого не надсилається до перегляду.",
  "input.translateTo": "Перекласти на",
  "input.orPaste": "або вставте текст",
  "input.placeholder": "Вставте текст документа тут…",
  "input.analyze": "Аналіз і редагування",
  "input.analyzing": "Аналіз…",
  "input.samples": "Або спробуйте тестовий документ:",
  "upload.title": "Завантажити документ",
  "upload.hint": "Перетягніть або клікніть — .txt (приватно), .pdf або зображення",
  "upload.processing": "Обробка файлу…",
  "upload.ack": "Розумію — продовжити з серверним витягом",
  "upload.proceed": "Завантажити",
  "upload.cancel": "Скасувати",
  "tab.translation": "Переклад",
  "tab.privacy": "Конфіденційність",
  "tab.voice": "Голосові Q&A",
  "tab.documents": "Пов’язані документи",
  "connection.title": "Процес зупинено",
  "connection.body":
    "Неможливо підключитися. Сервер Passage більше не працює. Перезапустіть через Launch Passage.app або npm run launch у терміналі, потім повторіть спробу.",
  "connection.retry": "Повторити",
  "connection.startOver": "Почати спочатку",
  "connection.restored": "З’єднання відновлено",
  "connection.stillDown": "Досі немає з’єднання — перезапустіть Passage через Launch Passage.app або npm run launch.",
  "tts.speed": "Швидкість",
  "docs.loading": "Визначення процесу та пов’язаних документів…",
  "docs.disclaimer": "Загальна інформація — вимоги різняться. Це не юридична порада.",
  "docs.empty": "Завершіть переклад, щоб побачити пов’язані типи документів.",
  "docs.error": "Не вдалося завантажити пов’язані документи.",
  "workspace.startOver": "Почати спочатку",
  "workspace.yourDocument": "Ваш документ",
  "workspace.translating": "Переклад…",
});

const TABLE: Record<UiLocale, Record<StringKey, string>> = {
  en,
  es,
  fr,
  zh,
  vi,
  ko,
  pt,
  ar,
  hi,
  tl,
  uk,
};

for (const locale of Object.keys(TABLE) as UiLocale[]) {
  Object.assign(TABLE[locale], WORKFLOW_UI[locale] ?? {});
  Object.assign(TABLE[locale], VOICE_TTS_UI[locale] ?? {});
}

export function uiLocaleFromLangCode(langCode: string): UiLocale {
  if (langCode in TABLE) return langCode as UiLocale;
  return "en";
}

export function t(locale: UiLocale, key: StringKey): string {
  return TABLE[locale][key] ?? TABLE.en[key] ?? key;
}

export function tf(locale: UiLocale, key: StringKey, vars: Record<string, string>): string {
  let text = t(locale, key);
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, value);
  }
  return text;
}

export function piiLabel(locale: UiLocale, type: string): string {
  const key = `pii.${type}` as StringKey;
  return t(locale, key);
}
