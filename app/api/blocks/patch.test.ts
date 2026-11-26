import "next/dist/server/node-environment";
import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { requestAsyncStorage } from "next/dist/client/components/request-async-storage.external";
import { RequestAsyncStorageWrapper } from "next/dist/server/async-storage/request-async-storage-wrapper";
import { NextRequest } from "next/server";

const supabaseUrl = "http://supabase.test";
const user = { id: "f3eb3815-eea6-45a3-b981-b3b29a9f0ac2" };
const subSiteId = "9f9e669c-0744-404d-8b6d-eb43a257bcdd";
const otherSiteId = "7f82fa55-8d26-4ead-89a1-b5a4d71f947b";
const mainBlock = { id: "main-link", user_id: user.id, sub_site_id: null, type: "custom", visible: true };
const subSiteBlock = { ...mainBlock, id: "sub-link", sub_site_id: subSiteId };

async function patchBlock(t: TestContext, id: string, scope: string | null) {
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
  const { PATCH } = await import("./[id]/route");
  const blocks = [{ ...mainBlock }, { ...subSiteBlock }];
  const blockRequests: Array<{ method: string; scope: string | null }> = [];

  t.mock.method(globalThis, "fetch", async (input: URL | RequestInfo, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.origin, supabaseUrl);
    switch (url.pathname) {
      case "/auth/v1/user":
        return Response.json(user);
      case "/rest/v1/blocks": {
        const scopeFilter = url.searchParams.get("sub_site_id");
        blockRequests.push({ method: init?.method ?? "GET", scope: scopeFilter });
        const matches = blocks.filter((block) =>
          url.searchParams.get("id") === `eq.${block.id}` &&
          url.searchParams.get("user_id") === `eq.${block.user_id}` &&
          (scopeFilter === null ||
            scopeFilter === (block.sub_site_id === null ? "is.null" : `eq.${block.sub_site_id}`))
        );
        if (init?.method === "PATCH") {
          const [block] = matches;
          if (!block) return Response.json({ code: "PGRST116" }, { status: 406 });
          Object.assign(block, JSON.parse(String(init.body)));
          return Response.json(block);
        }
        return Response.json(matches);
      }
      case "/rest/v1/activities":
        return new Response(null, { status: 201 });
      case "/rest/v1/rpc/recompute_builder_score":
        return Response.json(0);
      default:
        assert.fail(`Unexpected Supabase request: ${url}`);
    }
  });

  const request = new NextRequest(`http://localhost/api/blocks/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ visible: false }),
  });
  if (scope !== null) request.nextUrl.searchParams.set("sub_site_id", scope);
  request.cookies.set("sb-supabase-auth-token", JSON.stringify({
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  }));
  const response = await RequestAsyncStorageWrapper.wrap(requestAsyncStorage, { req: request }, () =>
    PATCH(request, { params: { id } })
  );
  return { response, blocks, blockRequests };
}

test("a sub-site edit leaves the main-profile block unchanged", async (t) => {
  const { response, blocks } = await patchBlock(t, mainBlock.id, subSiteId);
  assert.equal(blocks[0].visible, true, "sub-site edit changed the main-profile block");
  assert.equal(response.status, 404);
});

test("a main-profile edit leaves the sub-site block unchanged", async (t) => {
  const { response, blocks } = await patchBlock(t, subSiteBlock.id, null);
  assert.equal(blocks[1].visible, true, "main-profile edit changed the sub-site block");
  assert.equal(response.status, 404);
});

test("an edit from a different sub-site leaves the block unchanged", async (t) => {
  const { response, blocks } = await patchBlock(t, subSiteBlock.id, otherSiteId);
  assert.equal(blocks[1].visible, true, "an edit from a different sub-site changed the block");
  assert.equal(response.status, 404);
});

test("a matching sub-site edit scopes both the lookup and the write", async (t) => {
  const { response, blocks, blockRequests } = await patchBlock(t, subSiteBlock.id, subSiteId);
  assert.equal(response.status, 200);
  assert.deepEqual(blocks, [mainBlock, { ...subSiteBlock, visible: false }]);
  assert.deepEqual(blockRequests, [
    { method: "GET", scope: `eq.${subSiteId}` },
    { method: "PATCH", scope: `eq.${subSiteId}` },
  ]);
});

test("a matching main-profile edit scopes both the lookup and the write", async (t) => {
  const { response, blocks, blockRequests } = await patchBlock(t, mainBlock.id, null);
  assert.equal(response.status, 200);
  assert.deepEqual(blocks, [{ ...mainBlock, visible: false }, subSiteBlock]);
  assert.deepEqual(blockRequests, [
    { method: "GET", scope: "is.null" },
    { method: "PATCH", scope: "is.null" },
  ]);
});

test("a malformed sub-site scope is rejected before querying blocks", async (t) => {
  const { response, blockRequests } = await patchBlock(t, mainBlock.id, "not-a-uuid");
  assert.equal(response.status, 400);
  assert.deepEqual(blockRequests, []);
});
