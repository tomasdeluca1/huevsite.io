import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { BlogAuthorAvatar } from "../components/blog/BlogAuthorAvatar";

test("the platform blog avatar renders a small 2× WebP at 40 pixels", async () => {
  const markup = renderToStaticMarkup(
    createElement(BlogAuthorAvatar, { src: "/huevsite-avatar.png", name: "huevsite.io" }),
  );
  assert.match(markup, /src="\/huevsite-avatar-80\.webp"/);
  assert.match(markup, /width="40"/);
  assert.match(markup, /height="40"/);
  assert.match(markup, /alt="huevsite\.io"/);

  const { format, width, height } = await sharp("public/huevsite-avatar-80.webp").metadata();
  assert.deepEqual({ format, width, height }, { format: "webp", width: 80, height: 80 });
});

test("third-party builder avatars remain unoptimized", () => {
  const markup = renderToStaticMarkup(
    createElement(BlogAuthorAvatar, { src: "https://example.com/avatar.png", name: "Builder" }),
  );
  assert.match(markup, /src="https:\/\/example\.com\/avatar\.png"/);
  assert.doesNotMatch(markup, /srcSet=/i);
});
