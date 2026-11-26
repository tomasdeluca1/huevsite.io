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

test("rejects the dashboard save when the profile update fails", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string) =>
    url === "/api/profile" ? new Response(null, { status: 500 }) : Response.json({}));

  await assert.rejects(saveDashboard(profile, mobileSaved));
});

test("rejects the dashboard save when the desktop order update fails", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string) =>
    url === "/api/profile" ? profileSaved() : new Response(null, { status: 500 }));

  await assert.rejects(saveDashboard(profile, mobileSaved));
});

test("rejects the dashboard save when the mobile order update fails", async (t) => {
  t.mock.method(globalThis, "fetch", async () => profileSaved());

  await assert.rejects(saveDashboard(profile, async () => false));
});

test("rejects the dashboard save when the request loses its connection", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });

  await assert.rejects(saveDashboard(profile, mobileSaved), /Failed to fetch/);
});

test("returns the builder score once the dashboard save succeeds", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string) =>
    url === "/api/profile" ? profileSaved() : new Response(null, { status: 204 }));

  assert.equal(await saveDashboard(profile, mobileSaved), 42);
});
