// Uso: npx tsx scripts/verify-project-delete.ts
import assert from "node:assert/strict";
import { publicPathsAfterProjectDelete } from "../lib/revalidate-public-profile";

assert.deepEqual(publicPathsAfterProjectDelete("ada"), ["/ada", "/explore"]);
assert.deepEqual(publicPathsAfterProjectDelete("@Ada_1"), ["/Ada_1", "/explore"]);
assert.deepEqual(publicPathsAfterProjectDelete("ada", "side-project"), ["/ada", "/ada/side-project", "/explore"]);

assert.deepEqual(publicPathsAfterProjectDelete(""), []);
assert.deepEqual(publicPathsAfterProjectDelete("../admin"), []);
assert.deepEqual(publicPathsAfterProjectDelete("ada/extra"), []);
assert.deepEqual(publicPathsAfterProjectDelete("ada", "../x"), ["/ada", "/explore"]);
assert.deepEqual(publicPathsAfterProjectDelete("ada", "HasCaps"), ["/ada", "/explore"]);

console.log("project delete paths ok");
