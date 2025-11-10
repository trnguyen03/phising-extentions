# Backend – PhishGuard API

Backend mẫu sử dụng Flask cung cấp các API chính cho extension.

## Chạy cục bộ

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app app run --debug
```

Server mặc định chạy ở `http://localhost:5000`.

## API Reference

### `POST /api/check-url`

Kiểm tra URL và trả về đánh giá.

**Request body**

```json
{
  "url": "https://example.com/login"
}
```

**Response body**

```json
{
  "url": "https://example.com/login",
  "classification": "danger",
  "confidence": 0.85,
  "reasons": [
    "URL chứa từ khóa nhạy cảm.",
    "Tên miền nằm trong blacklist: ..."
  ]
}
```

### `POST /api/report-url`

Nhận URL do người dùng báo cáo.

**Request body**

```json
{
  "url": "https://malicious.example"
}
```

**Response body**

```json
{
  "status": "received",
  "total_reports": 10
}
```

### `GET /api/reports`

Trả về danh sách URL mà người dùng đã báo cáo trong phiên hiện tại.
