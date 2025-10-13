from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional
from urllib.parse import urlparse

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class UrlReport(db.Model):
    __tablename__ = "url_reports"

    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(512), unique=True, nullable=False)
    status = db.Column(db.String(32), nullable=False, default="reported")
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    def as_dict(self) -> Dict[str, str]:
        return {
            "url": self.url,
            "status": self.status,
            "notes": self.notes or "",
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


def create_app(config: Optional[Dict[str, str]] = None) -> Flask:
    """Application factory for the phishing detection backend."""

    app = Flask(__name__)
    app.config.setdefault("SQLALCHEMY_DATABASE_URI", "sqlite:///phishguard.db")
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)

    if config:
        app.config.update(config)

    db.init_app(app)

    with app.app_context():
        db.create_all()

    register_routes(app)
    return app


def normalize_url(raw_url: str) -> str:
    """Normalize the provided URL into a canonical string."""

    parsed = urlparse(raw_url if "://" in raw_url else f"http://{raw_url}")
    netloc = parsed.netloc.lower()
    path = parsed.path or "/"
    normalized = f"{parsed.scheme.lower()}://{netloc}{path}"
    if parsed.query:
        normalized = f"{normalized}?{parsed.query}"
    return normalized


def evaluate_url_risk(url: str, reported: Optional[UrlReport]) -> Dict[str, List[str]]:
    """Run heuristic checks and combine them with report data."""

    reasons: List[str] = []
    status = "safe"

    if reported:
        if reported.status != "safe":
            status = "dangerous"
            reasons.append("URL được báo cáo trong danh sách đen của người dùng")
        else:
            reasons.append("URL đã được xác minh an toàn bởi đội ngũ vận hành")

    parsed = urlparse(url)

    if parsed.hostname and parsed.hostname.replace(".", "").isdigit():
        status = "dangerous"
        reasons.append("URL sử dụng địa chỉ IP thay vì tên miền")

    suspicious_keywords = {
        "login",
        "secure",
        "update",
        "verify",
        "bank",
        "paypal",
    }
    if any(keyword in url.lower() for keyword in suspicious_keywords):
        if status == "safe":
            status = "suspicious"
        reasons.append("URL chứa các từ khóa nhạy cảm thường gặp trong phishing")

    if len(url) > 100:
        if status == "safe":
            status = "suspicious"
        reasons.append("URL có độ dài bất thường")

    if parsed.hostname and parsed.hostname.count("-") >= 3:
        if status == "safe":
            status = "suspicious"
        reasons.append("Tên miền chứa nhiều ký tự '-' bất thường")

    if parsed.scheme not in {"http", "https"}:
        status = "dangerous"
        reasons.append("URL sử dụng giao thức không an toàn")

    return {"status": status, "reasons": reasons}


class InvalidRequest(RuntimeError):
    """Raised when the request payload is malformed."""


def parse_request_json(required_fields: List[str]) -> Dict[str, str]:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise InvalidRequest("Yêu cầu phải là JSON hợp lệ")

    missing = [field for field in required_fields if field not in payload]
    if missing:
        raise InvalidRequest(f"Thiếu các trường bắt buộc: {', '.join(missing)}")

    return payload


def register_routes(app: Flask) -> None:
    @app.errorhandler(InvalidRequest)
    def handle_invalid_request(error: InvalidRequest):
        return jsonify({"error": str(error)}), 400

    @app.errorhandler(404)
    def handle_not_found(_: Exception):
        return jsonify({"error": "Endpoint không tồn tại"}), 404

    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({"status": "ok"})

    @app.route("/api/check-url", methods=["POST"])
    def check_url():
        payload = parse_request_json(["url"])
        normalized = normalize_url(payload["url"])

        report = UrlReport.query.filter_by(url=normalized).first()
        result = evaluate_url_risk(normalized, report)

        return jsonify({"url": normalized, **result})

    @app.route("/api/report-url", methods=["POST"])
    def report_url():
        payload = parse_request_json(["url"])
        normalized = normalize_url(payload["url"])
        notes = payload.get("notes")
        status = payload.get("status", "reported")

        report = UrlReport.query.filter_by(url=normalized).first()
        if report:
            report.status = status
            report.notes = notes
        else:
            report = UrlReport(url=normalized, status=status, notes=notes)
            db.session.add(report)

        db.session.commit()
        return jsonify({"message": "URL đã được ghi nhận", "report": report.as_dict()})


app = create_app()
