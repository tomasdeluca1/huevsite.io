// Serialize a JSON-LD object for embedding inside a <script> tag via
// dangerouslySetInnerHTML. JSON.stringify does NOT escape "<", so a value like
// `</script><img onerror=...>` (e.g. an attacker-controlled author name) would
// break out of the script element → stored XSS. Escaping every "<" makes the
// `</script>` breakout impossible while keeping the output valid JSON.
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
