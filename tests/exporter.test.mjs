import assert from "node:assert/strict";

import {
  buildExport,
  mapSameSite,
  mergeCookies,
  toWebCookie,
} from "../extension/exporter.mjs";

assert.equal(mapSameSite("strict"), "Strict");
assert.equal(mapSameSite("lax"), "Lax");
assert.equal(mapSameSite("no_restriction"), "None");

const sessionCookie = toWebCookie({
  name: "session",
  value: "secret",
  domain: "example.com",
  path: "/",
  httpOnly: true,
  secure: true,
  sameSite: "lax",
});

assert.equal("expires" in sessionCookie, false);

const persistentCookie = toWebCookie({
  name: "persistent",
  value: "value",
  domain: ".example.com",
  path: "/",
  expirationDate: 2000000000.25,
  httpOnly: false,
  secure: false,
  sameSite: "strict",
});

assert.equal(persistentCookie.expires, 2000000000.25);
assert.equal(persistentCookie.secure, false);

const secure = {
  name: "auth",
  value: "a",
  domain: "example.com",
  path: "/",
  storeId: "0",
  secure: true,
};

const regular = {
  name: "preference",
  value: "b",
  domain: "example.com",
  path: "/",
  storeId: "0",
  secure: false,
};

const merged = mergeCookies([secure], [secure], [regular]);
assert.equal(merged.length, 2);
assert.equal(merged.some((cookie) => cookie.secure === false), true);

const defaultExport = buildExport([secure, regular], "https://example.com");
assert.deepEqual(defaultExport.origins, []);

const withStorage = buildExport(
  [secure],
  "https://example.com",
  [{ name: "theme", value: "dark" }],
);
assert.deepEqual(withStorage.origins, [
  {
    origin: "https://example.com",
    localStorage: [{ name: "theme", value: "dark" }],
  },
]);

console.log("JV-web-tools exporter tests passed");
