const bannerId = 'phishguard-warning-banner';

function removeBanner() {
  const banner = document.getElementById(bannerId);
  if (banner) {
    banner.remove();
  }
}

function createBanner(verdict, reasons = []) {
  removeBanner();

  if (verdict === 'safe' || verdict === 'unknown') {
    return;
  }

  const banner = document.createElement('div');
  banner.id = bannerId;
  banner.style.position = 'fixed';
  banner.style.top = '0';
  banner.style.left = '0';
  banner.style.right = '0';
  banner.style.zIndex = '2147483647';
  banner.style.padding = '16px';
  banner.style.display = 'flex';
  banner.style.flexDirection = 'column';
  banner.style.alignItems = 'center';
  banner.style.fontFamily = 'sans-serif';
  banner.style.color = '#fff';
  banner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
  banner.style.background = verdict === 'danger' ? '#c0392b' : '#f39c12';

  const title = document.createElement('strong');
  title.textContent = verdict === 'danger' ? 'Nguy hiểm: Trang web có thể là phishing!' : 'Cảnh báo: Trang web đáng ngờ';
  title.style.fontSize = '16px';
  title.style.marginBottom = '8px';

  const list = document.createElement('ul');
  list.style.margin = '0';
  list.style.padding = '0 16px';
  list.style.listStyle = 'disc';

  reasons.forEach((reason) => {
    const li = document.createElement('li');
    li.textContent = reason;
    li.style.marginBottom = '4px';
    list.appendChild(li);
  });

  const close = document.createElement('button');
  close.textContent = 'Bỏ qua cảnh báo';
  close.style.marginTop = '12px';
  close.style.padding = '8px 16px';
  close.style.background = '#2c3e50';
  close.style.color = '#fff';
  close.style.border = 'none';
  close.style.borderRadius = '4px';
  close.style.cursor = 'pointer';
  close.addEventListener('click', removeBanner);

  banner.appendChild(title);
  if (reasons.length > 0) {
    banner.appendChild(list);
  }
  banner.appendChild(close);

  document.body.prepend(banner);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== 'PHISHGUARD_RESULT') {
    return;
  }

  const { payload } = message;
  const reasons = [];
  if (payload?.backend?.reasons) {
    reasons.push(...payload.backend.reasons);
  }
  if (payload?.heuristic?.features) {
    Object.entries(payload.heuristic.features).forEach(([feature, active]) => {
      if (active) {
        reasons.push(`Heuristic kích hoạt: ${feature}`);
      }
    });
  }
  createBanner(payload?.backend?.verdict ?? payload?.verdict ?? payload?.heuristic?.verdict ?? 'unknown', reasons);
});
