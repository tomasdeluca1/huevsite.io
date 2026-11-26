import assert from "node:assert/strict";
import test from "node:test";
import { buildBdlsSlugIndex, resolveBdlsSlug } from "./bdls-links";

test("maps each win of a repeat winner to that week's own interview", () => {
  const index = buildBdlsSlugIndex([
    {
      slug: "builder-de-la-semana-scoutmaker-2026-w46",
      tags: ["builder-de-la-semana"],
      author: { username: "scoutmaker" },
    },
    {
      slug: "builder-de-la-semana-scoutmaker-2026-w35",
      tags: ["builder-de-la-semana"],
      author: { username: "scoutmaker" },
    },
  ]);

  assert.equal(
    resolveBdlsSlug(index, "scoutmaker", "2026-W46"),
    "builder-de-la-semana-scoutmaker-2026-w46"
  );
  assert.equal(
    resolveBdlsSlug(index, "scoutmaker", "2026-W35"),
    "builder-de-la-semana-scoutmaker-2026-w35"
  );
});

test("does not link an older win to a newer week-specific interview when only one interview is published", () => {
  const index = buildBdlsSlugIndex([
    {
      slug: "builder-de-la-semana-scoutmaker-2026-w46",
      tags: ["builder-de-la-semana"],
      author: { username: "scoutmaker" },
    },
  ]);

  assert.equal(
    resolveBdlsSlug(index, "scoutmaker", "2026-W46"),
    "builder-de-la-semana-scoutmaker-2026-w46"
  );
  assert.equal(resolveBdlsSlug(index, "scoutmaker", "2026-W35"), undefined);
});

test("falls back to a legacy slug without week suffix for single or prior wins", () => {
  const index = buildBdlsSlugIndex([
    {
      slug: "builder-de-la-semana-tomas-2026-w46",
      tags: ["builder-de-la-semana"],
      author: { username: "tomas" },
    },
    {
      slug: "builder-de-la-semana-tomas",
      tags: ["builder-de-la-semana"],
      author: { username: "tomas" },
    },
    {
      slug: "builder-de-la-semana-legacybuilder",
      tags: ["builder-de-la-semana"],
      author: { username: "legacybuilder" },
    },
  ]);

  assert.equal(
    resolveBdlsSlug(index, "tomas", "2026-W46"),
    "builder-de-la-semana-tomas-2026-w46"
  );
  assert.equal(
    resolveBdlsSlug(index, "tomas", "2026-W10"),
    "builder-de-la-semana-tomas"
  );
  assert.equal(
    resolveBdlsSlug(index, "legacybuilder", "2026-W09"),
    "builder-de-la-semana-legacybuilder"
  );
});

test("handles hyphenated usernames, mixed case, and ignores non-BDLS posts", () => {
  const index = buildBdlsSlugIndex([
    {
      slug: "guia-de-deploy-2026-w35",
      tags: ["guias"],
      author: { username: "juan-perez" },
    },
    {
      slug: "builder-de-la-semana-juan-perez-2026-w35",
      tags: ["builder-de-la-semana"],
      author: { username: "Juan-Perez" },
    },
  ]);

  assert.equal(
    resolveBdlsSlug(index, "JUAN-PEREZ", "2026-w35"),
    "builder-de-la-semana-juan-perez-2026-w35"
  );
  assert.equal(resolveBdlsSlug(index, "juan-perez", "2026-W36"), undefined);
});
