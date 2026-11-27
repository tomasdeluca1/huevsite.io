import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { NextIntlClientProvider } from "next-intl";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@/lib/supabase/client";
import messages from "@/messages/en.json";
import FeedPageClient from "@/app/feed/FeedPageClient";

test("Builders Hunt retries the selected week and only shows empty after success", async (t) => {
  const week = "2026-W01";
  const { window } = new JSDOM("<main></main>", { url: `http://localhost/feed?week=${week}` });
  const { feed, discovery, nav } = messages;
  const globals = {
    window,
    self: window,
    document: window.document,
    navigator: window.navigator,
    localStorage: window.localStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
    BroadcastChannel: undefined,
  };
  const restoreGlobals = Object.entries(globals).map(([key, value]) => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true });
    return () => {
      if (previous) Object.defineProperty(globalThis, key, previous);
      else Reflect.deleteProperty(globalThis, key);
    };
  });
  const env = process.env;
  process.env = {
    ...env,
    NEXT_PUBLIC_SUPABASE_URL: "http://supabase.test",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: "mock-publishable-key",
  };
  const container = window.document.querySelector("main")!;
  const root = createRoot(container);
  t.after(async () => {
    await act(async () => root.unmount());
    await createClient().auth.stopAutoRefresh();
    window.close();
    restoreGlobals.forEach((restore) => restore());
    process.env = env;
  });

  const requestedWeeks: (string | null)[] = [];
  let started!: () => void;
  const requestStarted = new Promise<void>((resolve) => { started = resolve; });
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = new URL(String(input), window.location.href);
    if (url.pathname === "/api/feed/sidebar") return Response.json({
      winner: null,
      topBuilders: [],
      pulse: { activeThisWeek: 0, newProjects: 0, endorsements: 0 },
      weekTopLaunches: [],
      topCommits: { year: [], month: [] },
      latestPosts: [],
    });
    assert.equal(url.pathname, "/api/launches");
    requestedWeeks.push(url.searchParams.get("week"));
    started();
    return requestedWeeks.length === 1
      ? Response.json({ error: "server_error" }, { status: 500 })
      : Response.json({ week, launches: [], votedIds: [] });
  });

  const feedPage = createElement(PathnameContext.Provider, { value: "/feed" },
    createElement(SearchParamsContext.Provider, { value: new URLSearchParams(window.location.search) },
      createElement(FeedPageClient),
    ),
  );
  await act(async () => root.render(createElement(NextIntlClientProvider, {
    locale: "en", timeZone: "UTC", messages: { feed, discovery, nav }, children: feedPage,
  })));
  await act(async () => { await requestStarted; });

  const alert = () => container.querySelector('[role="alert"]');
  const empty = () => container.textContent?.includes(messages.feed.launchesEmptyTitle);
  assert.ok(alert(), `Expected a load error, got: ${empty() ? "empty state" : "no alert"}`);
  assert.equal(empty(), false);
  const retry = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Retry");
  assert.ok(retry, "Expected a Retry button");
  await act(async () => retry.click());

  assert.deepEqual(requestedWeeks, [week, week]);
  assert.equal(alert(), null);
  assert.equal(empty(), true);
});
