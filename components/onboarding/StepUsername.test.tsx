import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { JSDOM } from "jsdom";
import { NextIntlClientProvider } from "next-intl";
import { act, useState } from "react";
import { INITIAL_STATE, type OnboardingState } from "@/lib/onboarding-types";
import messages from "@/messages/en.json";
import { StepUsername } from "./StepUsername";

function delayedResponse() {
  let release!: (body: { available: boolean }) => void;
  const response = new Promise<Response>((resolve) => {
    release = (body) => resolve(Response.json(body));
  });
  return { response, release };
}

function Harness() {
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
  return (
    <StepUsername
      state={state}
      onChange={(username, usernameAvailable) => setState((prev) => ({ ...prev, username, usernameAvailable }))}
      onFinish={() => {}}
    />
  );
}

async function renderStep(t: TestContext, respond: (username: string) => Response | Promise<Response>) {
  const { window } = new JSDOM("<main></main>", { url: "http://localhost/onboarding" });
  const globals = {
    window,
    self: window,
    document: window.document,
    navigator: window.navigator,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const restoreGlobals = Object.entries(globals).map(([key, value]) => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true });
    return () => {
      if (previous) Object.defineProperty(globalThis, key, previous);
      else Reflect.deleteProperty(globalThis, key);
    };
  });
  // Load react-dom once the DOM globals exist, so it wires native input events
  // for the autofocused field instead of the legacy IE polyfill.
  const { createRoot } = await import("react-dom/client");
  const { Simulate } = await import("react-dom/test-utils");
  const container = window.document.querySelector("main")!;
  const root = createRoot(container);
  t.after(async () => {
    await act(async () => root.unmount());
    window.close();
    restoreGlobals.forEach((restore) => restore());
  });

  const checked: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string) => {
    const username = new URL(url, window.location.href).searchParams.get("u") ?? "";
    checked.push(username);
    return respond(username);
  });
  t.mock.timers.enable({ apis: ["setTimeout"] });

  await act(async () => {
    root.render(
      <NextIntlClientProvider locale="en" timeZone="UTC" messages={{ onboarding: messages.onboarding }}>
        <Harness />
      </NextIntlClientProvider>
    );
  });

  const input = container.querySelector("input");
  assert.ok(input instanceof window.HTMLInputElement);
  const type = async (value: string) => {
    await act(async () => {
      input.value = value;
      Simulate.change(input);
    });
  };
  const finishDebounce = async () => {
    await act(async () => t.mock.timers.tick(700));
  };
  const publish = () => container.querySelector("button")!;
  return { container, input, checked, type, finishDebounce, publish };
}

test("StepUsername ignores a late available reply for a handle the user already replaced", async (t) => {
  const old = delayedResponse();
  const { container, input, checked, type, finishDebounce, publish } = await renderStep(t, (username) =>
    username === "oldname" ? old.response : Response.json({ available: false })
  );

  await type("oldname");
  await finishDebounce();
  await type("newname");
  await finishDebounce();
  assert.deepEqual(checked, ["oldname", "newname"]);
  assert.ok(container.textContent?.includes(messages.onboarding.usernameTaken));

  await act(async () => old.release({ available: true }));

  assert.equal(input.value, "newname");
  assert.ok(container.textContent?.includes(messages.onboarding.usernameTaken));
  assert.ok(!container.textContent?.includes(messages.onboarding.usernameAvailable));
  assert.equal(publish().disabled, true);
});

test("StepUsername keeps an invalid edit when the previous handle's check resolves late", async (t) => {
  const old = delayedResponse();
  const { container, input, type, finishDebounce, publish } = await renderStep(t, () => old.response);

  await type("oldname");
  await finishDebounce();
  await type("ol");

  await act(async () => old.release({ available: true }));

  assert.equal(input.value, "ol");
  assert.ok(!container.textContent?.includes(messages.onboarding.usernameAvailable));
  assert.equal(publish().disabled, true);
});
