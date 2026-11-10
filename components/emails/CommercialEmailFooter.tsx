import * as React from "react";
import { BRAND } from "@/lib/brand";
import { emailPostalAddress, senderIdentityLine } from "@/lib/email-from";

// Shared footer for commercial mail: who sent it, the postal address when
// EMAIL_POSTAL_ADDRESS is set, and a visible unsubscribe link.
export function CommercialEmailFooter({ unsubscribeUrl }: { unsubscribeUrl: string }) {
  const postal = emailPostalAddress();
  const muted = {
    fontSize: "12px",
    lineHeight: 1.6,
    color: BRAND.color.textMuted,
    margin: "4px 0 0",
  } as const;

  return (
    <div style={{ marginTop: "16px" }}>
      <p style={muted}>{senderIdentityLine()}</p>
      {postal ? <p style={muted}>{postal}</p> : null}
      <p style={muted}>
        <a href={unsubscribeUrl} style={{ color: BRAND.color.textMuted, textDecoration: "underline" }}>
          Darme de baja de estos avisos
        </a>
      </p>
    </div>
  );
}
