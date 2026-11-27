import assert from "node:assert/strict";
import { chromium } from "playwright";
import en from "../messages/en.json";
import es from "../messages/es.json";

async function verifyPagination() {
  const url = new URL("/blog?page=2", process.env.BASE_URL ?? "http://localhost:3000");
  const browser = await chromium.launch();
  const overflow: string[] = [];

  try {
    for (const [locale, { blogUi }] of [["es-AR", es], ["en-US", en]] as const) {
      const page = await browser.newPage({ locale });
      for (const width of [400, 320, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(url.href);
        await page.evaluate(async () => { await document.fonts.ready; });

        const nav = page.locator("main").getByRole("navigation");
        assert.equal(await nav.getByRole("link", { name: blogUi.prev, exact: true }).getAttribute("href"), "/blog");
        assert.equal(await nav.getByRole("link", { name: blogUi.next, exact: true }).getAttribute("href"), "/blog?page=3");
        const clipped = await nav.getByRole("link").evaluateAll((links) => {
          const { left, right } = links[0].closest("nav")!.getBoundingClientRect();
          return links.filter((link) => {
            const rect = link.getBoundingClientRect();
            return rect.left < left - 1 || rect.right > right + 1;
          }).map((link) => link.textContent?.trim()).join(", ");
        });
        if (clipped) overflow.push(`${locale} at ${width}px: ${clipped}`);
        else console.log(`All pagination links fit: ${locale} at ${width}px`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  assert.deepEqual(overflow, [], "Pagination links extend beyond the navigation bounds");
}

void verifyPagination().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
