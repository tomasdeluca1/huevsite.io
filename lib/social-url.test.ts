import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalGithubUsername,
  commitSocialLinks,
  normalizeBlockData,
  normalizeSocialInput,
  planSocialLinks,
  readSocialLinks,
  socialDraftsBlockSave,
  type NormalizeSuccess,
} from "./social-url";

function urlOf(platform: string, raw: string): string {
  const result = normalizeSocialInput(platform, raw);
  assert.equal(result.ok, true, result.ok ? "" : `${platform} ${raw} → ${result.error}`);
  return result.ok ? result.url : "";
}

function fails(platform: string, raw: string, code: string) {
  const result = normalizeSocialInput(platform, raw);
  assert.equal(result.ok, false, `${platform} ${raw} debería fallar`);
  if (!result.ok) assert.equal(result.code, code, `${platform} ${raw} → ${result.code} ${result.error}`);
}

test("casos reales del audit: prefijo duplicado, URL como handle, sin esquema y espacios", () => {
  assert.equal(
    urlOf("linkedin", "https://linkedin.com/in/https://www.linkedin.com/in/x/"),
    "https://www.linkedin.com/in/x",
  );
  assert.equal(
    urlOf("linkedin", "https://linkedin.com/in/https://linkedin.com/in/pela"),
    "https://www.linkedin.com/in/pela",
  );
  assert.equal(
    urlOf("youtube", "https://youtube.com/@https://www.youtube.com/X"),
    "https://www.youtube.com/@X",
  );
  assert.equal(
    urlOf("youtube", "https://youtube.com/@https://www.youtube.com/@Canal"),
    "https://www.youtube.com/@Canal",
  );
  assert.equal(
    urlOf("github", "https://github.com/https://github.com/octocat"),
    "https://github.com/octocat",
  );
  assert.equal(
    urlOf("github", "https://github.com/github.com/octocat"),
    "https://github.com/octocat",
  );
  assert.equal(urlOf("twitter", "https://x.com/https://x.com/jack"), "https://x.com/jack");
  assert.equal(urlOf("twitter", "https://x.com/https://twitter.com/jack"), "https://x.com/jack");
  assert.equal(urlOf("twitter", "jack "), "https://x.com/jack");
  assert.equal(urlOf("website", "example.com"), "https://example.com");
  assert.equal(urlOf("website", "  www.example.com/ruta/  "), "https://www.example.com/ruta");
});

test("el handle guardado con espacios gana sobre la URL concatenada", () => {
  const plan = planSocialLinks([
    {
      platform: "linkedin",
      handle: "https://www.linkedin.com/in/x/ ",
      url: "https://linkedin.com/in/https://www.linkedin.com/in/x/",
    },
    {
      platform: "github",
      handle: "https://github.com/octocat ",
      url: "https://github.com/https://github.com/octocat",
    },
    {
      platform: "twitter",
      handle: "jack ",
      url: "https://x.com/jack",
    },
    {
      platform: "website",
      handle: "misitio.com ",
      url: "misitio.com",
    },
  ]);
  assert.equal(plan.unfixable.length, 0);
  assert.deepEqual(
    plan.links.map((link) => link.url),
    [
      "https://www.linkedin.com/in/x",
      "https://github.com/octocat",
      "https://x.com/jack",
      "https://misitio.com",
    ],
  );
  assert.equal(plan.changed, true);
  const again = planSocialLinks(plan.links);
  assert.equal(again.changed, false);
  assert.equal(again.fixed.length, 0);
  assert.equal(again.unfixable.length, 0);
});

test("variantes de X, LinkedIn, GitHub, YouTube, Instagram, TikTok, Threads, Bluesky, web y mail", () => {
  const cases: Array<[string, string, string]> = [
    ["twitter", "@Jack", "https://x.com/Jack"],
    ["x", "jack", "https://x.com/jack"],
    ["twitter", "https://twitter.com/@jack?s=20", "https://x.com/jack"],
    ["twitter", "http://www.twitter.com/jack/", "https://x.com/jack"],
    ["twitter", "https://mobile.twitter.com/jack", "https://x.com/jack"],
    ["twitter", "m.twitter.com/jack/", "https://x.com/jack"],
    ["linkedin", "pela", "https://www.linkedin.com/in/pela"],
    ["linkedin", "@pela", "https://www.linkedin.com/in/pela"],
    ["linkedin", "in/pela", "https://www.linkedin.com/in/pela"],
    ["linkedin", "company/huevsite", "https://www.linkedin.com/company/huevsite"],
    ["linkedin", "https://ar.linkedin.com/in/pela/?trk=public", "https://www.linkedin.com/in/pela"],
    ["linkedin", "https://m.linkedin.com/company/huevsite/", "https://www.linkedin.com/company/huevsite"],
    ["linkedin", "http://www.linkedin.com/in/pela", "https://www.linkedin.com/in/pela"],
    ["linkedin", "https://linkedin.com/in/company/huevsite", "https://www.linkedin.com/company/huevsite"],
    ["github", "@Octocat", "https://github.com/Octocat"],
    ["github", "https://www.github.com/Octocat/", "https://github.com/Octocat"],
    ["github", "http://github.com/Octocat?tab=repositories", "https://github.com/Octocat"],
    ["youtube", "@Canal", "https://www.youtube.com/@Canal"],
    ["youtube", "https://m.youtube.com/@Canal/", "https://www.youtube.com/@Canal"],
    ["youtube", "https://www.youtube.com/channel/UC1234567890123456789012", "https://www.youtube.com/channel/UC1234567890123456789012"],
    ["youtube", "https://youtube.com/c/CanalViejo?si=1", "https://www.youtube.com/c/CanalViejo"],
    ["youtube", "https://www.youtube.com/user/CanalViejo/", "https://www.youtube.com/user/CanalViejo"],
    ["youtube", "channel/UC1234567890123456789012", "https://www.youtube.com/channel/UC1234567890123456789012"],
    ["instagram", "@ana.builds", "https://www.instagram.com/ana.builds"],
    ["instagram", "https://m.instagram.com/ana.builds/?hl=es", "https://www.instagram.com/ana.builds"],
    ["instagram", "http://instagram.com/ana.builds/", "https://www.instagram.com/ana.builds"],
    ["tiktok", "@ana.builds", "https://www.tiktok.com/@ana.builds"],
    ["tiktok", "https://www.tiktok.com/@ana.builds?lang=es", "https://www.tiktok.com/@ana.builds"],
    ["tiktok", "https://m.tiktok.com/@ana.builds/", "https://www.tiktok.com/@ana.builds"],
    ["threads", "@ana.builds", "https://www.threads.net/@ana.builds"],
    ["threads", "https://www.threads.com/@ana.builds/", "https://www.threads.net/@ana.builds"],
    ["bluesky", "@ana.bsky.social", "https://bsky.app/profile/ana.bsky.social"],
    ["bluesky", "ana.bsky.social", "https://bsky.app/profile/ana.bsky.social"],
    ["bluesky", "https://bsky.app/profile/ana.bsky.social", "https://bsky.app/profile/ana.bsky.social"],
    ["website", "https://ejemplo.com/ruta?x=1", "https://ejemplo.com/ruta?x=1"],
    ["website", "http://ejemplo.com", "http://ejemplo.com"],
    ["email", "Hola@Mail.com", "mailto:Hola@mail.com"],
    ["email", "mailto:hola@mail.com?subject=hey", "mailto:hola@mail.com"],
    ["website", "hola@mail.com", "mailto:hola@mail.com"],
    ["discord", "https://discord.gg/huev", "https://discord.gg/huev"],
    ["discord", "https://discord.com/invite/huev", "https://discord.gg/huev"],
    ["discord", "https://discord.com/users/12345678901234567", "https://discord.com/users/12345678901234567"],
    ["discord", "user.name", "https://discord.com/users/user.name"],
    ["telegram", "@canalhuev", "https://t.me/canalhuev"],
    ["twitch", "https://twitch.tv/ana_tv/", "https://www.twitch.tv/ana_tv"],
    ["farcaster", "https://warpcast.com/ana", "https://warpcast.com/ana"],
  ];
  for (const [platform, raw, expected] of cases) {
    assert.equal(urlOf(platform, raw), expected, `${platform} ← ${raw}`);
  }
});

test("rechaza posts, videos, repos, javascript y hosts cruzados", () => {
  fails("twitter", "https://x.com/jack/status/1", "post");
  fails("twitter", "este usuario es demasiado largo", "invalid");
  fails("linkedin", "https://www.youtube.com/@canal", "wrong_network");
  fails("linkedin", "https://linkedin.com/in/https://evil.example/phish", "invalid");
  fails("github", "https://github.com/octocat/hello", "repo");
  fails("github", "https://github.com/https://github.com/octocat/hello", "repo");
  fails("youtube", "https://www.youtube.com/watch?v=abc", "video");
  fails("youtube", "https://youtu.be/abc", "video");
  fails("youtube", "https://youtube.com/@https://www.youtube.com/watch?v=abc", "video");
  fails("instagram", "https://instagram.com/p/ABC123", "post");
  fails("tiktok", "https://vm.tiktok.com/ZMxxxx/", "short_link");
  fails("bluesky", "ana", "invalid");
  fails("website", "javascript:alert(1)", "bad_website");
  fails("website", "no es un link", "bad_website");
  fails("email", "hola", "bad_email");
  fails("mastodon", "https://example.com", "unsupported");
});

test("el guardado estricto bloquea inválidos y el render los esconde", () => {
  const links = [
    { platform: "linkedin", handle: "https://www.linkedin.com/in/x ", url: "https://linkedin.com/in/https://www.linkedin.com/in/x/" },
    { platform: "youtube", url: "" },
    { platform: "website", url: "javascript:alert(1)", label: "malo" },
  ];
  assert.equal(socialDraftsBlockSave(links), true);
  const strict = commitSocialLinks(links);
  assert.equal(strict.ok, false);
  const visible = readSocialLinks(links);
  assert.deepEqual(visible.map((link) => link.url), ["https://www.linkedin.com/in/x"]);
  const dropped = normalizeBlockData("social", { links }, "drop");
  assert.equal(dropped.ok, true);
  if (dropped.ok) {
    assert.deepEqual(
      (dropped.data as { links: { url: string }[] }).links.map((link) => link.url),
      ["https://www.linkedin.com/in/x"],
    );
  }
});

test("github_handle y el bloque de GitHub quedan en el usuario", () => {
  assert.equal(canonicalGithubUsername("https://github.com/octocat/"), "octocat");
  assert.equal(canonicalGithubUsername("  octocat "), "octocat");
  assert.equal(canonicalGithubUsername("https://github.com/octocat/repo"), null);
  const block = normalizeBlockData("github", { username: "https://github.com/octocat " }, "strict");
  assert.equal(block.ok, true);
  if (block.ok) assert.equal((block.data as { username: string }).username, "octocat");
});

test("un link que ya es canónico no se marca como cambio", () => {
  const plan = planSocialLinks([
    { platform: "twitter", handle: "jack", url: "https://x.com/jack" },
    { platform: "linkedin", handle: "company/huevsite", url: "https://www.linkedin.com/company/huevsite" },
  ]);
  assert.equal(plan.changed, false);
  assert.equal(plan.fixed.length, 0);
  assert.equal(plan.unfixable.length, 0);
});

test("un invite de Discord sigue siendo invite en la segunda pasada", () => {
  const inputs = [
    "https://discord.gg/huev",
    "https://discord.com/invite/huev",
    "http://discord.gg/huev/",
    "https://www.discord.com/invite/huev?event=1",
    "discord.gg/huev",
  ];
  for (const raw of inputs) {
    const once = normalizeSocialInput("discord", raw);
    assert.equal(once.ok, true, raw);
    if (!once.ok) continue;
    assert.equal(once.url, "https://discord.gg/huev", raw);
    assert.equal(once.url.includes("/users/"), false, raw);
    const fromUrl = normalizeSocialInput(once.platform, once.url);
    const fromHandle = normalizeSocialInput(once.platform, once.handle);
    assert.deepEqual(fromUrl, once, `url ${raw}`);
    assert.deepEqual(fromHandle, once, `handle ${raw}`);
  }

  // Lo que dejó la primera versión: handle = código, url = invite.
  const legacy = planSocialLinks([
    { platform: "discord", handle: "huev", url: "https://discord.gg/huev" },
    { platform: "discord", handle: "huev", url: "https://discord.com/invite/huev" },
    { platform: "discord", handle: "huev", url: "https://discord.com/users/huev" },
  ]);
  assert.deepEqual(
    legacy.links.map((link) => link.url),
    ["https://discord.gg/huev", "https://discord.gg/huev", "https://discord.com/users/huev"],
  );
  const again = planSocialLinks(legacy.links);
  assert.equal(again.changed, false);
  assert.deepEqual(
    again.links.map((link) => link.url),
    legacy.links.map((link) => link.url),
  );
});

test("normalizar dos veces es igual a una, en cada plataforma", () => {
  const samples: Array<[string, string]> = [
    ["twitter", "@Jack"],
    ["twitter", "https://twitter.com/jack/"],
    ["twitter", "https://x.com/intent/follow?screen_name=jack"],
    ["linkedin", "pela"],
    ["linkedin", "company/huevsite"],
    ["linkedin", "school/huevsite"],
    ["linkedin", "https://ar.linkedin.com/in/pela/?trk=public"],
    ["github", "https://github.com/Octocat/"],
    ["youtube", "@Canal.Viejo"],
    ["youtube", "https://www.youtube.com/channel/UC1234567890123456789012"],
    ["youtube", "https://youtube.com/c/CanalViejo"],
    ["youtube", "https://www.youtube.com/user/CanalViejo/"],
    ["instagram", "@ana.builds"],
    ["instagram", "ana.builds"],
    ["tiktok", "@ana.builds"],
    ["tiktok", "https://www.tiktok.com/@ana.builds"],
    ["threads", "@ana.builds"],
    ["threads", "https://www.threads.com/@ana.builds/"],
    ["bluesky", "@Ana.Bsky.Social"],
    ["bluesky", "did:plc:abcdefghijklmnopqrstuvwx"],
    ["website", "https://ejemplo.com/ruta?x=1"],
    ["website", "example.com"],
    ["website", "http://ejemplo.com"],
    ["website", "hola@mail.com"],
    ["email", "Hola@Mail.com"],
    ["email", "mailto:hola@mail.com?subject=hey"],
    ["discord", "https://discord.gg/huev"],
    ["discord", "https://discord.com/invite/huev"],
    ["discord", "user.name"],
    ["discord", "https://discord.com/users/12345678901234567"],
    ["telegram", "https://t.me/s/canalhuev"],
    ["telegram", "@canalhuev"],
    ["twitch", "https://twitch.tv/ana_tv/"],
    ["farcaster", "https://farcaster.xyz/ana"],
    ["farcaster", "https://warpcast.com/ana"],
  ];
  for (const [platform, raw] of samples) {
    const once = normalizeSocialInput(platform, raw);
    assert.equal(once.ok, true, `${platform} ${raw} ${once.ok ? "" : once.error}`);
    if (!once.ok) continue;
    assertRoundTrip(once, `${platform} ${raw}`);
    const first = planSocialLinks([{ platform, url: raw, handle: raw }]);
    assert.equal(first.unfixable.length, 0, `${platform} ${raw}`);
    const second = planSocialLinks(first.links);
    assert.equal(second.changed, false, `${platform} ${raw}`);
    assert.equal(second.fixed.length, 0, `${platform} ${raw}`);
    assert.deepEqual(second.links, first.links, `${platform} ${raw}`);
  }
});

function assertRoundTrip(once: NormalizeSuccess, label: string) {
  const fromUrl = normalizeSocialInput(once.platform, once.url);
  const fromHandle = normalizeSocialInput(once.platform, once.handle);
  assert.deepEqual(fromUrl, once, `url ${label}`);
  assert.deepEqual(fromHandle, once, `handle ${label}`);
}

test("el plan del backfill conserva el link que no puede normalizar", () => {
  const broken = {
    platform: "twitter",
    url: "https://x.com/jack/status/1",
    handle: "jack/status/1",
    label: "post",
  };
  const plan = planSocialLinks([
    { platform: "github", handle: "octocat ", url: "https://github.com/octocat" },
    broken,
  ]);
  assert.equal(plan.changed, true);
  assert.equal(plan.fixed.length, 1);
  assert.equal(plan.unfixable.length, 1);
  assert.equal(plan.unfixable[0]?.platform, "twitter");
  assert.equal(plan.unfixable[0]?.reason.length > 0, true);
  assert.equal(plan.links.length, 2);
  assert.equal(plan.links[0]?.url, "https://github.com/octocat");
  assert.deepEqual(plan.links[1], broken);

  const onlyBroken = planSocialLinks([broken]);
  assert.equal(onlyBroken.changed, false);
  assert.deepEqual(onlyBroken.links, [broken]);
  assert.equal(onlyBroken.unfixable.length, 1);
  assert.deepEqual(readSocialLinks([broken]), []);

  const again = planSocialLinks(plan.links);
  assert.equal(again.changed, false);
  assert.deepEqual(again.links[1], broken);
  assert.equal(again.links[0]?.url, "https://github.com/octocat");
});
