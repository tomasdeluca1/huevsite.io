const BLOCKED_SCHEMES = new Set([
  "javascript:",
  "data:",
  "file:",
  "blob:",
  "filesystem:",
  "vbscript:",
  "about:",
]);

function isLoopback(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function isRegisterableRedirect(uri: string): boolean {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.username || url.password || url.hash) return false;
  const scheme = url.protocol.toLowerCase();
  if (BLOCKED_SCHEMES.has(scheme)) return false;
  if (scheme === "http:") return isLoopback(url.hostname);
  if (scheme === "https:") return true;
  return /^[a-z][a-z0-9+.-]*:$/.test(scheme);
}

function comparable(url: URL): { scheme: string; host: string; path: string; search: string; port: string } {
  return {
    scheme: url.protocol.toLowerCase(),
    host: url.hostname.replace(/^\[|\]$/g, "").toLowerCase(),
    path: url.pathname || "/",
    search: url.search,
    port: url.port,
  };
}

export function redirectMatches(requested: string, registered: string): boolean {
  let req: URL;
  let reg: URL;
  try {
    req = new URL(requested);
    reg = new URL(registered);
  } catch {
    return false;
  }
  if (req.hash || req.username || req.password) return false;
  const a = comparable(req);
  const b = comparable(reg);
  if (a.scheme !== b.scheme || a.host !== b.host || a.path !== b.path || a.search !== b.search) return false;
  if (a.scheme === "http:" && isLoopback(a.host) && isLoopback(b.host)) return true;
  return a.port === b.port;
}

export function redirectAllowed(requested: string, registered: string[]): boolean {
  if (!isRegisterableRedirect(requested)) return false;
  return registered.some((item) => redirectMatches(requested, item));
}

export function redirectHostLabel(uri: string): string {
  try {
    const url = new URL(uri);
    if (url.protocol === "http:" || url.protocol === "https:") return url.host;
    return url.protocol.replace(":", "");
  } catch {
    return "la app";
  }
}

// Destinos de los clientes MCP que conocemos. El registro es abierto, así que cualquiera puede
// anotarse como "Claude": lo único que no se puede falsificar es a dónde vuelve el código.
const KNOWN_REDIRECT_HOSTS = new Set([
  "claude.ai",
  "claude.com",
  "chatgpt.com",
  "vscode.dev",
  "insiders.vscode.dev",
]);

export type RedirectTrust = "known" | "local" | "unknown";

export function redirectTrust(uri: string): RedirectTrust {
  try {
    const url = new URL(uri);
    if (url.protocol === "https:" && !url.port && KNOWN_REDIRECT_HOSTS.has(url.hostname.toLowerCase())) return "known";
    if (url.protocol === "http:" && isLoopback(url.hostname)) return "local";
    return "unknown";
  } catch {
    return "unknown";
  }
}
