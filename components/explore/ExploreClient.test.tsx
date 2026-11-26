import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { JSDOM } from "jsdom";
import { NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@/lib/supabase/client";
import messages from "@/messages/en.json";
import { ExploreClient } from "./ExploreClient";

function profilesResponse(name: string, hasMore: boolean) {
  return Response.json({
    profiles: [{ id: name, name, username: name, tagline: "Building on the web" }],
    hasMore,
  });
}

async function renderExplore(t: TestContext, respond: (page: number, attempt: number) => Response) {
  const { window } = new JSDOM("<main></main>", { url: "http://localhost/explore" });
  const globals = {
    window,
    self: window,
    document: window.document,
    navigator: window.navigator,
    localStorage: window.localStorage,
    sessionStorage: window.sessionStorage,
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
  const originalEnv = process.env;
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: "test-publishable-key",
  };
  const container = window.document.querySelector("main")!;
  const root = createRoot(container);
  t.after(async () => {
    await act(async () => root.unmount());
    await createClient().auth.stopAutoRefresh();
    window.close();
    restoreGlobals.forEach((restore) => restore());
    process.env = originalEnv;
  });

  const pages: number[] = [];
  let initialRequest: () => void;
  const requested = new Promise<void>((resolve) => { initialRequest = resolve; });
  t.mock.method(globalThis, "fetch", async (url: string) => {
    const page = Number(new URL(url, window.location.href).searchParams.get("page"));
    pages.push(page);
    initialRequest();
    return respond(page, pages.filter((loaded) => loaded === page).length);
  });

  await act(async () => {
    root.render(
      <NextIntlClientProvider locale="en" timeZone="UTC" messages={{ explore: messages.explore, shared: messages.shared }}>
        <ExploreClient initialTotal={2} />
      </NextIntlClientProvider>
    );
  });
  await act(async () => { await requested; });

  const findButton = (label: string) =>
    Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.trim() === label);
  const click = async (label: string) => {
    const button = findButton(label);
    assert.ok(button, `Expected a ${label} button`);
    await act(async () => button.click());
  };
  const alert = () => container.querySelector('[role="alert"]')?.textContent;
  return { container, pages, findButton, click, alert };
}

test("Explore distinguishes a failed initial request from an empty search and retries page 0", async (t) => {
  const { container, pages, click, alert } = await renderExplore(t, (_, attempt) =>
    attempt === 1 ? new Response(null, { status: 500 }) : profilesResponse("first-builder", false)
  );

  assert.ok(alert(), `Expected an error alert, got: ${container.textContent?.includes(messages.explore.emptySearch) ? messages.explore.emptySearch : "no alert"}`);
  assert.ok(!container.textContent?.includes(messages.explore.emptySearch));
  await click("Retry");

  assert.deepEqual(pages, [0, 0]);
  assert.ok(container.querySelector('a[href="/first-builder"]'));
  assert.equal(alert(), undefined);
});

test("Explore keeps its current results and retries the same page after Load more fails", async (t) => {
  const { container, pages, findButton, click, alert } = await renderExplore(t, (page, attempt) => {
    if (page === 0) return profilesResponse("first-builder", true);
    if (page === 1 && attempt === 1) return new Response(null, { status: 500 });
    return profilesResponse(page === 1 ? "second-builder" : "skipped-page-builder", false);
  });

  await click(messages.explore.loadMore);
  const loadMoreError = alert();
  assert.ok(container.querySelector('a[href="/first-builder"]'));
  // Exercise the original control too, so a regression reports the skipped page.
  await click(findButton("Retry") ? "Retry" : messages.explore.loadMore);

  assert.deepEqual(pages, [0, 1, 1]);
  assert.ok(loadMoreError, "Expected an error alert after Load more failed");
  assert.ok(container.querySelector('a[href="/first-builder"]'));
  assert.ok(container.querySelector('a[href="/second-builder"]'));
  assert.equal(alert(), undefined);
  assert.equal(findButton(messages.explore.loadMore), undefined);
});
