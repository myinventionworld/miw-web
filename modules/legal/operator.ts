/**
 * The facts the terms of use stand on.
 *
 * As of 2026-10-30 there is no registered company behind the site, so there is
 * no legal name, company ID or registered address to give, and a made-up one on
 * a legal page is worse than none. A `null` here leaves its row out of "Who
 * runs this site" (`legal-page.tsx`): the team is named as MIW
 * Labs in Prague, and the governing-law row and section only appear once
 * `governingLaw` is set. Fill these in when the company exists.
 */
export const OPERATOR: {
  /** As written in the commercial or trade register. */
  legalName: string | null;
  /** IČO, the Czech company ID. */
  companyId: string | null;
  /** Registered address, one line. */
  address: string | null;
  /** ISO 3166 country code whose law governs the terms, e.g. "CZ". Shown as
   *  the country's name in the reader's language. */
  governingLaw: string | null;
} = {
  legalName: null,
  companyId: null,
  address: null,
  governingLaw: null,
};

/** When the current text of the terms took effect. Change it with the text. */
export const LEGAL_UPDATED = "2026-10-30";
