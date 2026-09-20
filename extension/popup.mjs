"use strict";

import {
  buildExport,
  makeFileName,
  mergeCookies,
} from "./exporter.mjs";

const ui = {
  site: document.querySelector("#site"),
  includeLocalStorage: document.querySelector("#include-local-storage"),
  exportButton: document.querySelector("#export"),
  status: document.querySelector("#status"),
  result: document.querySelector("#result"),
  summary: document.querySelector("#summary"),
  download: document.querySelector("#download"),
};

let exportedData = null;
let exportedFileName = "jv-web-context.json";

function setStatus(message, type = "") {
  ui.status.textContent = message;
  ui.status.className = type ? "status " + type : "status";
}

function setBusy(isBusy) {
  ui.exportButton.disabled = isBusy;
  ui.download.disabled = isBusy;
}

function parseSupportedUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Open a normal http:// or https:// website first.");
  }
  return url;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const tab = tabs[0];

  if (!tab?.id || !tab.url) {
    throw new Error("Could not access the active browser tab.");
  }

  return tab;
}

function permissionPatterns(url) {
  return [
    "http://" + url.hostname + "/*",
    "https://" + url.hostname + "/*",
  ];
}

async function ensureCookiePermissions(url) {
  const origins = permissionPatterns(url);
  const alreadyGranted = await chrome.permissions.contains({ origins });

  if (alreadyGranted) {
    return;
  }

  const granted = await chrome.permissions.request({ origins });
  if (!granted) {
    throw new Error(
      "Site permission was not granted for " + url.hostname + ".",
    );
  }
}

async function cookieStoreIdForTab(tabId) {
  const stores = await chrome.cookies.getAllCookieStores();
  return stores.find((store) => store.tabIds.includes(tabId))?.id ?? null;
}

function cookieQuery(details, storeId) {
  return storeId === null ? details : { ...details, storeId };
}

async function readCompleteCookieSet(url, tabId) {
  const storeId = await cookieStoreIdForTab(tabId);
  const path = url.pathname || "/";
  const httpUrl = "http://" + url.host + path;
  const httpsUrl = "https://" + url.host + path;

  const [domainCookies, httpCookies, httpsCookies] = await Promise.all([
    chrome.cookies.getAll(
      cookieQuery({ domain: url.hostname }, storeId),
    ),
    chrome.cookies.getAll(
      cookieQuery({ url: httpUrl }, storeId),
    ),
    chrome.cookies.getAll(
      cookieQuery({ url: httpsUrl }, storeId),
    ),
  ]);

  return mergeCookies(domainCookies, httpsCookies, httpCookies);
}

async function readLocalStorage(tabId) {
  const execution = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const entries = [];

      for (let index = 0; index < localStorage.length; index += 1) {
        const name = localStorage.key(index);
        if (name === null) {
          continue;
        }

        entries.push({
          name,
          value: localStorage.getItem(name) ?? "",
        });
      }

      return entries;
    },
  });

  return execution[0]?.result ?? [];
}

function downloadJson() {
  if (!exportedData) {
    return;
  }

  const blob = new Blob(
    [JSON.stringify(exportedData, null, 2)],
    { type: "application/json" },
  );
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = exportedFileName;
  anchor.click();

  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}

async function exportCurrentSite() {
  setBusy(true);
  ui.result.hidden = true;
  setStatus("Requesting access to the current website...");

  try {
    const tab = await getActiveTab();
    const url = parseSupportedUrl(tab.url);

    await ensureCookiePermissions(url);
    setStatus("Reading website cookies...");

    const cookies = await readCompleteCookieSet(url, tab.id);

    let localStorageEntries = null;
    if (ui.includeLocalStorage.checked) {
      setStatus("Reading localStorage...");
      localStorageEntries = await readLocalStorage(tab.id);
    }

    exportedData = buildExport(
      cookies,
      url.origin,
      localStorageEntries,
    );
    exportedFileName = makeFileName(url.hostname);

    const secureCount = cookies.filter((cookie) => cookie.secure).length;
    const regularCount = cookies.length - secureCount;
    const storageText =
      localStorageEntries === null
        ? "localStorage not included"
        : localStorageEntries.length + " localStorage entries";

    ui.summary.textContent =
      cookies.length + " cookies captured (" +
      secureCount + " Secure, " + regularCount +
      " regular); " + storageText + ".";

    ui.result.hidden = false;
    setStatus(
      "Export created locally. No data was uploaded.",
      "success",
    );
  } catch (error) {
    exportedData = null;
    setStatus(
      error instanceof Error ? error.message : String(error),
      "error",
    );
  } finally {
    setBusy(false);
  }
}

async function initialize() {
  try {
    const tab = await getActiveTab();
    const url = parseSupportedUrl(tab.url);
    ui.site.textContent = url.origin;
    setStatus("Ready.");
  } catch (error) {
    ui.site.textContent = "Unsupported page";
    ui.exportButton.disabled = true;
    setStatus(
      error instanceof Error ? error.message : String(error),
      "error",
    );
  }
}

ui.exportButton.addEventListener("click", exportCurrentSite);
ui.download.addEventListener("click", downloadJson);

initialize();
