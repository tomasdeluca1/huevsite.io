import "next/dist/server/node-environment";
import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { requestAsyncStorage } from "next/dist/client/components/request-async-storage.external";
import { RequestAsyncStorageWrapper } from "next/dist/server/async-storage/request-async-storage-wrapper";
import { NextRequest } from "next/server";
import { GET } from "./route";

const supabaseUrl = "http://supabase.test";
const user = { id: "f3eb3815-eea6-45a3-b981-b3b29a9f0ac2" };

function getProfile(
  t: TestContext,
  profileResponse: (accept: string | null) => Response,
  authenticated = true,
) {
  const env = process.env;
  process.env = {
    ...env,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: "mock-publishable-key",
    SUPABASE_SERVICE_ROLE_KEY: "mock-service-role-key",
  };
  t.after(() => { process.env = env; });

  const fetchMock = t.mock.method(globalThis, "fetch", async (input: URL | RequestInfo, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.origin, supabaseUrl);
    switch (url.pathname) {
      case "/auth/v1/user":
        return Response.json(user);
      case "/rest/v1/profiles":
        assert.equal(url.searchParams.get("id"), `eq.${user.id}`);
        return profileResponse(new Headers(init?.headers).get("Accept"));
      case "/rest/v1/blocks":
      case "/rest/v1/sub_sites":
      case "/rest/v1/showcase_winners":
        return Response.json([]);
      default:
        assert.fail(`Unexpected Supabase request: ${url}`);
    }
  });

  const request = new NextRequest("http://localhost/api/profile");
  if (authenticated) {
    request.cookies.set("sb-supabase-auth-token", JSON.stringify({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    }));
  }

  return {
    response: RequestAsyncStorageWrapper.wrap(requestAsyncStorage, { req: request }, () => GET(request)),
    fetchMock,
  };
}

test("GET /api/profile returns 500 when the profile read fails", async (t) => {
  const { response, fetchMock } = getProfile(t, () => Response.json(
    { code: "42501", message: "permission denied for table profiles" },
    { status: 403 },
  ));

  const result = await response;
  assert.equal(fetchMock.mock.callCount(), 2);
  assert.equal(result.status, 500);
  assert.equal((await result.json()).error, "Algo falló al obtener el perfil");
});

test("GET /api/profile returns 404 when the profile doesn't exist", async (t) => {
  const { response } = getProfile(t, (accept) => accept === "application/vnd.pgrst.object+json"
    ? Response.json({ code: "PGRST116", details: "The result contains 0 rows", message: "Cannot coerce the result to a single JSON object" }, { status: 406 })
    : Response.json([]));

  assert.equal((await response).status, 404);
});

test("GET /api/profile returns 500 when the read yields multiple profiles", async (t) => {
  const { response } = getProfile(t, (accept) => accept === "application/vnd.pgrst.object+json"
    ? Response.json({ code: "PGRST116", details: "The result contains 2 rows", message: "Cannot coerce the result to a single JSON object" }, { status: 406 })
    : Response.json([user, user]));

  assert.equal((await response).status, 500);
});

test("GET /api/profile returns the existing profile", async (t) => {
  const profile = { ...user, username: "builder" };
  const { response } = getProfile(t, (accept) => Response.json(
    accept === "application/vnd.pgrst.object+json" ? profile : [profile],
  ));

  const result = await response;
  assert.equal(result.status, 200);
  assert.deepEqual((await result.json()).profile, profile);
});

test("GET /api/profile returns 401 without reading the database when signed out", async (t) => {
  const { response, fetchMock } = getProfile(t, () => assert.fail("Unexpected profile read"), false);

  assert.equal((await response).status, 401);
  assert.equal(fetchMock.mock.callCount(), 0);
});
