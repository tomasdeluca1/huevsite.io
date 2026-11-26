import assert from "node:assert/strict";
import test from "node:test";
import { getInitialExploreSearch } from "./explore-search";

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
