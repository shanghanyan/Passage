/** Matches session-scoped redaction tokens sent to Claude / stored in answers. */
const TOKEN_PATTERN = /⟦PII:([A-Z_]+):(\d+)⟧/g;

const EN_LABELS: Record<string, string> = {
  NAME: "name",
  A_NUMBER: "A number",
  DOB: "date of birth",
  SSN: "social security number",
  ADDRESS: "address",
  PASSPORT: "passport number",
  PHONE: "phone number",
  EMAIL: "email",
};

/** Short speakable type labels — same language as the answer so TTS stays one voice. */
const LABELS_BY_LANG: Record<string, Record<string, string>> = {
  en: EN_LABELS,
  es: {
    NAME: "nombre",
    A_NUMBER: "número A",
    DOB: "fecha de nacimiento",
    SSN: "número de seguro social",
    ADDRESS: "dirección",
    PASSPORT: "pasaporte",
    PHONE: "teléfono",
    EMAIL: "correo",
  },
  fr: {
    NAME: "nom",
    A_NUMBER: "numéro A",
    DOB: "date de naissance",
    SSN: "numéro de sécurité sociale",
    ADDRESS: "adresse",
    PASSPORT: "passeport",
    PHONE: "téléphone",
    EMAIL: "courriel",
  },
  zh: {
    NAME: "姓名",
    A_NUMBER: "A号码",
    DOB: "出生日期",
    SSN: "社会安全号",
    ADDRESS: "地址",
    PASSPORT: "护照",
    PHONE: "电话",
    EMAIL: "电子邮件",
  },
  vi: {
    NAME: "tên",
    A_NUMBER: "số A",
    DOB: "ngày sinh",
    SSN: "số an sinh xã hội",
    ADDRESS: "địa chỉ",
    PASSPORT: "hộ chiếu",
    PHONE: "số điện thoại",
    EMAIL: "email",
  },
  ko: {
    NAME: "이름",
    A_NUMBER: "A 번호",
    DOB: "생년월일",
    SSN: "사회보장번호",
    ADDRESS: "주소",
    PASSPORT: "여권",
    PHONE: "전화번호",
    EMAIL: "이메일",
  },
  pt: {
    NAME: "nome",
    A_NUMBER: "número A",
    DOB: "data de nascimento",
    SSN: "número de seguro social",
    ADDRESS: "endereço",
    PASSPORT: "passaporte",
    PHONE: "telefone",
    EMAIL: "email",
  },
  ar: {
    NAME: "الاسم",
    A_NUMBER: "رقم A",
    DOB: "تاريخ الميلاد",
    SSN: "رقم الضمان الاجتماعي",
    ADDRESS: "العنوان",
    PASSPORT: "جواز السفر",
    PHONE: "الهاتف",
    EMAIL: "البريد",
  },
  hi: {
    NAME: "नाम",
    A_NUMBER: "A नंबर",
    DOB: "जन्म तिथि",
    SSN: "सामाजिक सुरक्षा नंबर",
    ADDRESS: "पता",
    PASSPORT: "पासपोर्ट",
    PHONE: "फ़ोन",
    EMAIL: "ईमेल",
  },
  tl: {
    NAME: "pangalan",
    A_NUMBER: "A number",
    DOB: "petsa ng kapanganakan",
    SSN: "SSN",
    ADDRESS: "address",
    PASSPORT: "pasaporte",
    PHONE: "telepono",
    EMAIL: "email",
  },
  uk: {
    NAME: "ім'я",
    A_NUMBER: "номер A",
    DOB: "дата народження",
    SSN: "номер соціального страхування",
    ADDRESS: "адреса",
    PASSPORT: "паспорт",
    PHONE: "телефон",
    EMAIL: "електронна пошта",
  },
};

function speakLabelForType(type: string, langCode: string): string {
  const table = LABELS_BY_LANG[langCode] ?? EN_LABELS;
  return table[type] ?? EN_LABELS[type] ?? type.replace(/_/g, " ").toLowerCase();
}

/**
 * Replace ⟦PII:TYPE:n⟧ with speakable stand-ins in the answer language (no raw PII, one TTS voice).
 * Example (es): ⟦PII:NAME:1⟧ → "nombre uno"
 */
export function replaceTokensForSpeech(text: string, langCode = "en"): string {
  if (!text) return "";
  return text.replace(TOKEN_PATTERN, (_full, type: string, index: string) => {
    const label = speakLabelForType(type, langCode);
    return `${label} ${index}`;
  });
}
