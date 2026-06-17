import { Resend } from "resend";
import { env } from "@/lib/env";

/**
 * Transactional email via Resend.
 *
 * RESEND_API_KEY is optional, so the app runs without email configured;
 * sendEmail throws a clear error if it is called without a key. Set EMAIL_FROM
 * to a verified sender (use onboarding@resend.dev in dev, your domain in prod).
 */
let client: Resend | null = null;

function getClient(): Resend {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set. Add it to .env to send email.");
  }
  client ??= new Resend(env.RESEND_API_KEY);
  return client;
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  const { data, error } = await getClient().emails.send({
    from: env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
  return data;
}
