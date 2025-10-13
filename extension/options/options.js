const DEFAULT_CONFIG = {
  backendUrl: 'http://localhost:4000/api/check-url',
  warningThreshold: 0.35,
  dangerThreshold: 0.6
};

async function loadConfig() {
  const stored = await chrome.storage.sync.get(DEFAULT_CONFIG);
  document.getElementById('backend-url').value = stored.backendUrl;
  document.getElementById('warning-threshold').value = stored.warningThreshold;
  document.getElementById('danger-threshold').value = stored.dangerThreshold;
}

async function saveConfig() {
  const backendUrl = document.getElementById('backend-url').value || DEFAULT_CONFIG.backendUrl;
  const warningThreshold = Number(document.getElementById('warning-threshold').value) || DEFAULT_CONFIG.warningThreshold;
  const dangerThreshold = Number(document.getElementById('danger-threshold').value) || DEFAULT_CONFIG.dangerThreshold;

  if (warningThreshold >= dangerThreshold) {
    setStatus('Ngưỡng cảnh báo phải nhỏ hơn ngưỡng nguy hiểm.', true);
    return;
  }

  await chrome.storage.sync.set({ backendUrl, warningThreshold, dangerThreshold });
  setStatus('Đã lưu cấu hình.');

  chrome.runtime.sendMessage({
    type: 'PHISHGUARD_CONFIG_UPDATED',
    config: { backendUrl, warningThreshold, dangerThreshold }
  });
}

function setStatus(message, isError = false) {
  const el = document.getElementById('status-message');
  el.textContent = message;
  el.style.color = isError ? '#c0392b' : '#27ae60';
}

document.getElementById('save-button').addEventListener('click', saveConfig);
loadConfig();
