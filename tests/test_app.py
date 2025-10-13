from backend.app import UrlReport, create_app, db


def setup_app():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
    })
    return app


def test_health_endpoint():
    app = setup_app()
    client = app.test_client()
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_check_url_returns_safe():
    app = setup_app()
    client = app.test_client()
    response = client.post("/api/check-url", json={"url": "https://example.com"})
    body = response.get_json()

    assert response.status_code == 200
    assert body["status"] == "safe"
    assert body["reasons"] == []


def test_report_url_marks_as_dangerous():
    app = setup_app()
    client = app.test_client()
    suspicious_url = "http://login.example-phish.com/reset"

    report_response = client.post(
        "/api/report-url", json={"url": suspicious_url, "status": "dangerous"}
    )
    assert report_response.status_code == 200

    check_response = client.post("/api/check-url", json={"url": suspicious_url})
    body = check_response.get_json()
    assert check_response.status_code == 200
    assert body["status"] == "dangerous"
    assert any("báo cáo" in reason for reason in body["reasons"])


def test_invalid_payload_returns_error():
    app = setup_app()
    client = app.test_client()
    response = client.post("/api/check-url", data="not json")
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_report_updates_existing_entry():
    app = setup_app()
    client = app.test_client()
    url = "http://suspicious-site.test/login"

    first = client.post("/api/report-url", json={"url": url, "notes": "initial"})
    assert first.status_code == 200

    second = client.post(
        "/api/report-url",
        json={"url": url, "notes": "updated", "status": "safe"},
    )
    assert second.status_code == 200

    with app.app_context():
        stored = UrlReport.query.filter_by(url="http://suspicious-site.test/login").one()
        assert stored.notes == "updated"
        assert stored.status == "safe"
