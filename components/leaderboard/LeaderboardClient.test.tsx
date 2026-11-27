import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { NextIntlClientProvider } from "next-intl";
import { act } from "react";
import { createRoot } from "react-dom/client";
import messages from "@/messages/en.json";
import { LeaderboardClient } from "./LeaderboardClient";

const scoreLeader = { id: "score-leader", username: "score-leader", name: "Score Leader", builder_score: 900, followers_count: 10 };
const followersLeader = { id: "followers-leader", username: "followers-leader", name: "Followers Leader", builder_score: 200, followers_count: 80 };

test("Leaderboard keeps Followers ranked first when an older Builder Score response arrives last", async (t) => {
  const { window } = new JSDOM("<main></main>", { url: "http://localhost/leaderboard" });
  const globals = { window, self: window, document: window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const restoreGlobals = Object.entries(globals).map(([key, value]) => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true });
    return () => {
      if (previous) Object.defineProperty(globalThis, key, previous);
      else Reflect.deleteProperty(globalThis, key);
    };
  });
  const container = window.document.querySelector("main")!;
  const root = createRoot(container);
  t.after(async () => {
    await act(async () => root.unmount());
    window.close();
    restoreGlobals.forEach((restore) => restore());
  });

  let releaseScore!: (response: Response) => void;
  const scoreResponse = new Promise<Response>((resolve) => { releaseScore = resolve; });
  const requestedSorts: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string) => {
    const sort = new URL(url, window.location.href).searchParams.get("sort")!;
    requestedSorts.push(sort);
    if (sort === "score") return scoreResponse;
    assert.equal(sort, "followers");
    return Response.json({ profiles: [followersLeader, scoreLeader] });
  });

  await act(async () => {
    root.render(
      <NextIntlClientProvider locale="en" timeZone="UTC" messages={{ leaderboard: messages.leaderboard }}>
        <LeaderboardClient />
      </NextIntlClientProvider>
    );
  });
  assert.deepEqual(requestedSorts, ["score"]);
  const followersTab = Array.from(container.querySelectorAll("button"))
    .find((button) => button.textContent?.startsWith(messages.leaderboard.tab_followers));
  assert.ok(followersTab, "Expected a Followers tab");
  await act(async () => followersTab.click());
  assert.deepEqual(requestedSorts, ["score", "followers"]);
  const rankings = () => Array.from(container.querySelectorAll("h3"), (heading) => heading.textContent);
  const followersOrder = ["Followers Leader", "Score Leader"];
  assert.deepEqual(rankings(), followersOrder);

  await act(async () => { releaseScore(Response.json({ profiles: [scoreLeader, followersLeader] })); });
  assert.deepEqual(rankings(), followersOrder);
});
