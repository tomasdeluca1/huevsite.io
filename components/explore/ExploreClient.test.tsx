import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { JSDOM } from "jsdom";
import { NextIntlClientProvider } from "next-intl";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
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
        <SearchParamsContext.Provider value={new URLSearchParams(window.location.search)}>
          <ExploreClient initialTotal={2} />
        </SearchParamsContext.Provider>
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

async function openScoreInfo(t: TestContext, focusOpener = true) {
  const { container } = await renderExplore(t, () => profilesResponse("first-builder", false));
  const opener = Array.from(container.querySelectorAll("button")).find((button) =>
    button.textContent?.startsWith(messages.explore.scoreSystem),
  );
  assert.ok(opener);
  if (focusOpener) {
    opener.focus();
  } else {
    assert.equal(container.ownerDocument.activeElement, container.ownerDocument.body);
  }
  await act(async () => opener.click());

  const document = container.ownerDocument;
  const title = Array.from(document.querySelectorAll("h2")).find((heading) =>
    heading.textContent?.startsWith("Builder Score"),
  );
  assert.ok(title);
  const closeButton = title.parentElement!.parentElement!.querySelector("button")!;
  const gotItButton = Array.from(document.querySelectorAll("button")).find((button) =>
    button.textContent === messages.shared.scoreInfo.gotIt,
  );
  assert.ok(gotItButton);
  const pressKey = async (key: string, shiftKey = false) => {
    const event = new document.defaultView!.KeyboardEvent("keydown", {
      key, shiftKey, bubbles: true, cancelable: true,
    });
    await act(async () => document.activeElement!.dispatchEvent(event));
    return event;
  };

  return { opener, document, title, closeButton, gotItButton, pressKey };
}

test("Builder Score closes on Escape and restores focus to its opener", async (t) => {
  const { opener, document, title, closeButton, pressKey } = await openScoreInfo(t);
  closeButton.focus();

  const escape = await pressKey("Escape");

  assert.ok(escape.defaultPrevented, "Expected the modal to handle Escape");
  assert.equal(document.activeElement, opener);
  assert.ok(!title.isConnected || title.closest("[inert]"));
});

test("Builder Score restores focus to an opener that was clicked without receiving focus", async (t) => {
  const { opener, document, pressKey } = await openScoreInfo(t, false);

  await pressKey("Escape");

  assert.ok(document.activeElement === opener, "Expected focus to return to the clicked button");
});

test("Builder Score moves focus inside and wraps Tab and Shift+Tab within the modal", async (t) => {
  const { document, closeButton, gotItButton, pressKey } = await openScoreInfo(t);
  const initialFocus = document.activeElement;
  gotItButton.focus();

  const tab = await pressKey("Tab");
  assert.ok(tab.defaultPrevented, "Expected the modal to wrap Tab at its last control");
  assert.equal(document.activeElement, closeButton);

  const shiftTab = await pressKey("Tab", true);
  assert.ok(shiftTab.defaultPrevented, "Expected the modal to wrap Shift+Tab at its first control");
  assert.equal(document.activeElement, gotItButton);
  assert.equal(initialFocus, closeButton);
});
