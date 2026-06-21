import type { DetectedSpan } from "./types";

export interface AuditCase {
  id: string;
  label: string;
  text: string;
  expectNoAddress?: boolean;
  expectNames?: string[];
}

export const AUDIT_CASES: AuditCase[] = [
  {
    id: "planted-failure",
    label: "Planted failure (Apt #4B)",
    text: "Please send documents to Apt #4B, Brooklyn, NY 11201. Respondent Maria Gonzalez must comply within 30 days.",
    expectNoAddress: true,
  },
  {
    id: "hyphenated-name",
    label: "Hyphenated name",
    text: "Applicant: Jean-Pierre Dubois filed Form I-797 on 03/01/2025.",
    expectNames: ["Jean-Pierre", "Dubois"],
  },
  {
    id: "single-token",
    label: "Single-token ALL CAPS",
    text: "Beneficiary: MADHAV must submit evidence by April 1, 2025.",
    expectNames: ["MADHAV"],
  },
  {
    id: "non-western",
    label: "Non-Western name",
    text: "Name of applicant: Xiong Wei, A-number A123456789.",
    expectNames: ["Xiong", "Wei"],
  },
  {
    id: "all-caps-single",
    label: "Single-token TO: line",
    text: "TO: RAJKUMAR RE: Request for Evidence dated Jan 15, 2025.",
    expectNames: ["RAJKUMAR"],
  },
  {
    id: "overlap-name-address",
    label: "Merge overlap (NAME vs ADDRESS)",
    text: "742 Oak Street, Maria Gonzalez must appear.",
    expectNames: ["Maria Gonzalez"],
  },
];

export function evaluateAuditCase(
  merged: DetectedSpan[],
  testCase: AuditCase,
): { pass: boolean; failures: string[]; names: string[]; addresses: string[] } {
  const names = merged.filter((s) => s.type === "NAME").map((s) => s.value);
  const addresses = merged.filter((s) => s.type === "ADDRESS").map((s) => s.value);
  const nameHaystack = names.join(" ");
  const failures: string[] = [];

  if (testCase.expectNoAddress && addresses.length > 0) {
    failures.push(`Expected NO address; got: ${addresses.join(", ")}`);
  }
  if (testCase.expectNames) {
    for (const n of testCase.expectNames) {
      if (!nameHaystack.includes(n)) failures.push(`NAME miss: "${n}"`);
    }
  }

  return { pass: failures.length === 0, failures, names, addresses };
}
