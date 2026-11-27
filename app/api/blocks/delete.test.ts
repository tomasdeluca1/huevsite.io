import "next/dist/server/node-environment";
import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { requestAsyncStorage } from "next/dist/client/components/request-async-storage.external";
import { RequestAsyncStorageWrapper } from "next/dist/server/async-storage/request-async-storage-wrapper";
import { NextRequest } from "next/server";

const supabaseUrl = "http://supabase.test";
const user = { id: "f3eb3815-eea6-45a3-b981-b3b29a9f0ac2" };
const subSiteId = "9f9e669c-0744-404d-8b6d-eb43a257bcdd";
const importedBlock = { id: "main-link", user_id: user.id, sub_site_id: null };
const subSiteBlock = { id: "sub-link", user_id: user.id, sub_site_id: subSiteId };

async function deleteBlock(t: TestContext, id: string, scope: string | null) {
  const env = process.env;
  process.env = {
    ...env,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: "mock-publishable-key",
    SUPABASE_SERVICE_ROLE_KEY: "mock-service-role-key",
    TWITTER_API_KEY: "mock-key",
    TWITTER_API_SECRET: "mock-secret",
    TWITTER_ACCESS_TOKEN: "mock-token",
    TWITTER_ACCESS_SECRET: "mock-access-secret",
  };
  t.after(() => { process.env = env; });
  const { DELETE } = await import("./[id]/route");
  let blocks = [importedBlock, subSiteBlock];

  t.mock.method(globalThis, "fetch", async (input: URL | RequestInfo, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.origin, supabaseUrl);
    switch (url.pathname) {
      case "/auth/v1/user":
        return Response.json(user);
      case "/rest/v1/blocks": {
        const scopeFilter = url.searchParams.get("sub_site_id");
        const matches = blocks.filter((block) =>
          url.searchParams.get("id") === `eq.${block.id}` &&
          url.searchParams.get("user_id") === `eq.${block.user_id}` &&
          (scopeFilter === null ||
            scopeFilter === (block.sub_site_id === null ? "is.null" : `eq.${block.sub_site_id}`))
        );
        if (init?.method === "DELETE") {
          blocks = blocks.filter((block) => !matches.includes(block));
          return new Response(null, { status: 204 });
        }
        return Response.json(matches);
      }
      case "/rest/v1/profiles":
      case "/rest/v1/sub_sites":
        return Response.json([]);
      case "/rest/v1/rpc/recompute_builder_score":
        return Response.json(0);
      default:
        assert.fail(`Unexpected Supabase request: ${url}`);
    }
  });

  const request = new NextRequest(`http://localhost/api/blocks/${id}`, { method: "DELETE" });
  if (scope !== null) request.nextUrl.searchParams.set("sub_site_id", scope);
  request.cookies.set("sb-supabase-auth-token", JSON.stringify({
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  }));
  const response = await RequestAsyncStorageWrapper.wrap(requestAsyncStorage, { req: request }, () =>
    DELETE(request, { params: { id } })
  );
  return { response, blocks };
}

test("sub-site delete preserves the imported main block when the editor supplies its ID", async (t) => {
  const { response, blocks } = await deleteBlock(t, importedBlock.id, subSiteId);
  assert.ok(blocks.includes(importedBlock), "sub-site delete removed the imported main-profile block");
  assert.equal(response.status, 404);
});

test("sub-site delete removes only the matching sub-site block", async (t) => {
  const { response, blocks } = await deleteBlock(t, subSiteBlock.id, subSiteId);
  assert.equal(response.status, 200);
  assert.deepEqual(blocks, [importedBlock]);
});

test("main profile delete without a sub-site scope removes only a main-profile block", async (t) => {
  const { response, blocks } = await deleteBlock(t, importedBlock.id, null);
  assert.equal(response.status, 200);
  assert.deepEqual(blocks, [subSiteBlock]);
});

test("main profile delete cannot remove a sub-site block", async (t) => {
  const { response, blocks } = await deleteBlock(t, subSiteBlock.id, null);
  assert.deepEqual(blocks, [importedBlock, subSiteBlock]);
  assert.equal(response.status, 404);
});
