export function mapSameSite(sameSite) {
  switch (sameSite) {
    case "strict":
      return "Strict";
    case "no_restriction":
      return "None";
    case "lax":
    case "unspecified":
    default:
      return "Lax";
  }
}

export function toWebCookie(cookie) {
  const output = {
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    httpOnly: Boolean(cookie.httpOnly),
    secure: Boolean(cookie.secure),
    sameSite: mapSameSite(cookie.sameSite),
  };

  if (Number.isFinite(cookie.expirationDate)) {
    output.expires = cookie.expirationDate;
  }

  return output;
}

function partitionIdentity(cookie) {
  const key = cookie.partitionKey;
  if (!key) {
    return "";
  }

  return [
    key.topLevelSite ?? "",
    key.hasCrossSiteAncestor === true ? "1" : "0",
  ].join("|");
}

export function cookieIdentity(cookie) {
  return [
    cookie.storeId ?? "",
    cookie.domain ?? "",
    cookie.path ?? "",
    cookie.name ?? "",
    partitionIdentity(cookie),
  ].join("\u0000");
}

export function mergeCookies(...groups) {
  const merged = new Map();

  for (const group of groups) {
    for (const cookie of group ?? []) {
      const key = cookieIdentity(cookie);
      if (!merged.has(key)) {
        merged.set(key, cookie);
      }
    }
  }

  return [...merged.values()];
}

export function buildExport(cookies, origin, localStorageEntries = null) {
  return {
    cookies: cookies.map(toWebCookie),
    origins:
      localStorageEntries === null
        ? []
        : [
            {
              origin,
              localStorage: localStorageEntries,
            },
          ],
  };
}

export function makeFileName(hostname) {
  const safeHost = hostname.replace(/[^a-zA-Z0-9.-]/g, "_") || "website";
  const date = new Date().toISOString().slice(0, 10);
  return `jv-web-context-${safeHost}-${date}.json`;
}
