/** USCIS / EOIR terms — injected into Claude system prompts for consistent translation. */
export const IMMIGRATION_GLOSSARY = `
Immigration terminology (preserve precise meaning; do not paraphrase into legal advice):
- NTA (Notice to Appear): charging document requiring appearance before an immigration judge
- I-589: Application for Asylum and for Withholding of Removal
- I-765: Application for Employment Authorization
- I-131: Application for Travel Document
- Biometrics / ASC: fingerprint and photo appointment at an Application Support Center
- A-number / Alien Registration Number: unique USCIS case identifier (shown as tokens in input)
- EOIR: Executive Office for Immigration Review (immigration courts)
- RFE: Request for Evidence — USCIS asking for additional documents
- NOID: Notice of Intent to Deny
- USCIS: U.S. Citizenship and Immigration Services
- ICE: U.S. Immigration and Customs Enforcement
- CBP: U.S. Customs and Border Protection
- Master Calendar hearing: initial immigration court scheduling appearance
- Individual hearing: merits hearing on the asylum or removal case
- Voluntary departure / removal order: distinct outcomes with different deadlines
`.trim();
