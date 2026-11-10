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

export const EXAMPLE_PROMPTS = [
  "Agregá mi proyecto nuevo",
  "Publicá un avance",
  "Actualizá mi bio",
] as const;
