import "next/dist/server/node-environment";
import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { requestAsyncStorage } from "next/dist/client/components/request-async-storage.external";
import { RequestAsyncStorageWrapper } from "next/dist/server/async-storage/request-async-storage-wrapper";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/launches/route";

const week = "2026-W01";
const launch = { id: "launch", block_id: "block", user_id: "user" };

async function getLaunches(t: TestContext, responses: Record<string, Response>) {
  const env = process.env;
  process.env = {
    ...env,
    NEXT_PUBLIC_SUPABASE_URL: "http://supabase.test",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: "mock-publishable-key",
    SUPABASE_SERVICE_ROLE_KEY: "mock-service-role-key",
  };
  t.after(() => { process.env = env; });
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "http://supabase.test");
    assert.ok(responses[url.pathname], `Unexpected Supabase request: ${url}`);
    return responses[url.pathname];
  });

  const req = new NextRequest(`http://localhost/api/launches?week=${week}`);
  return RequestAsyncStorageWrapper.wrap(requestAsyncStorage, { req }, () => GET(req));
}

test("launches API returns an error rather than an empty week when Supabase fails", async (t) => {
  const response = await getLaunches(t, {
    "/rest/v1/project_launches": Response.json({ code: "08006", message: "connection failure" }, { status: 503 }),
  });

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "server_error" });
});

test("launches API reports a failed project lookup even when the week has launches", async (t) => {
  const response = await getLaunches(t, {
    "/rest/v1/project_launches": Response.json([launch]),
    "/rest/v1/blocks": Response.json({ code: "08006", message: "connection failure" }, { status: 503 }),
    "/rest/v1/profiles": Response.json([{ id: launch.user_id }]),
  });

  assert.equal(response.status, 500);
});

test("launches API still returns an empty list after a successful empty query", async (t) => {
  const response = await getLaunches(t, { "/rest/v1/project_launches": Response.json([]) });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { week, launches: [], votedIds: [] });
});
