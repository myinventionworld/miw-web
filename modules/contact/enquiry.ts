import { i18nConfig, type Locale } from "@/modules/i18n";
import {
  BUDGETS,
  CONSOLE_TABS,
  ENGAGEMENTS,
  STAGES,
  TIMELINES,
} from "./options";

/**
 * One enquiry from the contact form, as both ends see it.
 *
 * The browser checks it before sending so the visitor gets the message next to
 * the button, and the server checks it again with the same function, because
 * the server action is a public endpoint and anything can post to it. The
 * choices travel as ids (`budget: "5-15k"`), never as the words on the
 * buttons, so the same answer reads the same whatever language it came from.
 *
 * The phone page asks for less than the 3D console (no tab, stage or timeline),
 * so those are optional; when present they must be one of the known ids.
 */
export interface Enquiry {
  locale: Locale;
  name: string;
  org: string;
  email: string;
  scope: string;
  budget: (typeof BUDGETS)[number];
  tab?: (typeof CONSOLE_TABS)[number]["id"];
  engagement?: (typeof ENGAGEMENTS)[number];
  stage?: (typeof STAGES)[number];
  timeline?: (typeof TIMELINES)[number];
}

/** What the form posts: the fields as typed, plus the two spam signals. */
export type EnquiryInput = Partial<Record<keyof Enquiry, string>> & {
  /** The honeypot. Hidden from people, so anything in it came from a bot. */
  website?: string;
  /** Milliseconds from the first touch of the form to Send. */
  elapsed?: number;
};

/** Which field to point at when something is wrong. */
export type EnquiryField = "name" | "org" | "email" | "scope" | "choice";

/**
 * Nobody types a name, an address and a sentence about their project in under
 * three seconds; a script that fills the form on load does.
 */
export const MIN_FILL_MS = 3000;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const oneOf = <T extends string>(list: readonly T[], v: string | undefined) =>
  v === undefined || v === "" ? undefined : list.includes(v as T) ? (v as T) : null;

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * The same rules the console has always had: a name, a company, an address
 * someone can reply to and a sentence about the task. Upper bounds keep a
 * pasted novel out of the inbox. Checked in the order the fields are read, so
 * the message points at the first thing wrong.
 */
export function checkEnquiry(
  input: EnquiryInput,
): { ok: true; value: Enquiry } | { ok: false; field: EnquiryField } {
  const name = text(input.name);
  const org = text(input.org);
  const email = text(input.email);
  const scope = text(input.scope);

  if (name.length < 2 || name.length > 120) return { ok: false, field: "name" };
  if (org.length < 2 || org.length > 160) return { ok: false, field: "org" };
  if (email.length > 254 || !EMAIL.test(email)) return { ok: false, field: "email" };
  if (scope.length < 12 || scope.length > 4000) return { ok: false, field: "scope" };

  const locale = oneOf(i18nConfig.locales, input.locale) ?? i18nConfig.defaultLocale;
  const budget = oneOf(BUDGETS, input.budget);
  const tab = oneOf(CONSOLE_TABS.map((c) => c.id), input.tab);
  const engagement = oneOf(ENGAGEMENTS, input.engagement);
  const stage = oneOf(STAGES, input.stage);
  const timeline = oneOf(TIMELINES, input.timeline);
  if (!budget || tab === null || engagement === null || stage === null || timeline === null) {
    return { ok: false, field: "choice" };
  }

  return {
    ok: true,
    value: { locale, name, org, email, scope, budget, tab, engagement, stage, timeline },
  };
}

type Translate = (key: string) => string;

/**
 * Subject and body of the message, in the language the visitor wrote in. The
 * mail-app fallback, the email and the Telegram message are all this text, so
 * whichever way an enquiry arrives it reads the same.
 */
export function composeEnquiry(e: Enquiry, t: Translate) {
  const what = e.engagement ? t(`engagements.${e.engagement}.label`) : t("form.scope");
  const subject = `MIW — ${what} — ${e.org}`;
  const lines = [
    `${t("form.name")}: ${e.name}`,
    `${t("form.company")}: ${e.org}`,
    `${t("form.email")}: ${e.email}`,
    e.engagement && `${t("form.engagement")}: ${what}`,
    e.stage && `${t("form.stage")}: ${t(`stages.${e.stage}`)}`,
    `${t("form.budget")}: ${t(`budgets.${e.budget}`)}`,
    e.timeline && `${t("form.timeline")}: ${t(`timelines.${e.timeline}`)}`,
    "",
    e.scope,
  ];
  return { subject, body: lines.filter((l) => l !== undefined).join("\n") };
}
