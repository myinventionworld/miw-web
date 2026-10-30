/**
 * The facts the terms of use stand on.
 *
 * Who runs the site is not something the repo knows: there is no legal name,
 * company ID or registered address anywhere in it, and a made-up IČO on a legal
 * page is worse than a gap. Every `null` here is drawn on the page as a marked
 * placeholder (`Unset` in `components/editorial/legal.tsx`) until someone who
 * knows the answer fills it in.
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
