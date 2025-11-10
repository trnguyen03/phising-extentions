from __future__ import annotations

from dataclasses import dataclass
from typing import List

from flask import Flask, jsonify, request

app = Flask(__name__)


@dataclass
class DetectionResult:
    url: str
    classification: str
    confidence: float
    reasons: List[str]

    def to_dict(self) -> dict:
        return {
            "url": self.url,
            "classification": self.classification,
            "confidence": self.confidence,
            "reasons": self.reasons,
        }


BLACKLIST = {
    "evil-phish.example": "Báo cáo bởi người dùng",
    "suspicious-login.net": "Trong danh sách đen nội bộ",
}

USER_REPORTS: List[str] = []


def basic_heuristics(url: str) -> DetectionResult:
    from urllib.parse import urlparse

    parsed = urlparse(url)
    reasons: List[str] = []
    confidence = 0.2
    classification = "safe"

    hostname = parsed.hostname or ""
    if hostname in BLACKLIST:
        reasons.append(f"Tên miền nằm trong blacklist: {BLACKLIST[hostname]}")
        classification = "danger"
        confidence = 0.95

    suspicious_keywords = ["login", "secure", "verify", "password", "update"]
    if any(keyword in url.lower() for keyword in suspicious_keywords):
        reasons.append("URL chứa từ khóa nhạy cảm.")
        confidence += 0.15
        classification = "suspicious"

    if len(url) > 120:
        reasons.append("URL có độ dài bất thường.")
        confidence += 0.1
        classification = "suspicious"

    return DetectionResult(url=url, classification=classification, confidence=confidence, reasons=reasons)


@app.post("/api/check-url")
def check_url():
    data = request.get_json(force=True)
    url = data.get("url", "")
    if not url:
        return jsonify({"error": "Missing url"}), 400

    result = basic_heuristics(url)

    # Placeholder for ML integration
    model_confidence = 0.3
    result.confidence = min(1.0, result.confidence + model_confidence)
    if result.confidence > 0.75:
        result.classification = "danger"

    return jsonify(result.to_dict())


@app.post("/api/report-url")
def report_url():
    data = request.get_json(force=True)
    url = data.get("url")
    if not url:
        return jsonify({"error": "Missing url"}), 400

    USER_REPORTS.append(url)
    return jsonify({"status": "received", "total_reports": len(USER_REPORTS)})


@app.get("/api/reports")
def list_reports():
    return jsonify({"reports": USER_REPORTS})


if __name__ == "__main__":
    app.run(debug=True)
