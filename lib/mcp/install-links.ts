export function cursorInstallLink(mcpUrl: string): string {
  const config = Buffer.from(JSON.stringify({ url: mcpUrl }), "utf8").toString("base64");
  const url = new URL("cursor://anysphere.cursor-deeplink/mcp/install");
  url.searchParams.set("name", "huevsite");
  url.searchParams.set("config", config);
  return url.toString();
}

export function vscodeInstallLink(mcpUrl: string): string {
  const config = JSON.stringify({ name: "huevsite", type: "http", url: mcpUrl });
  return `vscode:mcp/install?${encodeURIComponent(config)}`;
}

export function cursorConfig(mcpUrl: string): string {
  return JSON.stringify({ mcpServers: { huevsite: { url: mcpUrl } } }, null, 2);
}

export function vscodeConfig(mcpUrl: string): string {
  return JSON.stringify({ servers: { huevsite: { type: "http", url: mcpUrl } } }, null, 2);
}

export function claudeConfig(mcpUrl: string): string {
  return JSON.stringify({ mcpServers: { huevsite: { type: "http", url: mcpUrl } } }, null, 2);
}

export function tokenConfig(mcpUrl: string): string {
  return JSON.stringify({
    mcpServers: {
      huevsite: {
        url: mcpUrl,
        headers: { Authorization: "Bearer TU_TOKEN" },
      },
    },
  }, null, 2);
}

export const EXAMPLE_PROMPTS = [
  "Agregá mi proyecto nuevo",
  "Publicá un avance",
  "Actualizá mi bio",
] as const;
