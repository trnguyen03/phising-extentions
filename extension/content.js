const bannerId = "phishguard-banner";

function createBanner() {
  const existing = document.getElementById(bannerId);
  if (existing) return existing;

  const container = document.createElement("div");
  container.id = bannerId;
  container.style.position = "fixed";
  container.style.bottom = "24px";
  container.style.right = "24px";
  container.style.zIndex = 9999;
  container.style.padding = "16px 20px";
  container.style.borderRadius = "12px";
  container.style.boxShadow = "0 18px 35px rgba(15, 23, 42, 0.35)";
  container.style.fontFamily = "Inter, system-ui, sans-serif";
  container.style.color = "#0f172a";
  container.style.minWidth = "240px";
  container.style.maxWidth = "360px";
  container.style.display = "grid";
  container.style.gap = "8px";

  const title = document.createElement("strong");
  title.className = "phishguard-title";
  title.textContent = "Đang quét trang...";
  title.style.fontSize = "16px";

  const details = document.createElement("span");
  details.className = "phishguard-details";
  details.textContent = "Chúng tôi đang kiểm tra URL để bảo vệ bạn.";
  details.style.fontSize = "13px";
  details.style.lineHeight = "1.5";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "Ẩn";
  closeBtn.style.all = "unset";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.justifySelf = "flex-end";
  closeBtn.style.fontSize = "13px";
  closeBtn.style.fontWeight = "600";

  closeBtn.addEventListener("click", () => {
    container.remove();
  });

  container.append(title, details, closeBtn);
  document.body.appendChild(container);
  return container;
}

function updateBanner(result) {
  const banner = createBanner();
  const title = banner.querySelector(".phishguard-title");
  const details = banner.querySelector(".phishguard-details");
  banner.style.background =
    result.classification === "danger"
      ? "linear-gradient(135deg, rgba(248, 113, 113, 0.9), rgba(220, 38, 38, 0.95))"
      : result.classification === "suspicious"
      ? "linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(249, 115, 22, 0.95))"
      : "linear-gradient(135deg, rgba(134, 239, 172, 0.9), rgba(22, 163, 74, 0.95))";

  title.textContent =
    result.classification === "danger"
      ? "Cảnh báo nguy hiểm!"
      : result.classification === "suspicious"
      ? "Trang web đáng ngờ"
      : "Trang web an toàn";

  details.textContent = `${Math.round(result.confidence * 100)}% chắc chắn. ${
    result.reasons[0] || "Không có dấu hiệu bất thường."
  }`;
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "content:update-status") {
    updateBanner(message.result);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  createBanner();
});
