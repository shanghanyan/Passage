import { ADDRESS_APT_UNIT_PATTERN } from "./patterns";

/** True when raw address-like text survived redaction (planted failure case). */
export function hasUndetectedAddressLeak(redacted: string): boolean {
  if (/\bApt\s*#\s*[A-Za-z0-9-]+\b/i.test(redacted)) {
    return true;
  }
  if (/Apt\s*#\d+[A-Z]?,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}/.test(redacted)) {
    return true;
  }
  ADDRESS_APT_UNIT_PATTERN.lastIndex = 0;
  return ADDRESS_APT_UNIT_PATTERN.test(redacted);
}
