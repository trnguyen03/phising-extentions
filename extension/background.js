const DEFAULT_SETTINGS = {
  autoScan: true,
  autoBlock: false,
  apiEndpoint: "http://localhost:5000",
  sensitivity: 2,
  whitelist: ["example.com"],
};

let latestResults = {};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set(DEFAULT_SETTINGS);
});

function normalizeUrl(url) {
  try {
    return new URL(url).href;
  } catch (error) {
    return url;
  }
}

function isIpAddress(hostname) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

function containsPunycode(hostname) {
  return hostname.includes("xn--");
}

function extractHeuristics(url) {
  const result = {
    reasons: [],
    scoreModifiers: 0,
  };
  try {
    const parsed = new URL(url);
    if (isIpAddress(parsed.hostname)) {
      result.reasons.push("URL sử dụng địa chỉ IP thay vì tên miền.");
      result.scoreModifiers += 0.25;
    }
    if (containsPunycode(parsed.hostname)) {
      result.reasons.push("Tên miền chứa punycode.");
      result.scoreModifiers += 0.2;
    }
    if (/[\W_]@/.test(parsed.hostname)) {
      result.reasons.push("Tên miền chứa ký tự @ bất thường.");
      result.scoreModifiers += 0.15;
    }
    if (parsed.pathname.length > 80) {
      result.reasons.push("Đường dẫn URL quá dài.");
      result.scoreModifiers += 0.1;
    }
    const suspiciousKeywords = ["login", "verify", "secure", "update", "password"];
    if (suspiciousKeywords.some((keyword) => url.toLowerCase().includes(keyword))) {
      result.reasons.push("URL chứa từ khóa nhạy cảm.");
      result.scoreModifiers += 0.1;
    }
  } catch (error) {
    result.reasons.push("Không thể phân tích URL.");
    result.scoreModifiers += 0.2;
  }
  return result;
}

async function checkUrlWithBackend(url) {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const endpoint = `${settings.apiEndpoint.replace(/\/$/, "")}/api/check-url`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    return response.json();
  } catch (error) {
    console.error("Backend error", error);
    return {
      classification: "suspicious",
      confidence: 0.5,
      reasons: ["Không kết nối được đến máy chủ kiểm tra. Sử dụng heuristic nội bộ."],
    };
  }
}

async function evaluateUrl(url) {
  const normalized = normalizeUrl(url);
  const heuristics = extractHeuristics(normalized);
  const backendResult = await checkUrlWithBackend(normalized);
  const combinedConfidence = Math.min(
    1,
    Math.max(0, backendResult.confidence + heuristics.scoreModifiers)
  );

  const classification =
    combinedConfidence > 0.75
      ? "danger"
      : combinedConfidence > 0.55
      ? "suspicious"
      : "safe";

  const reasons = [...(backendResult.reasons || []), ...heuristics.reasons];

  return { classification, confidence: combinedConfidence, reasons, url: normalized };
}

async function handleTabUpdate(tabId, changeInfo, tab) {
  if (changeInfo.status !== "complete" || !tab.url) return;
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  if (!settings.autoScan) return;

  const url = tab.url;
  const { whitelist = [] } = settings;
  const hostname = (() => {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return null;
    }
  })();

  if (hostname && whitelist.includes(hostname)) {
    latestResults[tabId] = {
      classification: "safe",
      confidence: 0.99,
      reasons: ["Tên miền nằm trong danh sách trắng"],
      url,
    };
    chrome.tabs.sendMessage(tabId, {
      action: "content:update-status",
      result: latestResults[tabId],
    });
    return;
  }

  const result = await evaluateUrl(url);
  latestResults[tabId] = result;
  chrome.tabs.sendMessage(tabId, { action: "content:update-status", result });

  if (result.classification === "danger" && settings.autoBlock) {
    chrome.tabs.update(tabId, {
      url: chrome.runtime.getURL(
        `warning/warning.html?severity=danger&reasons=${encodeURIComponent(
          JSON.stringify(result.reasons)
        )}`
      ),
    });
  }
}

chrome.tabs.onUpdated.addListener(handleTabUpdate);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "popup:request-status": {
      const tabId = sender.tab?.id;
      if (tabId && latestResults[tabId]) {
        sendResponse(latestResults[tabId]);
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (activeTab && latestResults[activeTab.id]) {
            sendResponse(latestResults[activeTab.id]);
          }
        });
        return true;
      }
      break;
    }
    case "popup:toggle-real-time": {
      chrome.storage.sync.set({ autoScan: message.enabled });
      break;
    }
    case "popup:report-current": {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tab = tabs[0];
        if (!tab?.url) return;
        const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
        const endpoint = `${settings.apiEndpoint.replace(/\/$/, "")}/api/report-url`;
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: tab.url }),
        }).catch((error) => console.error("Report error", error));
      });
      break;
    }
    case "settings:add-whitelist": {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
        const whitelist = new Set(settings.whitelist || []);
        whitelist.add(message.domain);
        const updated = Array.from(whitelist);
        chrome.storage.sync.set({ whitelist: updated }, () => {
          chrome.runtime.sendMessage({
            action: "settings:update-whitelist",
            whitelist: updated,
          });
        });
      });
      break;
    }
    case "settings:remove-whitelist": {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
        const whitelist = new Set(settings.whitelist || []);
        whitelist.delete(message.domain);
        const updated = Array.from(whitelist);
        chrome.storage.sync.set({ whitelist: updated }, () => {
          chrome.runtime.sendMessage({
            action: "settings:update-whitelist",
            whitelist: updated,
          });
        });
      });
      break;
    }
    case "settings:reset": {
      chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
        sendResponse(DEFAULT_SETTINGS);
      });
      return true;
    }
    default:
      break;
  }
  return undefined;
});
