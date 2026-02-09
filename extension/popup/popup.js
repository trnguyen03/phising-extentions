function verdictLabel(verdict) {
  switch (verdict) {
    case 'safe':
      return 'An toàn';
    case 'warning':
      return 'Đáng ngờ';
    case 'danger':
      return 'Nguy hiểm';
    default:
      return 'Không xác định';
  }
}

function renderState(state) {
  const verdictElement = document.getElementById('verdict');
  const urlElement = document.getElementById('checked-url');
  const detailsElement = document.getElementById('details');
  const timestampElement = document.getElementById('updated-at');

  verdictElement.textContent = verdictLabel(state.lastVerdict ?? 'unknown');
  verdictElement.dataset.verdict = state.lastVerdict ?? 'unknown';

  if (state.lastCheck?.url) {
    urlElement.textContent = state.lastCheck.url;
  } else {
    urlElement.textContent = 'Chưa kiểm tra URL nào';
  }

  timestampElement.textContent = state.lastUpdatedAt
    ? `Cập nhật: ${new Date(state.lastUpdatedAt).toLocaleString()}`
    : '';

  detailsElement.innerHTML = '';

  if (state.lastCheck?.backend?.score !== undefined) {
    detailsElement.appendChild(createLi(`Điểm ML: ${state.lastCheck.backend.score.toFixed(2)}`));
  }

  if (state.lastCheck?.backend?.reasons?.length) {
    state.lastCheck.backend.reasons.forEach((reason) => {
      detailsElement.appendChild(createLi(reason));
    });
  }

  if (state.lastCheck?.heuristic?.features) {
    Object.entries(state.lastCheck.heuristic.features).forEach(([feature, active]) => {
      if (active) {
        detailsElement.appendChild(createLi(`Heuristic kích hoạt: ${feature}`));
      }
    });
  }

  if (!detailsElement.hasChildNodes()) {
    detailsElement.appendChild(createLi('Không có thông tin chi tiết.')); 
  }
}

function createLi(text) {
  const li = document.createElement('li');
  li.textContent = text;
  return li;
}

async function requestState() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'PHISHGUARD_GET_STATE' }, resolve);
  });
}

async function reportUrl() {
  const notes = document.getElementById('report-notes').value;
  const state = await requestState();
  if (!state.lastCheck?.url) {
    alert('Chưa có URL nào để báo cáo.');
    return;
  }
  chrome.runtime.sendMessage(
    { type: 'PHISHGUARD_REPORT_URL', url: state.lastCheck.url, notes },
    (response) => {
      if (response?.success) {
        alert('Đã gửi báo cáo. Cảm ơn bạn!');
        document.getElementById('report-notes').value = '';
      } else {
        alert(`Không thể gửi báo cáo: ${response?.error ?? 'Unknown error'}`);
      }
    }
  );
}

async function bootstrap() {
  const state = await requestState();
  renderState(state);
  chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'PHISHGUARD_RESULT') {
      const updatedState = await requestState();
      renderState(updatedState);
    }
  });
}

document.getElementById('report-button').addEventListener('click', reportUrl);
bootstrap();
