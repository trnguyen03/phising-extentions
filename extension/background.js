import { evaluateUrl, shouldBypassBackend } from './heuristics.js';

const DEFAULT_CONFIG = {
  backendUrl: 'http://localhost:4000/api/check-url',
  warningThreshold: 0.35,
  dangerThreshold: 0.6
};

let runtimeConfig = { ...DEFAULT_CONFIG };

chrome.storage.sync.get(DEFAULT_CONFIG).then((config) => {
  runtimeConfig = { ...runtimeConfig, ...config };
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    lastCheck: null,
    lastVerdict: 'unknown'
  });
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url || tab.url.startsWith('chrome://')) {
    return;
  }

  const heuristicResult = evaluateUrl(tab.url);
  const resultPayload = {
    url: tab.url,
    source: 'heuristic',
    ...heuristicResult
  };

  if (shouldBypassBackend(heuristicResult.verdict)) {
    await updateStateAndNotify(tabId, resultPayload);
    return;
  }

  try {
    const response = await fetch(runtimeConfig.backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: tab.url,
        heuristicVerdict: heuristicResult.verdict,
        heuristicScore: heuristicResult.score,
        heuristicFeatures: heuristicResult.features
      })
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const backendData = await response.json();
    await updateStateAndNotify(tabId, {
      url: tab.url,
      source: 'backend',
      heuristic: heuristicResult,
      backend: backendData
    });
  } catch (error) {
    await updateStateAndNotify(tabId, {
      url: tab.url,
      source: 'error',
      heuristic: heuristicResult,
      error: error.message
    });
  }
});

async function updateStateAndNotify(tabId, payload) {
  const verdict = resolveVerdict(payload);
  await chrome.storage.local.set({
    lastCheck: payload,
    lastVerdict: verdict,
    lastUpdatedAt: new Date().toISOString()
  });
  chrome.tabs.sendMessage(tabId, { type: 'PHISHGUARD_RESULT', payload: { ...payload, verdict } });
  chrome.runtime.sendMessage({ type: 'PHISHGUARD_RESULT', payload: { ...payload, verdict } });
}

function resolveVerdict(payload) {
  if (payload?.backend?.score !== undefined) {
    const { score } = payload.backend;
    if (score >= runtimeConfig.dangerThreshold) {
      return 'danger';
    }
    if (score >= runtimeConfig.warningThreshold) {
      return 'warning';
    }
  }
  return payload?.backend?.verdict ?? payload?.verdict ?? payload?.heuristic?.verdict ?? 'unknown';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PHISHGUARD_GET_STATE') {
    chrome.storage.local.get(['lastCheck', 'lastVerdict', 'lastUpdatedAt']).then(sendResponse);
    return true;
  }
  if (request.type === 'PHISHGUARD_CONFIG_UPDATED' && request.config) {
    runtimeConfig = { ...runtimeConfig, ...request.config };
    sendResponse({ success: true });
    return true;
  }
  if (request.type === 'PHISHGUARD_REPORT_URL') {
    fetch('http://localhost:4000/api/report-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: request.url, notes: request.notes ?? '' })
    })
      .then((res) => res.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
  return false;
});
