import type { PiiType } from "../lib/types";

export interface SyntheticDoc {
  id: string;
  title: string;
  text: string;
  /** Hand-labeled spans for recall checks (Phase 5) and Phase 1 eyeball tests. */
  labeledSpans: Array<{ type: PiiType; value: string }>;
  /** Deterministic validation failure for Sentry demo — server strips final token. */
  plantedValidationFailure?: boolean;
  /** Address format our heuristic misses — triggers pre-send leakage block. */
  plantedDetectionFailure?: boolean;
}

export const SYNTHETIC_DOCS: SyntheticDoc[] = [
  {
    id: "rfe-standard",
    title: "RFE — standard fields",
    text: `U.S. Citizenship and Immigration Services
Request for Evidence

Date: March 15, 2024

Re: Maria Gonzalez, A-123456789
SSN: 123-45-6789
Date of Birth: 03/22/1988
Passport No.: X1234567

You must submit evidence of your current residence at 742 Evergreen Terrace, Springfield.

Please respond by April 30, 2024.`,
    labeledSpans: [
      { type: "NAME", value: "Maria Gonzalez" },
      { type: "A_NUMBER", value: "A-123456789" },
      { type: "SSN", value: "123-45-6789" },
      { type: "DOB", value: "03/22/1988" },
      { type: "PASSPORT", value: "X1234567" },
      { type: "ADDRESS", value: "742 Evergreen Terrace" },
    ],
  },
  {
    id: "biometrics-notice",
    title: "Biometrics appointment",
    text: `Notice of Biometrics Appointment

Beneficiary: Carlos Mendez
A Number: A9876543
DOB: January 5, 1990

Report to 100 Main St on May 2, 2024.`,
    labeledSpans: [
      { type: "NAME", value: "Carlos Mendez" },
      { type: "A_NUMBER", value: "A9876543" },
      { type: "DOB", value: "January 5, 1990" },
      { type: "ADDRESS", value: "100 Main St" },
    ],
  },
  {
    id: "ead-renewal",
    title: "EAD renewal receipt",
    text: `Receipt Notice

Applicant Name: Priya Sharma
A12345678
SSN 987-65-4321
Born: 12/01/1995

Mailing address on file: 55 Oak Ave, Austin, TX.`,
    labeledSpans: [
      { type: "NAME", value: "Priya Sharma" },
      { type: "A_NUMBER", value: "A12345678" },
      { type: "SSN", value: "987-65-4321" },
      { type: "DOB", value: "12/01/1995" },
      { type: "ADDRESS", value: "55 Oak Ave" },
    ],
  },
  {
    id: "passport-document-number",
    title: "Passport document number label",
    text: `Travel Document Verification

Name: Ahmed Hassan
Document Number: AB1234567
A-87654321

Please bring the document to 200 Park Blvd.`,
    labeledSpans: [
      { type: "NAME", value: "Ahmed Hassan" },
      { type: "PASSPORT", value: "AB1234567" },
      { type: "A_NUMBER", value: "A-87654321" },
      { type: "ADDRESS", value: "200 Park Blvd" },
    ],
  },
  {
    id: "noid-hearing",
    title: "Notice of intent to deny",
    text: `Notice of Intent to Deny

Respondent: Lin Wei Zhang
Alien Registration Number: A-112233445
Date of birth: July 18, 1985

Evidence must be mailed to 890 Cedar Ln before June 1, 2024.`,
    labeledSpans: [
      { type: "NAME", value: "Lin Wei Zhang" },
      { type: "A_NUMBER", value: "A-112233445" },
      { type: "DOB", value: "July 18, 1985" },
      { type: "ADDRESS", value: "890 Cedar Ln" },
    ],
  },
  {
    id: "combo-card",
    title: "Combo card production",
    text: `Form I-765 / I-485 Combo Card

Recipient: Sofia Alvarez-Rios
A# A55667788
SSN: 111-22-3333
DOB: 09/09/1992
Passport No.: M9988776

Card will ship to 12 River Dr, Miami, FL.`,
    labeledSpans: [
      { type: "NAME", value: "Sofia Alvarez-Rios" },
      { type: "A_NUMBER", value: "A55667788" },
      { type: "SSN", value: "111-22-3333" },
      { type: "DOB", value: "09/09/1992" },
      { type: "PASSPORT", value: "M9988776" },
      { type: "ADDRESS", value: "12 River Dr" },
    ],
  },
  {
    id: "short-a-number-variants",
    title: "A-number format variants",
    text: `Case update for James Okafor.

A1234567 (7-digit)
A12345678 (8-digit)
A-123456789 (9-digit with dash)

Contact office at 400 Elm Way.`,
    labeledSpans: [
      { type: "NAME", value: "James Okafor" },
      { type: "A_NUMBER", value: "A1234567" },
      { type: "A_NUMBER", value: "A12345678" },
      { type: "A_NUMBER", value: "A-123456789" },
      { type: "ADDRESS", value: "400 Elm Way" },
    ],
  },
  {
    id: "planted-validation-failure",
    title: "⚠️ Planted — token validation failure (Sentry demo)",
    plantedValidationFailure: true,
    text: `Special Review Letter

Beneficiary: Elena Vasquez
A-44556677
SSN: 222-33-4444
DOB: February 29, 1996
Passport No.: ZZ8877665

Residence: 15 Maple Ct, Denver, CO

This letter requests additional evidence tied to the beneficiary named above.`,
    labeledSpans: [
      { type: "NAME", value: "Elena Vasquez" },
      { type: "A_NUMBER", value: "A-44556677" },
      { type: "SSN", value: "222-33-4444" },
      { type: "DOB", value: "February 29, 1996" },
      { type: "PASSPORT", value: "ZZ8877665" },
      { type: "ADDRESS", value: "15 Maple Ct" },
    ],
  },
  {
    id: "planted-detection-failure",
    title: "⚠️ Planted — missed address (leakage block)",
    plantedDetectionFailure: true,
    text: `Address Verification Request

Name: David Kim
A-99887766
SSN: 333-44-5555

Please send documents to Apt #4B, Brooklyn, NY 11201. We could not verify your residence at this location.
Please submit utility bills within 30 days.`,
    labeledSpans: [
      { type: "NAME", value: "David Kim" },
      { type: "A_NUMBER", value: "A-99887766" },
      { type: "SSN", value: "333-44-5555" },
      { type: "ADDRESS", value: "Apt #4B, Brooklyn, NY 11201" },
    ],
  },
];
