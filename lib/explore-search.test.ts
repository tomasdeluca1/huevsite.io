import assert from "node:assert/strict";
import test from "node:test";
import { getInitialExploreSearch, getUpdatedExploreSearchUrl } from "./explore-search";

test("Explore starts with the URL query instead of the saved search", () => {
  assert.equal(getInitialExploreSearch("Mate & Build", () => "previous"), "Mate & Build");
});

test("an explicitly empty URL query clears the saved search", () => {
  assert.equal(getInitialExploreSearch("", () => "previous"), "");
});

test("initializing from an explicit URL query does not read browser storage", () => {
  assert.equal(getInitialExploreSearch("design", () => {
    throw new Error("Storage is unavailable");
  }), "design");
});

test("without a URL query Explore uses the saved search or starts empty", () => {
  assert.equal(getInitialExploreSearch(undefined, () => "previous"), "previous");
  assert.equal(getInitialExploreSearch(undefined, () => null), "");
});

test("editing the Explore search changes q without losing other URL parameters or the hash", () => {
  const href = "https://huevsite.io/explore?q=mate&from=dashboard#results";
  assert.equal(getUpdatedExploreSearchUrl(href, "Studio & Co")?.href,
    "https://huevsite.io/explore?q=Studio+%26+Co&from=dashboard#results");
});

test("clearing the Explore search removes q and leaves other parameters in place", () => {
  assert.equal(getUpdatedExploreSearchUrl("https://huevsite.io/explore?q=mate&from=dashboard", "")?.search,
    "?from=dashboard");
});

test("there is no URL update when q already matches the Explore search", () => {
  assert.equal(getUpdatedExploreSearchUrl("https://huevsite.io/explore?q=mate", "mate"), null);
  assert.equal(getUpdatedExploreSearchUrl("https://huevsite.io/explore?from=dashboard", ""), null);
});
