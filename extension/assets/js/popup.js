const statusSection = document.querySelector(".popup__status");
const statusTitle = document.querySelector(".popup__status-title");
const statusSubtitle = document.querySelector(".popup__status-subtitle");
const confidenceScore = document.getElementById("confidence-score");
const classification = document.getElementById("classification");
const realTimeToggle = document.getElementById("real-time-protection");
const reportButton = document.getElementById("report-btn");

const statusCopy = {
  safe: {
    title: "Trang web hiện tại an toàn",
    subtitle:
      "Không phát hiện dấu hiệu đáng ngờ. Luôn cảnh giác trước các yêu cầu nhập thông tin nhạy cảm.",
    label: "An toàn",
  },
  suspicious: {
    title: "Trang web có dấu hiệu đáng ngờ",
    subtitle:
      "Đừng nhập thông tin cá nhân hoặc mật khẩu. Hãy kiểm tra kỹ đường dẫn và người gửi.",
    label: "Đáng ngờ",
  },
  danger: {
    title: "Cảnh báo! Có khả năng là trang lừa đảo",
    subtitle:
      "Tuyệt đối không nhập thông tin. Đóng trang này và báo cáo cho bộ phận an ninh.",
    label: "Nguy hiểm",
  },
};

function updateStatus(state, score) {
  const copy = statusCopy[state];
  if (!copy) return;

  statusSection.dataset.state = state;
  statusTitle.textContent = copy.title;
  statusSubtitle.textContent = copy.subtitle;
  confidenceScore.textContent = `${Math.round(score * 100)}%`;
  classification.textContent = copy.label;
}

function applyDetectionResult(result) {
  const { classification: state, confidence = 0.5 } = result;
  updateStatus(state, confidence);
}

chrome.runtime.sendMessage({ action: "popup:request-status" }, (response) => {
  if (!response) return;
  applyDetectionResult(response);
});

realTimeToggle?.addEventListener("change", (event) => {
  chrome.runtime.sendMessage({
    action: "popup:toggle-real-time",
    enabled: event.target.checked,
  });
});

reportButton?.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "popup:report-current" });
  reportButton.textContent = "Đã gửi báo cáo";
  reportButton.disabled = true;
});
