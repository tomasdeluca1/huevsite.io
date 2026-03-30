import type { ReactElement } from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";

export async function sendRenderedEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: ReactElement;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set. Skipping email.");
    return null;
  }

  const resend = new Resend(apiKey);
  const html = await render(react);

  return resend.emails.send({
    from: "Huevsite <hola@huevsite.studio>",
    to,
    subject,
    html,
  });
}
