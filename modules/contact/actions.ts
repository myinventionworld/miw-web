"use server";

import { initTranslations } from "@/modules/i18n";
import { canDeliver, deliver } from "./delivery";
import {
  MIN_FILL_MS,
  checkEnquiry,
  composeEnquiry,
  type EnquiryField,
  type EnquiryInput,
} from "./enquiry";

export type EnquiryResult =
  /** A person on the team has it. */
  | { status: "sent" }
  /** No channel configured: the form hands the message to the mail app. */
  | { status: "unconfigured" }
  | { status: "invalid"; field: EnquiryField }
  /** Sent faster than a person can fill the form in. */
  | { status: "too-fast" }
  /** Every configured channel refused it. */
  | { status: "failed" };

/**
 * The contact form's server side, for both the 3D console and the phone page.
 * A Server Action rather than a route handler because the docs for this
 * version recommend them for forms; it is still a public endpoint, so the
 * input is checked again here and nothing the browser composed is trusted.
 */
export async function sendEnquiry(input: EnquiryInput): Promise<EnquiryResult> {
  if (!input || typeof input !== "object") return { status: "invalid", field: "name" };
  // A filled honeypot is a bot. Tell it everything went fine, so it has no
  // reason to try again with something smarter.
  if (typeof input.website === "string" && input.website.trim() !== "") {
    return { status: "sent" };
  }
  if (typeof input.elapsed !== "number" || input.elapsed < MIN_FILL_MS) {
    return { status: "too-fast" };
  }

  const checked = checkEnquiry(input);
  if (!checked.ok) return { status: "invalid", field: checked.field };
  if (!canDeliver()) return { status: "unconfigured" };

  const enquiry = checked.value;
  const { t } = await initTranslations(enquiry.locale, ["console"]);
  const { subject, body } = composeEnquiry(enquiry, (key) => t(key));

  return (await deliver({ subject, body, replyTo: enquiry.email }))
    ? { status: "sent" }
    : { status: "failed" };
}
