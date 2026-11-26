import assert from "node:assert/strict";
import test from "node:test";
import { saveDashboard } from "./dashboard-save";

const profile = {
  accentColor: "#00FF88",
  username: "builder",
  displayName: "Builder",
  blocks: [{ id: "block" }],
};

const mobileSaved = async () => true;
const profileSaved = () => Response.json({ profile: { builder_score: 42 } });

test("attempts both order updates and rejects when the profile update fails", async (t) => {
  const writes: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    writes.push(`${init.method} ${url}`);
    return url === "/api/profile" ? new Response(null, { status: 400 }) : Response.json({});
  });
  const flushMobileOrder = async () => {
    writes.push("mobile order");
    return true;
  };

  await assert.rejects(saveDashboard(profile, flushMobileOrder), /Profile update failed \(400\)/);
  assert.deepEqual(writes, ["PATCH /api/profile", "POST /api/blocks/reorder", "mobile order"]);
});

test("rejects the dashboard save when the desktop order update fails", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string) =>
    url === "/api/profile" ? profileSaved() : new Response(null, { status: 500 }));

  const flushMobileOrder = t.mock.fn(mobileSaved);
  await assert.rejects(saveDashboard(profile, flushMobileOrder));
  assert.equal(flushMobileOrder.mock.callCount(), 1);
});

test("rejects the dashboard save when the mobile order update fails", async (t) => {
  t.mock.method(globalThis, "fetch", async () => profileSaved());

  await assert.rejects(saveDashboard(profile, async () => false));
});

test("rejects the dashboard save when the request loses its connection", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async (url: string) => {
    if (url === "/api/profile") throw new TypeError("Failed to fetch");
    return Response.json({});
  });

  const flushMobileOrder = t.mock.fn(mobileSaved);
  await assert.rejects(saveDashboard(profile, flushMobileOrder), /Failed to fetch/);
  assert.equal(fetch.mock.callCount(), 2);
  assert.equal(flushMobileOrder.mock.callCount(), 1);
});

test("returns the builder score once the dashboard save succeeds", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string) =>
    url === "/api/profile" ? profileSaved() : new Response(null, { status: 204 }));

  assert.equal(await saveDashboard(profile, mobileSaved), 42);
});
