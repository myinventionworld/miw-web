"use server";

import { after } from "next/server";

import { initTranslations } from "@/modules/i18n";
import { canConfirm, canDeliver, confirm, deliver } from "./delivery";
import {
  MIN_FILL_MS,
  checkEnquiry,
  composeEnquiry,
  type EnquiryField,
  type EnquiryInput,
} from "./enquiry";
import { allow, clientIp, isHuman } from "./guard";

export type EnquiryResult =
  /** A person on the team has it. */
  | { status: "sent" }
  | { status: "invalid"; field: EnquiryField }
  /** Sent faster than a person can fill the form in. */
  | { status: "too-fast" }
  /** Too many attempts from one address. */
  | { status: "limited" }
  /** Turnstile did not vouch for the sender. */
  | { status: "unverified" }
  /** Nothing took it: every channel refused, or none is configured. */
  | { status: "failed" };

const PER_IP = 5;
const CONFIRMATIONS_PER_ADDRESS = 2;

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

  const ip = await clientIp();
  if (!allow(`ip:${ip}`, PER_IP)) return { status: "limited" };
  if (!(await isHuman(input.token, ip))) return { status: "unverified" };
  if (!canDeliver()) {
    console.error("[contact] no delivery channel: set RESEND_API_KEY (see .env.example)");
    return { status: "failed" };
  }

  const enquiry = checked.value;
  const { t } = await initTranslations(enquiry.locale, ["console"]);
  const message = composeEnquiry(enquiry, (key) => t(key));
  if (!(await deliver({ ...message, replyTo: enquiry.email }))) return { status: "failed" };

  // The confirmation goes to an address anyone can type in, so it carries
  // none of the visitor's own words and each address gets only a couple.
  if (canConfirm() && allow(`to:${enquiry.email.toLowerCase()}`, CONFIRMATIONS_PER_ADDRESS)) {
    const confirmation = { subject: t("autoreply.subject"), body: t("autoreply.body") };
    after(() => confirm(enquiry.email, confirmation));
  }
  return { status: "sent" };
}
