/**
 * Two audiences, two forms. A shop owner who needs a website and a founder who
 * needs an MVP answer different questions, and one form asking both of them
 * everything is a form neither finishes.
 *
 * The flag stays here rather than in the locale files: it is a command-line
 * argument, and a translated flag would be a joke that does not land.
 */
export const CONSOLE_TABS = [
  { id: "business", flag: "--small-business" },
  { id: "startup", flag: "--startup" },
] as const;

export type ConsoleTab = (typeof CONSOLE_TABS)[number]["id"];

/** What the work actually is. Drives the scope prompt in the form. */
export const ENGAGEMENTS = [
  "website",
  "eshop",
  "automation",
  "mvp",
  "ai",
  "review",
] as const;

export type EngagementId = (typeof ENGAGEMENTS)[number];

/**
 * Which engagements each console tab offers. The tab has already told us
 * roughly why the reader is here, so asking them to pick from all six again
 * would be asking the same question twice.
 */
export const TAB_ENGAGEMENTS: Record<ConsoleTab, readonly EngagementId[]> = {
  business: ["website", "eshop", "automation"],
  startup: ["mvp", "ai", "review"],
};

/**
 * The visitor's budget, asked up front. These are their answers, not our
 * prices.
 *
 * Ids rather than the labels themselves, because the label is also the value
 * that gets sent — and a message whose meaning changes depending on which
 * language the visitor read the form in is a message nobody can act on. The
 * figures stay in euros in every language for the same reason.
 */
export const BUDGETS = [
  "upto-2k",
  "2-5k",
  "5-15k",
  "15k-plus",
  "unsure",
] as const;

export const STAGES = ["small-business", "idea", "startup", "company"] as const;

/**
 * Which stages each console tab offers. The business tab has one, so the form
 * does not ask it: a shop owner who has just pressed "Small business" was being
 * asked "You are: Small business" again one row further down.
 */
export const TAB_STAGES: Record<ConsoleTab, readonly (typeof STAGES)[number][]> = {
  business: ["small-business"],
  startup: ["idea", "startup", "company"],
};

export const TIMELINES = ["now", "month", "quarter", "scoping"] as const;
