// With the app running locally: npx tsx --test scripts/explore-search.test.ts
import { test, type TestContext } from "node:test";
import { chromium, type Page } from "playwright";
import { expect } from "playwright/test";

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";

async function openExplore(t: TestContext, delayed: { query: string; pageNumber: string }) {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ locale: "en-US" });

  await page.route("**/api/explore?*", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const query = params.get("q") || "all";
    const pageNumber = params.get("page");
    const username = `${query}-${pageNumber}`;
    await route.fulfill({
      json: {
        profiles: [{ id: username, username, name: username }],
        hasMore: query === "all" && pageNumber !== "2",
      },
    });
  });

  await page.addInitScript(({ query, pageNumber }) => {
    const fetch = window.fetch.bind(window);
    const release = new Promise<void>((resolve) => {
      window.addEventListener("release-explore-response", () => resolve(), { once: true });
    });

    window.fetch = async (input, init) => {
      const response = await fetch(input, init);
      const url = new URL(response.url);
      if (
        url.pathname === "/api/explore" &&
        url.searchParams.get("q") === query &&
        url.searchParams.get("page") === pageNumber
      ) {
        const json = response.json.bind(response);
        response.json = async () => {
          const data = await json();
          // The body has already been read; aborting fetch cannot reject this promise.
          document.documentElement.dataset.exploreResponseReady = "true";
          await release;
          return data;
        };
      }
      return response;
    };
  }, delayed);

  await page.goto(new URL("/explore", baseUrl).href);
  const cards = page.locator("main h2");
  await expect(cards).toHaveText(["all-0"], { timeout: 15_000 });
  return { page, cards, search: page.getByRole("textbox") };
}

async function releaseResponse(page: Page) {
  await page.evaluate(async () => {
    window.dispatchEvent(new Event("release-explore-response"));
    // Let the response continuation and React's render run before inspecting the DOM.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
}

test("a slow search must not replace the newer search results", async (t) => {
  const { page, cards, search } = await openExplore(t, { query: "old", pageNumber: "0" });
  await search.fill("old");
  await expect(page.locator("html")).toHaveAttribute("data-explore-response-ready", "true");
  await search.fill("new");
  await expect(cards).toHaveText(["new-0"]);

  await releaseResponse(page);
  await expect(cards).toHaveText(["new-0"]);
});

test("a slow load-more response must not append to a new search", async (t) => {
  const { page, cards, search } = await openExplore(t, { query: "", pageNumber: "2" });
  const loadMore = page.getByRole("button", { name: "Load more huevsites" });
  await loadMore.click();
  await expect(cards).toHaveText(["all-0", "all-1"]);
  await loadMore.click();
  await expect(page.locator("html")).toHaveAttribute("data-explore-response-ready", "true");
  await search.fill("new");
  await expect(cards).toHaveText(["new-0"]);

  await releaseResponse(page);
  await expect(cards).toHaveText(["new-0"]);
});
