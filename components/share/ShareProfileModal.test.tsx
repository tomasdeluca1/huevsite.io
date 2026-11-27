import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { JSDOM } from "jsdom";
import { NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useShareCelebration } from "@/components/dashboard/shell/useShareCelebration";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import messages from "@/messages/en.json";

function setupDom(t: TestContext) {
  const { window } = new JSDOM("<main></main><button id='outside'>Outside</button>", {
    url: "http://localhost/builder",
  });
  const { document } = window;
  const restore = Object.entries({
    window,
    self: window,
    document,
    navigator: window.navigator,
    localStorage: window.localStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
  }).map(([name, value]) => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    return () => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else Reflect.deleteProperty(globalThis, name);
    };
  });
  const root = createRoot(document.querySelector("main")!);
  t.after(async () => {
    await act(async () => root.unmount());
    window.close();
    restore.forEach((fn) => fn());
  });
  return { window, document, root };
}

async function openShare(t: TestContext) {
  const { window, document, root } = setupDom(t);
  await act(async () => {
    root.render(
      <NextIntlClientProvider locale="en" timeZone="UTC" messages={{ shared: messages.shared }}>
        <ProfileHeader username="builder" accentColor="#C8FF00" />
      </NextIntlClientProvider>
    );
  });

  const opener = document.querySelector<HTMLButtonElement>("header button")!;
  const outside = document.querySelector<HTMLButtonElement>("#outside")!;
  outside.focus();
  await act(async () => opener.click());
  const close = document.querySelector<HTMLButtonElement>(`button[aria-label="${messages.shared.share.close}"]`);
  const qrToggle = Array.from(document.querySelectorAll("button"))
    .find((button) => button.textContent?.trim() === messages.shared.share.showQr);
  assert.ok(close, "Share dialog has its Close button");
  assert.ok(qrToggle, "Share dialog has its QR toggle");

  const keydown = async (key: string, shiftKey = false) => {
    const event = new window.KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true });
    await act(async () => document.activeElement!.dispatchEvent(event));
    return event.defaultPrevented;
  };
  return { document, opener, close, qrToggle, keydown };
}

test("the one-time Share celebration waits until the required dashboard dialog is dismissed", async (t) => {
  const { root, window } = setupDom(t);
  const onCelebrate = t.mock.fn();
  function DashboardShare({ chooserOpen }: { chooserOpen: boolean }) {
    useShareCelebration("builder", !chooserOpen, onCelebrate);
    return null;
  }
  const render = (chooserOpen: boolean) => act(async () => root.render(<DashboardShare chooserOpen={chooserOpen} />));

  await render(true);
  assert.equal(onCelebrate.mock.callCount(), 0);
  assert.equal(window.localStorage.getItem("huevsite_share_celebrated_builder"), null);
  await render(false);
  assert.equal(onCelebrate.mock.callCount(), 1);
  await render(true);
  await render(false);
  assert.equal(onCelebrate.mock.callCount(), 1);
});

test("Escape closes Share and restores focus to the opener even if clicking did not focus it", async (t) => {
  const { document, opener, close, keydown } = await openShare(t);
  await keydown("Escape");
  assert.equal(close.isConnected, false, "Escape closed the Share dialog");
  assert.ok(document.activeElement === opener, "focus returned to the Share button");
});

test("Share focuses Close on open and wraps Tab and Shift+Tab", async (t) => {
  const { document, close, qrToggle, keydown } = await openShare(t);
  assert.ok(document.activeElement === close, "focus moved inside the Share dialog on open");
  assert.equal(await keydown("Tab", true), true, "Shift+Tab at Close is intercepted");
  assert.ok(document.activeElement === qrToggle);
  assert.equal(await keydown("Tab"), true, "Tab at the last control is intercepted");
  assert.ok(document.activeElement === close);
});

test("Share moves focus between buttons and links without relying on the browser's Tab behavior", async (t) => {
  const { document, close, qrToggle, keydown } = await openShare(t);
  const dialog = close.closest('[role="dialog"]')!;
  const copy = Array.from(dialog.querySelectorAll("button"))
    .find((button) => button.textContent?.trim() === messages.shared.share.copy)!;
  const links = Array.from(dialog.querySelectorAll("a[href]"));
  assert.equal(links.length, 5);
  await act(async () => qrToggle.click());
  const download = dialog.querySelector("a[download]")!;
  for (const control of [copy, ...links, qrToggle, download, close]) {
    assert.equal(await keydown("Tab"), true);
    assert.ok(document.activeElement === control, "Tab reached the next dialog control");
  }
  for (const control of [download, qrToggle, ...links.reverse(), copy, close]) {
    assert.equal(await keydown("Tab", true), true);
    assert.ok(document.activeElement === control, "Shift+Tab reached the previous dialog control");
  }
});

test("Share includes the QR download in the focus loop only while the QR panel is open", async (t) => {
  const { document, close, qrToggle, keydown } = await openShare(t);
  await act(async () => qrToggle.click());
  const download = document.querySelector<HTMLAnchorElement>("a[download]")!;
  assert.ok(download, "QR download appeared");
  download.focus();
  assert.equal(await keydown("Tab"), true, "Tab wraps from the QR download");
  assert.ok(document.activeElement === close);
  assert.equal(await keydown("Tab", true), true);
  assert.ok(document.activeElement === download);
  await act(async () => qrToggle.click());
  qrToggle.focus();
  assert.equal(await keydown("Tab"), true, "Tab wraps from the toggle again");
  assert.ok(document.activeElement === close);
});
