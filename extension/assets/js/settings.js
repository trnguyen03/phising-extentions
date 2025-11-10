const autoScan = document.getElementById("auto-scan");
const autoBlock = document.getElementById("auto-block");
const apiEndpoint = document.getElementById("api-endpoint");
const sensitivity = document.getElementById("sensitivity");
const whitelistInput = document.getElementById("whitelist-domain");
const whitelistList = document.getElementById("whitelist");
const addWhitelistBtn = document.getElementById("add-whitelist");
const resetBtn = document.getElementById("reset-settings");
const saveBtn = document.getElementById("save-settings");

function renderWhitelist(domains) {
  whitelistList.innerHTML = "";
  domains.forEach((domain) => {
    const item = document.createElement("li");
    item.className = "chip";
    item.innerHTML = `
      ${domain}
      <button class="chip__remove" aria-label="Remove" data-domain="${domain}">×</button>
    `;
    whitelistList.appendChild(item);
  });
}

function loadSettings() {
  chrome.storage.sync.get(
    {
      autoScan: true,
      autoBlock: false,
      apiEndpoint: "https://api.phishguard.local",
      sensitivity: 2,
      whitelist: ["example.com"],
    },
    (settings) => {
      autoScan.checked = settings.autoScan;
      autoBlock.checked = settings.autoBlock;
      apiEndpoint.value = settings.apiEndpoint;
      sensitivity.value = settings.sensitivity;
      renderWhitelist(settings.whitelist);
    }
  );
}

function persistSettings() {
  chrome.storage.sync.set(
    {
      autoScan: autoScan.checked,
      autoBlock: autoBlock.checked,
      apiEndpoint: apiEndpoint.value,
      sensitivity: Number(sensitivity.value),
    },
    () => {
      saveBtn.textContent = "Đã lưu";
      setTimeout(() => (saveBtn.textContent = "Lưu thay đổi"), 1600);
    }
  );
}

addWhitelistBtn?.addEventListener("click", () => {
  const domain = whitelistInput.value.trim();
  if (!domain) return;
  chrome.runtime.sendMessage({ action: "settings:add-whitelist", domain });
  whitelistInput.value = "";
});

whitelistList?.addEventListener("click", (event) => {
  const target = event.target;
  if (target.matches(".chip__remove")) {
    const domain = target.dataset.domain;
    chrome.runtime.sendMessage({ action: "settings:remove-whitelist", domain });
  }
});

resetBtn?.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "settings:reset" }, loadSettings);
});

saveBtn?.addEventListener("click", persistSettings);

document.addEventListener("DOMContentLoaded", loadSettings);

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "settings:update-whitelist") {
    renderWhitelist(message.whitelist);
  }
});
