const params = new URLSearchParams(window.location.search);
const severity = params.get("severity") || "danger";
const reasons = JSON.parse(params.get("reasons") || "[]");

const warningRoot = document.querySelector(".warning");
const reasonList = document.getElementById("warning-reasons");
const proceedBtn = document.getElementById("proceed");
const goBackBtn = document.getElementById("go-back");

warningRoot?.classList.remove("warning--danger", "warning--warning", "warning--safe");
warningRoot?.classList.add(`warning--${severity}`);

if (reasons.length && reasonList) {
  reasonList.innerHTML = "";
  reasons.forEach((reason) => {
    const item = document.createElement("li");
    item.textContent = reason;
    reasonList.appendChild(item);
  });
}

proceedBtn?.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "warning:proceed" });
});

goBackBtn?.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "warning:close" });
});
