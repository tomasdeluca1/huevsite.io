// OAuth del MCP y el prompt de arranque. No pega a la red, no manda mail, no imprime secretos.
// Uso: npx tsx scripts/verify-mcp-oauth.ts
import { CLIENT_GUIDES, MCP_INSTRUCTIONS, PUBLISH_PROMPT, STARTER_PROMPT } from "../lib/mcp/guide";
import { cursorInstallLink, vscodeInstallLink } from "../lib/mcp/install-links";
import { fetchClientMetadata, isPrivateAddress, parseClientMetadataDocument, parseRegistration } from "../lib/mcp/oauth/clients";
import { pkceMatches, pkceS256 } from "../lib/mcp/oauth/pkce";
import { isRegisterableRedirect, redirectAllowed, redirectTrust } from "../lib/mcp/oauth/redirect";
import {
  authorizationServerMetadata,
  endpointsForIssuer,
  protectedResourceMetadata,
  sameResource,
  wwwAuthenticate,
} from "../lib/mcp/oauth/metadata";
import {
  exchangeAuthorizationCode,
  exchangeRefreshToken,
  issueAuthorizationCode,
  revokePresentedToken,
  type OAuthStore,
  type StoredClient,
  type StoredCode,
  type StoredGrant,
} from "../lib/mcp/oauth/flow";
import { handleMcpHttp } from "../lib/mcp/http";
import { dispatchMcp } from "../lib/mcp/server";
import type { McpStore } from "../lib/mcp/types";

let failed = 0;
function ok(name: string, condition: boolean, detail?: string) {
  if (!condition) failed++;
  console.log(`${condition ? "✓" : "✗"} ${name}${!condition && detail ? `\n    ${detail}` : ""}`);
}

const RESOURCE = "https://huevsite.io/api/mcp";
const NOW = new Date("2026-11-10T18:00:00.000Z");

function client(partial: Partial<StoredClient> = {}): StoredClient {
  return {
    clientId: "hvc_test",
    clientName: "Claude",
    clientUri: null,
    logoUri: null,
    redirectUris: ["https://claude.ai/api/mcp/auth_callback", "http://127.0.0.1/callback", "http://localhost/callback"],
    tokenEndpointAuthMethod: "none",
    source: "dcr",
    clientSecretHash: null,
    ...partial,
  };
}

function memory(): OAuthStore & { grants: StoredGrant[] } {
  const codes: StoredCode[] = [];
  const grants: StoredGrant[] = [];
  const clients = new Map<string, StoredClient>();
  return {
    grants,
    async saveClient(row) { clients.set(row.clientId, row); },
    async getClient(id) { return clients.get(id) || null; },
    async insertCode(code) { codes.push(code); },
    async consumeCode(hash, now) {
      const row = codes.find((item) => item.codeHash === hash && !item.usedAt && Date.parse(item.expiresAt) > now.getTime());
      if (!row) return null;
      row.usedAt = now.toISOString();
      return row;
    },
    async findCode(hash) { return codes.find((item) => item.codeHash === hash) || null; },
    async insertGrant(grant) { grants.push(grant); },
    async getByAccessHash(hash) { return grants.find((item) => item.accessTokenHash === hash) || null; },
    async getByRefreshHash(hash) { return grants.find((item) => item.refreshTokenHash === hash) || null; },
    async consumeRefresh(hash, now) {
      const row = grants.find((item) => item.refreshTokenHash === hash && !item.revokedAt);
      if (!row) return null;
      row.revokedAt = now.toISOString();
      return row;
    },
    async revokeFamily(familyId, now) {
      for (const grant of grants) {
        if (grant.familyId === familyId && !grant.revokedAt) grant.revokedAt = now.toISOString();
      }
    },
    async touchGrant() {},
    async listConnections(userId) {
      const seen = new Set<string>();
      const out = [];
      for (const grant of grants) {
        if (grant.userId !== userId || grant.revokedAt || seen.has(grant.clientId)) continue;
        seen.add(grant.clientId);
        out.push({ clientId: grant.clientId, clientName: grant.clientName, createdAt: NOW.toISOString(), lastUsedAt: null });
      }
      return out;
    },
    async revokeClient(userId, clientId, now) {
      for (const grant of grants) {
        if (grant.userId === userId && grant.clientId === clientId && !grant.revokedAt) grant.revokedAt = now.toISOString();
      }
    },
  };
}

const verifier = "a".repeat(50);
const challenge = pkceS256(verifier);
ok("PKCE S256 coincide", pkceMatches(verifier, challenge));
ok("un verifier distinto no pasa", !pkceMatches(`${verifier}b`.slice(0, 60), challenge));
ok("loopback ignora el puerto", redirectAllowed("http://localhost:3118/callback", ["http://localhost/callback"]));
ok("127.0.0.1 también", redirectAllowed("http://127.0.0.1:53682/callback", ["http://127.0.0.1/callback"]));
ok("otro host no entra", !redirectAllowed("https://evil.example/callback", ["https://claude.ai/api/mcp/auth_callback"]));
ok("javascript no se registra", !isRegisterableRedirect("javascript:alert(1)"));
ok("una IP privada se rechaza", isPrivateAddress("127.0.0.1") && isPrivateAddress("10.1.1.1") && isPrivateAddress("169.254.1.1"));
ok("una IPv4 privada mapeada a IPv6 se rechaza", isPrivateAddress("::ffff:127.0.0.1") && isPrivateAddress("::ffff:169.254.169.254") && isPrivateAddress("::ffff:a9fe:a9fe"));
ok("una IP pública no se trata como privada", !isPrivateAddress("1.1.1.1") && !isPrivateAddress("2001:4860:4860::8888"));
ok(
  "los rangos reservados y de la nube se rechazan",
  ["0.0.0.0", "100.64.0.1", "192.0.0.8", "198.18.0.1", "198.19.255.1", "224.0.0.1", "255.255.255.255", "::", "::1", "0:0:0:0:0:0:0:1", "fe80::1", "febf::1", "fc00::1", "fd12::1", "ff02::1", "64:ff9b::a9fe:a9fe", "2002:a9fe:a9fe::1", "::169.254.169.254", "[::1]", "fe80::1%eth0"].every(isPrivateAddress)
);
ok("lo que no es una IP se trata como no confiable", isPrivateAddress("localhost") && isPrivateAddress("999.1.1.1") && isPrivateAddress(""));
ok("las públicas siguen pasando", ["8.8.8.8", "172.32.0.1", "100.128.0.1", "198.20.0.1", "2606:4700:4700::1111", "2a00:1450:4001::200e"].every((ip) => !isPrivateAddress(ip)));
const CIMD_ID = "https://claude.ai/oauth/mcp-oauth-client-metadata";
const cimdDoc = (extra: Record<string, unknown> = {}) => ({
  client_id: CIMD_ID,
  client_name: "Claude",
  redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
  ...extra,
});
const withScriptUri = parseClientMetadataDocument(CIMD_ID, cimdDoc({ client_uri: "javascript:alert(1)" }));
const withAppUri = parseRegistration({ redirect_uris: ["https://claude.ai/api/mcp/auth_callback"], client_uri: "myapp://home" });
const withHttpsUri = parseClientMetadataDocument(CIMD_ID, cimdDoc({ client_uri: "https://claude.ai" }));
ok("client_uri sólo acepta https", withScriptUri.ok && withScriptUri.client.clientUri === null && withAppUri.ok && withAppUri.client.clientUri === null && withHttpsUri.ok && withHttpsUri.client.clientUri === "https://claude.ai/");
ok(
  "el destino se clasifica por host",
  redirectTrust("https://claude.ai/api/mcp/auth_callback") === "known" &&
    redirectTrust("http://127.0.0.1:53682/callback") === "local" &&
    redirectTrust("https://claude.ai.evil.example/cb") === "unknown" &&
    redirectTrust("https://evil.example/claude.ai") === "unknown" &&
    redirectTrust("https://claude.ai:8443/cb") === "unknown" &&
    redirectTrust("cursor://anysphere.cursor-retrieval/oauth/callback") === "unknown"
);
ok("el documento CIMD tiene que coincidir el client_id", !parseClientMetadataDocument("https://claude.ai/oauth/mcp-oauth-client-metadata", {
  client_id: "https://otro.example/client",
  client_name: "Claude",
  redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
}).ok);

const endpoints = endpointsForIssuer("https://huevsite.io");
const prm = protectedResourceMetadata(endpoints);
const asm = authorizationServerMetadata(endpoints);
ok("el resource es el MCP", prm.resource === RESOURCE && prm.authorization_servers[0] === "https://huevsite.io");
ok("hay DCR, PKCE y CIMD", asm.registration_endpoint.endsWith("/api/oauth/register") && asm.code_challenge_methods_supported.includes("S256") && asm.client_id_metadata_document_supported === true);
ok("el 401 apunta a la metadata", wwwAuthenticate(endpoints.metadataUrl).includes(`resource_metadata="${endpoints.metadataUrl}"`) && wwwAuthenticate(endpoints.metadataUrl).includes("scope="));
ok("el resource tolera la barra final", sameResource(`${RESOURCE}/`, RESOURCE));

const cursor = cursorInstallLink(RESOURCE);
const cursorConfig = JSON.parse(Buffer.from(new URL(cursor).searchParams.get("config") || "", "base64").toString("utf8"));
ok("Cursor instala solo la URL", cursor.startsWith("cursor://anysphere.cursor-deeplink/mcp/install") && cursorConfig.url === RESOURCE && !JSON.stringify(cursorConfig).toLowerCase().includes("bearer"));
const vscodeRaw = decodeURIComponent(vscodeInstallLink(RESOURCE).slice("vscode:mcp/install?".length));
const vscodeConfig = JSON.parse(vscodeRaw);
ok("VS Code instala http sin token", vscodeInstallLink(RESOURCE).startsWith("vscode:mcp/install?") && vscodeConfig.type === "http" && vscodeConfig.url === RESOURCE && !vscodeRaw.toLowerCase().includes("bearer"));

ok("el prompt de arranque pide el perfil y una confirmación", STARTER_PROMPT.includes("get_my_profile") && STARTER_PROMPT.includes("que sí") && STARTER_PROMPT.includes("post_update"));
ok("las instrucciones del servidor dicen lo mismo", MCP_INSTRUCTIONS.includes("get_my_profile") && MCP_INSTRUCTIONS.includes("post_update") && MCP_INSTRUCTIONS.includes("armar_mi_perfil"));
ok("hay tutorial de los cuatro clientes", ["cursor", "vscode", "claude", "chatgpt"].every((id) => (CLIENT_GUIDES.find((guide) => guide.id === id)?.steps.length || 0) >= 3));
ok("Claude usa los nombres oficiales", CLIENT_GUIDES.find((guide) => guide.id === "claude")?.steps.join(" ").includes("Add custom connector") === true);
ok("ChatGPT usa Add custom MCP server", CLIENT_GUIDES.find((guide) => guide.id === "chatgpt")?.steps.join(" ").includes("Add custom MCP server") === true);

async function run() {
  const store = memory();
  const app = client();
  const issued = await issueAuthorizationCode(store, {
    client: app,
    userId: "11111111-1111-4111-8111-111111111111",
    redirectUri: "https://claude.ai/api/mcp/auth_callback",
    codeChallenge: challenge,
    codeChallengeMethod: "S256",
    scope: null,
    resource: RESOURCE,
    expectedResource: RESOURCE,
    now: NOW,
  });
  ok("el consentimiento emite un código", issued.ok === true);
  if (!issued.ok) return;
  const bad = await exchangeAuthorizationCode(store, {
    code: issued.code,
    client: app,
    redirectUri: "https://claude.ai/api/mcp/auth_callback",
    codeVerifier: "b".repeat(50),
    resource: RESOURCE,
    expectedResource: RESOURCE,
    clientSecret: null,
    now: NOW,
  });
  ok("un verifier malo gasta el código", !bad.ok);
  const again = await issueAuthorizationCode(store, {
    client: app,
    userId: "11111111-1111-4111-8111-111111111111",
    redirectUri: "http://localhost:4400/callback",
    codeChallenge: challenge,
    codeChallengeMethod: "S256",
    scope: "huevsite",
    resource: RESOURCE,
    expectedResource: RESOURCE,
    now: NOW,
  });
  if (!again.ok) {
    ok("el segundo código sale", false);
    return;
  }
  const traded = await exchangeAuthorizationCode(store, {
    code: again.code,
    client: app,
    redirectUri: "http://localhost:4400/callback",
    codeVerifier: verifier,
    resource: RESOURCE,
    expectedResource: RESOURCE,
    clientSecret: null,
    now: NOW,
  });
  ok("el canje devuelve access y refresh", traded.ok === true && traded.ok && traded.token.accessToken.startsWith("hvsa_") && traded.token.refreshToken.startsWith("hvsr_"));
  if (!traded.ok) return;
  const firstAccess = traded.token.accessToken;
  const refreshed = await exchangeRefreshToken(store, {
    refreshToken: traded.token.refreshToken,
    client: app,
    resource: RESOURCE,
    expectedResource: RESOURCE,
    clientSecret: null,
    now: new Date(NOW.getTime() + 1000),
  });
  ok("el refresh rota el token", refreshed.ok === true && refreshed.ok && refreshed.token.accessToken !== firstAccess);
  if (!refreshed.ok) return;
  const reused = await exchangeRefreshToken(store, {
    refreshToken: traded.token.refreshToken,
    client: app,
    resource: null,
    expectedResource: RESOURCE,
    clientSecret: null,
    now: new Date(NOW.getTime() + 2000),
  });
  ok("reusar el refresh viejo lo invalida", !reused.ok);
  const live = store.grants.filter((grant) => grant.familyId === refreshed.token.familyId && !grant.revokedAt);
  ok("la familia queda revocada", live.length === 0);

  const fresh = await issueAuthorizationCode(store, {
    client: app,
    userId: "11111111-1111-4111-8111-111111111111",
    redirectUri: "https://claude.ai/api/mcp/auth_callback",
    codeChallenge: challenge,
    codeChallengeMethod: "S256",
    scope: null,
    resource: RESOURCE,
    expectedResource: RESOURCE,
    now: NOW,
  });
  if (!fresh.ok) return;
  const third = await exchangeAuthorizationCode(store, {
    code: fresh.code,
    client: app,
    redirectUri: "https://claude.ai/api/mcp/auth_callback",
    codeVerifier: verifier,
    resource: RESOURCE,
    expectedResource: RESOURCE,
    clientSecret: null,
    now: NOW,
  });
  if (!third.ok) return;
  await revokePresentedToken(store, third.token.accessToken, NOW);
  ok("revocar apaga el access", store.grants.find((grant) => grant.id === third.token.tokenId)?.revokedAt != null);
  const listed = await store.listConnections("11111111-1111-4111-8111-111111111111");
  ok("una app revocada no figura conectada", listed.length === 0);

  const anon = await handleMcpHttp(new Request("https://huevsite.io/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: "{}",
  }));
  const header = anon.headers.get("www-authenticate") || "";
  ok("sin token el 401 apunta a la metadata", anon.status === 401 && header.includes("resource_metadata=") && header.includes("/.well-known/oauth-protected-resource"));

  const emptyStore = { async getProfile() { return null; } } as unknown as McpStore;
  const init = await dispatchMcp(new Request("https://huevsite.io/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "verify", version: "0" } },
    }),
  }), { userId: "11111111-1111-4111-8111-111111111111", store: emptyStore, audit: async () => {} });
  const initBody = await init.json();
  ok("initialize trae las instrucciones", String(initBody?.result?.instructions || "").includes("get_my_profile"));

  const prompts = await dispatchMcp(new Request("https://huevsite.io/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "prompts/list", params: {} }),
  }), { userId: "11111111-1111-4111-8111-111111111111", store: emptyStore, audit: async () => {} });
  const names = ((await prompts.json())?.result?.prompts || []).map((item: { name: string }) => item.name).sort();
  ok("hay prompts nativos", JSON.stringify(names) === JSON.stringify(["armar_mi_perfil", "publicar_avance"]), JSON.stringify(names));

  const got = await dispatchMcp(new Request("https://huevsite.io/api/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "prompts/get", params: { name: "publicar_avance" } }),
  }), { userId: "11111111-1111-4111-8111-111111111111", store: emptyStore, audit: async () => {} });
  const text = JSON.stringify((await got.json())?.result || {});
  ok("publicar_avance menciona post_update", text.includes("post_update") && PUBLISH_PROMPT.includes("announce_launch"));

  // Un código que se canjea dos veces tira abajo los tokens del primer canje.
  const replayStore = memory();
  const replayIssued = await issueAuthorizationCode(replayStore, {
    client: client(),
    userId: "11111111-1111-4111-8111-111111111111",
    redirectUri: "https://claude.ai/api/mcp/auth_callback",
    codeChallenge: challenge,
    codeChallengeMethod: "S256",
    scope: "huevsite",
    resource: RESOURCE,
    expectedResource: RESOURCE,
    now: NOW,
  });
  if (replayIssued.ok) {
    const trade = () => exchangeAuthorizationCode(replayStore, {
      code: replayIssued.code,
      client: client(),
      redirectUri: "https://claude.ai/api/mcp/auth_callback",
      codeVerifier: verifier,
      resource: RESOURCE,
      expectedResource: RESOURCE,
      clientSecret: null,
      now: NOW,
    });
    const first = await trade();
    const rotated = first.ok
      ? await exchangeRefreshToken(replayStore, {
          refreshToken: first.token.refreshToken,
          client: client(),
          resource: RESOURCE,
          expectedResource: RESOURCE,
          clientSecret: null,
          now: new Date(NOW.getTime() + 1000),
        })
      : null;
    const liveBefore = replayStore.grants.filter((grant) => !grant.revokedAt).length;
    const second = await trade();
    const liveAfter = replayStore.grants.filter((grant) => !grant.revokedAt).length;
    ok("el segundo canje del mismo código falla", first.ok && !second.ok);
    ok("y revoca lo que emitió el primero, incluso lo ya rotado", !!rotated?.ok && liveBefore === 1 && liveAfter === 0, `${liveBefore} -> ${liveAfter}`);
    const unknownCode = await exchangeAuthorizationCode(replayStore, {
      code: "hvsc_nunca_existio",
      client: client(),
      redirectUri: "https://claude.ai/api/mcp/auth_callback",
      codeVerifier: verifier,
      resource: RESOURCE,
      expectedResource: RESOURCE,
      clientSecret: null,
      now: NOW,
    });
    ok("un código inventado no revoca nada", !unknownCode.ok);
  } else {
    ok("el código para la prueba de reuso sale", false);
  }

  // Búsqueda del documento de metadata: resolver y transporte inyectados, sin red.
  const publicDns = async () => [{ address: "160.79.104.10", family: 4 }];
  let transportCalls = 0;
  let pinnedTo = "";
  const goodTransport = async (_url: URL, address: { address: string }) => {
    transportCalls++;
    pinnedTo = address.address;
    return { status: 200, body: JSON.stringify(cimdDoc()) };
  };
  const fetched = await fetchClientMetadata(CIMD_ID, { resolve: publicDns, transport: goodTransport });
  ok("un documento válido en un host público se acepta", fetched.ok && fetched.client.source === "cimd" && pinnedTo === "160.79.104.10");
  transportCalls = 0;
  const internal = await fetchClientMetadata(CIMD_ID, { resolve: async () => [{ address: "169.254.169.254", family: 4 }], transport: goodTransport });
  const mixed = await fetchClientMetadata(CIMD_ID, { resolve: async () => [{ address: "160.79.104.10", family: 4 }, { address: "10.0.0.5", family: 4 }], transport: goodTransport });
  const literal = await fetchClientMetadata("https://127.0.0.1/client.json", { resolve: publicDns, transport: goodTransport });
  const literalV6 = await fetchClientMetadata("https://[::1]/client.json", { resolve: publicDns, transport: goodTransport });
  const oddPort = await fetchClientMetadata("https://claude.ai:8443/client.json", { resolve: publicDns, transport: goodTransport });
  ok("un host que resuelve a la red interna no se consulta", !internal.ok && !mixed.ok && !literal.ok && !literalV6.ok && !oddPort.ok && transportCalls === 0, `llamadas: ${transportCalls}`);
  const huge = await fetchClientMetadata(CIMD_ID, { resolve: publicDns, transport: async () => ({ status: 200, body: "x".repeat(70_000) }) });
  const notFound = await fetchClientMetadata(CIMD_ID, { resolve: publicDns, transport: async () => null });
  const notJson = await fetchClientMetadata(CIMD_ID, { resolve: publicDns, transport: async () => ({ status: 200, body: "<html>" }) });
  ok("respuestas enormes, caídas o que no son JSON se rechazan", !huge.ok && !notFound.ok && !notJson.ok);

  if (failed) {
    console.error(`\n${failed} checks fallaron`);
    process.exit(1);
  }
  console.log("\noauth ok");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
