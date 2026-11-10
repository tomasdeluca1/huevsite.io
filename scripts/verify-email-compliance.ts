// Guardrails de compliance de mail. No pega a la red, no manda mail, no lee secretos.
// Uso: npx tsx scripts/verify-email-compliance.ts
import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  DEFAULT_EMAIL_FROM,
  bareEmailAddress,
  EMAIL_REPLY_TO,
  emailFrom,
  emailFromAddress,
  emailPostalAddress,
  emailReplyTo,
  listUnsubscribeMailto,
  senderIdentityLine,
} from "../lib/email-from";
import {
  buildUnsubscribeToken,
  buildUnsubscribeUrl,
  identityFromParts,
  parseUnsubscribeToken,
  signUnsubscribe,
  verifyUnsubscribe,
} from "../lib/email-unsubscribe";
import { isValidUnsubscribeIdentity, listUnsubscribeHeaders, marketingUnsubscribe } from "../lib/email-compliance";
import { isEmailSuppressed } from "../lib/email-suppression";
import {
  founderMail1SkipReason,
  type FounderMail1OwnerMatch,
  type FounderMail1Profile,
} from "../lib/founder-mail1-audience";
import {
  suppressionFromResendEvent,
  verifyResendWebhook,
} from "../lib/resend-webhook";

let failed = 0;
function eq(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(
    `${ok ? "✓" : "✗"} ${name}${ok ? "" : `\n    esperado: ${JSON.stringify(expected)}\n    obtenido: ${JSON.stringify(actual)}`}`
  );
}
function ok(name: string, condition: boolean) {
  if (!condition) failed++;
  console.log(`${condition ? "✓" : "✗"} ${name}`);
}

const root = path.join(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

process.env.EMAIL_UNSUBSCRIBE_SECRET = "verify-email-compliance-secret";
delete process.env.EMAIL_FROM;
delete process.env.EMAIL_POSTAL_ADDRESS;

const userId = "11111111-1111-1111-1111-111111111111";
const sig = signUnsubscribe(userId);
eq("la firma verifica", verifyUnsubscribe(userId, sig), true);
eq("una firma tocada no verifica", verifyUnsubscribe(userId, sig.replace(/a/g, "b")), false);
eq("otro usuario no verifica", verifyUnsubscribe(userId + "x", sig), false);

const token = buildUnsubscribeToken(userId);
eq("el token parsea al usuario", parseUnsubscribeToken(token), { userId, sig });
eq("un token sin punto se rechaza", parseUnsubscribeToken("nose"), null);
eq(
  "el link nuevo usa token",
  buildUnsubscribeUrl(userId).includes(`/api/email/unsubscribe?token=${encodeURIComponent(token)}`),
  true
);

eq(
  "el formato viejo u+sig sigue valiendo",
  identityFromParts({ userId, sig })?.userId,
  userId
);
eq(
  "un token válido gana sobre un u vacío",
  isValidUnsubscribeIdentity({ token, userId: "", sig: "" }),
  true
);
eq("un token adulterado no pasa", isValidUnsubscribeIdentity({ token: `${userId}.deadbeef` }), false);

const headers = listUnsubscribeHeaders(buildUnsubscribeUrl(userId));
ok(
  "List-Unsubscribe tiene https y mailto",
  headers["List-Unsubscribe"].startsWith("<https://") &&
    headers["List-Unsubscribe"].includes(">, <mailto:") &&
    headers["List-Unsubscribe"].includes(encodeURIComponent(token))
);
eq("List-Unsubscribe-Post es one-click", headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
eq("el mailto sale del From default", listUnsubscribeMailto(), `mailto:${EMAIL_REPLY_TO}?subject=unsubscribe`);
eq("From default es Tomás", emailFrom(), DEFAULT_EMAIL_FROM);
eq("la dirección del From es tomidelu", emailFromAddress(), EMAIL_REPLY_TO);
eq("el reply-to es tomidelu", emailReplyTo(), EMAIL_REPLY_TO);
eq("sin domicilio postal no hay línea", emailPostalAddress(), null);

process.env.EMAIL_FROM = "Huevsite <otro@example.com>";
eq("EMAIL_FROM con nombre deja solo la dirección", emailFromAddress(), "otro@example.com");
eq("el mailto sigue a EMAIL_FROM", listUnsubscribeMailto(), "mailto:otro@example.com?subject=unsubscribe");
eq("el reply-to no cambia si se pisa el From", emailReplyTo(), EMAIL_REPLY_TO);
eq(
  "la identidad del pie nombra huevsite y la dirección",
  senderIdentityLine(EMAIL_REPLY_TO),
  `huevsite.io · ${EMAIL_REPLY_TO}`
);
process.env.EMAIL_POSTAL_ADDRESS = "  Calle Falsa 123\n";
eq("el domicilio postal se limpia", emailPostalAddress(), "Calle Falsa 123");
process.env.EMAIL_POSTAL_ADDRESS = "\n";
eq("un domicilio vacío se omite", emailPostalAddress(), null);
eq("una dirección pelada no se rompe", bareEmailAddress(EMAIL_REPLY_TO), EMAIL_REPLY_TO);

const mail = marketingUnsubscribe(userId);
ok("el helper de marketing arma el header con el mismo link", mail.headers["List-Unsubscribe"].includes(mail.unsubscribeUrl));

const suppressed = new Set(["bounced@example.com"]);
eq("una dirección rebotada se saltea", isEmailSuppressed(suppressed, "Bounced@example.com"), true);
eq("una dirección sana no", isEmailSuppressed(suppressed, "ok@example.com"), false);

const owner: FounderMail1OwnerMatch = { emails: new Set(), usernames: new Set(), ids: new Set() };
const profile: FounderMail1Profile = {
  id: userId,
  username: "builder",
  name: "Builder",
  email: "bounced@example.com",
  community_digest_unsubscribed: false,
  is_lifetime: false,
  subscription_tier: "free",
};
eq(
  "Mail 1 saltea rebotes",
  founderMail1SkipReason({ id: userId, email: "ok@example.com" }, profile, owner, suppressed),
  "suppressed"
);
eq(
  "la baja sigue ganando sobre el rebote",
  founderMail1SkipReason(
    { id: userId, email: "ok@example.com" },
    { ...profile, community_digest_unsubscribed: true },
    owner,
    suppressed
  ),
  "unsubscribed"
);

const secretBytes = crypto.randomBytes(24);
const secret = `whsec_${secretBytes.toString("base64")}`;
const body = JSON.stringify({
  type: "email.bounced",
  data: { to: ["Gone@example.com"] },
});
const id = "msg_verify";
const now = 1_700_000_000;
const timestamp = String(now);
const signed = crypto.createHmac("sha256", secretBytes).update(`${id}.${timestamp}.${body}`).digest("base64");
eq(
  "la firma de Resend verifica",
  verifyResendWebhook(body, { id, timestamp, signature: `v1,${signed}` }, secret, now),
  true
);
eq(
  "una firma vieja no pasa",
  verifyResendWebhook(body, { id, timestamp, signature: `v1,${signed}` }, secret, now + 600),
  false
);
eq(
  "un secreto distinto no pasa",
  verifyResendWebhook(body, { id, timestamp, signature: `v1,${signed}` }, `whsec_${crypto.randomBytes(24).toString("base64")}`, now),
  false
);
eq(
  "un rebote se vuelve supresión",
  suppressionFromResendEvent(JSON.parse(body)),
  { email: "gone@example.com", reason: "bounced" }
);
eq(
  "una queja se vuelve supresión",
  suppressionFromResendEvent({ type: "email.complained", data: { to: ["Spam@example.com"] } }),
  { email: "spam@example.com", reason: "complained" }
);
eq("un open no suprime", suppressionFromResendEvent({ type: "email.opened", data: { to: ["a@b.co"] } }), null);

const marketingRoutes = [
  "app/api/cron/monthly-digest/route.tsx",
  "app/api/cron/weekly-digest/route.tsx",
  "app/api/admin/send-vote-huevsite/route.ts",
  "app/api/admin/send-founder-batch/route.ts",
  "app/api/admin/send-founder-mail1/route.ts",
  "app/api/admin/send-milestone/route.ts",
  "app/api/admin/send-social-nudge/route.ts",
  "app/api/admin/send-update/route.ts",
  "app/api/admin/send-bdls-badge/route.ts",
];
for (const file of marketingRoutes) {
  const source = read(file);
  ok(`${file} arma headers de baja`, source.includes("marketingUnsubscribe"));
}
ok("el envío transaccional usa emailFrom", read("lib/email.ts").includes("emailFrom()"));
ok("el envío transaccional responde a Tomás", read("lib/email.ts").includes("replyTo: emailReplyTo()"));
ok("el envío transaccional no agrega List-Unsubscribe", !read("lib/email.ts").includes("List-Unsubscribe"));

const senderFiles = [
  ...marketingRoutes,
  "lib/email.ts",
  "lib/email-from.ts",
  "lib/bdls-content-pipeline.ts",
  "app/api/feedback/route.tsx",
  "app/api/admin/resend-winner-email/route.tsx",
  "components/emails/FounderMail1Email.tsx",
];
const retiredSenders = ["hi@huevsite.studio", "hola@huevsite.studio", "onboarding@resend.dev"];
for (const file of senderFiles) {
  const source = read(file);
  ok(`${file} responde a Tomás`, source.includes("emailReplyTo()") || source.includes("senderIdentityLine("));
  for (const retired of retiredSenders) {
    ok(`${file} no usa ${retired}`, !source.includes(retired));
  }
}

const commercialTemplates = [
  "components/emails/MonthlyDigestEmail.tsx",
  "components/emails/WeeklyDigestEmail.tsx",
  "components/emails/VoteHuevsiteEmail.tsx",
  "components/emails/FounderBatchEmail.tsx",
  "components/emails/Community200Email.tsx",
  "components/emails/ConnectSocialsEmail.tsx",
  "components/emails/ProductUpdateEmail.tsx",
  "components/emails/BadgeAwardEmail.tsx",
];
for (const file of commercialTemplates) {
  ok(`${file} pasa el link al pie`, read(file).includes("unsubscribeUrl={unsubscribeUrl}"));
}
ok(
  "Mail 1 muestra identidad y domicilio",
  read("components/emails/FounderMail1Email.tsx").includes("senderIdentityLine") &&
    read("components/emails/FounderMail1Email.tsx").includes("emailPostalAddress")
);
ok("la baja acepta POST", read("app/api/email/unsubscribe/route.ts").includes("export async function POST"));
ok("el webhook exige el secret", read("app/api/webhooks/resend/route.ts").includes("RESEND_WEBHOOK_SECRET"));

if (failed) {
  console.error(`\n${failed} comprobación(es) fallaron`);
  process.exit(1);
}
console.log("\nOK");
