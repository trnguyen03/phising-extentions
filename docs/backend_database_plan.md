# Backend & Database Implementation Plan

## 1. Goals
- Cung cấp API để extension kiểm tra độ an toàn của URL (`POST /api/check-url`).
- Nhận báo cáo URL nghi ngờ từ người dùng (`POST /api/report-url`).
- Lưu trữ blacklist tuỳ chỉnh và lịch sử báo cáo để phục vụ phân tích.
- Cho phép mở rộng để tích hợp mô hình Machine Learning trong tương lai gần.

## 2. Kiến trúc triển khai
- **Ngôn ngữ & Framework**: Python + Flask.
- **ORM**: SQLAlchemy thông qua `Flask-SQLAlchemy`.
- **Cơ sở dữ liệu mặc định**: SQLite (dễ chạy local, tự tạo file `phishguard.db`). Có thể chuyển sang PostgreSQL/MySQL bằng cách cập nhật `SQLALCHEMY_DATABASE_URI`.
- **Cấu trúc thư mục**:
  - `backend/app.py`: Khởi tạo Flask app, định nghĩa model `UrlReport`, đăng ký routes.
  - `backend/__init__.py`: Đánh dấu package.
  - `tests/test_app.py`: Kiểm thử các endpoint chính.
  - `docs/`: Tài liệu quy trình, yêu cầu tích hợp.

## 3. Khởi tạo & cấu hình
1. **Tạo môi trường ảo và cài phụ thuộc**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```
2. **Biến môi trường quan trọng** (tuỳ chọn thêm trong `.env`):
   ```env
   DATABASE_URL=sqlite:///phishguard.db  # ghi đè URI mặc định
   FLASK_ENV=development
   ```
   Khi cần dùng PostgreSQL: `DATABASE_URL=postgresql+psycopg://user:pass@host:5432/phishguard`.
3. **Khởi tạo schema**: ứng dụng tự động tạo bảng khi chạy nhờ `db.create_all()` trong `create_app`.

## 4. Cấu trúc dữ liệu & Model
### Bảng `url_reports`
| Cột        | Kiểu dữ liệu | Mô tả                                          |
|------------|--------------|-----------------------------------------------|
| `id`       | Integer PK    | Khoá chính tự tăng                           |
| `url`      | String(512)   | URL đã chuẩn hoá (lower-case, đầy đủ scheme) |
| `status`   | String(32)    | `reported`, `dangerous`, `safe`, ...         |
| `notes`    | Text          | Ghi chú từ người dùng hoặc đội ngũ vận hành  |
| `created_at` | DateTime    | Thời điểm ghi nhận                            |
| `updated_at` | DateTime    | Thời điểm cập nhật gần nhất                  |

Chỉ số unique trên `url` đảm bảo một URL chỉ lưu một bản ghi; lần báo cáo sau sẽ cập nhật bản ghi hiện có.

### Mở rộng tương lai
- Bảng `scan_logs` (tuỳ chọn) để lưu mỗi lần kiểm tra `check-url` với cột `verdict`, `reasons`, `score`.
- Bảng `ml_models` lưu metadata model đang dùng (phiên bản, đường dẫn file).

## 5. API chi tiết
### `GET /health`
- Mục đích: kiểm tra nhanh tình trạng dịch vụ.
- Response: `{ "status": "ok" }` (HTTP 200).

### `POST /api/check-url`
- Input: `{ "url": "https://example.com" }`.
- Luồng xử lý:
  1. Chuẩn hoá URL bằng `normalize_url` (thêm scheme nếu thiếu, lowercase netloc).
  2. Tra cứu URL trong bảng `url_reports`.
  3. Chạy heuristics (`evaluate_url_risk`) để phát hiện dấu hiệu bất thường:
     - URL dùng IP.
     - Chứa từ khoá nhạy cảm (`login`, `secure`, ...).
     - Độ dài bất thường (>100 ký tự).
     - Tên miền có quá nhiều `-`.
     - Scheme không phải HTTP/HTTPS.
  4. Tổng hợp trạng thái (`safe` / `suspicious` / `dangerous`) và danh sách lý do.
- Output: `{ "url": "https://example.com/", "status": "safe", "reasons": [] }`.

### `POST /api/report-url`
- Input: `{ "url": "http://login.example.com", "status": "dangerous", "notes": "Giả mạo ngân hàng" }`.
- Luồng xử lý:
  1. Chuẩn hoá URL.
  2. Tạo mới hoặc cập nhật bản ghi trong `url_reports`.
  3. Trả về thông tin đã lưu kèm thông điệp xác nhận.
- Output: `{ "message": "URL đã được ghi nhận", "report": { ... } }`.

### Xử lý lỗi chung
- Nếu payload không phải JSON hợp lệ hoặc thiếu trường bắt buộc → HTTP 400 với `{ "error": "..." }`.
- Endpoint không tồn tại → HTTP 404 với `{ "error": "Endpoint không tồn tại" }`.

## 6. Tích hợp mô hình Machine Learning
1. **Nhận model** từ nhóm ML (ví dụ file `.pkl`).
2. Tạo module `backend/ml.py` với các hàm:
   ```python
   import joblib

   _model = None

   def load_model(path: str):
       global _model
       _model = joblib.load(path)
       return _model

   def predict(url_features: list[float]) -> float:
       if _model is None:
           raise RuntimeError("Model chưa được load")
       return float(_model.predict_proba([url_features])[0][1])
   ```
3. Kết nối với service heuristics:
   - Tạo `feature_extractor.py` sinh vector đặc trưng từ URL (độ dài, số dấu `/`, có https không...).
   - Trong `check-url`, sau bước heuristics, tính thêm `ml_score` và hợp nhất vào verdict:
     ```python
     score = predict(extract_features(normalized))
     if score > 0.85:
         status = "dangerous"
         reasons.append(f"Điểm ML cao: {score:.2f}")
     ```
4. Cấu hình đường dẫn model qua biến môi trường `MODEL_PATH`.

## 7. Đồng bộ với Frontend Extension
- Frontend gọi `POST /api/check-url` mỗi khi người dùng truy cập URL mới.
- Khi backend trả về `status` và `reasons`, extension hiển thị banner cảnh báo màu phù hợp (xanh/vàng/đỏ).
- Khi người dùng báo cáo URL, extension gửi `POST /api/report-url`.
- Nên cache kết quả `check-url` ngắn hạn (localStorage) để giảm số request lặp.

## 8. Quy trình Testing & CI
- Sử dụng pytest:
  - `tests/test_app.py` kiểm tra các trường hợp: health check, URL an toàn, quy trình report.
  - Có thể bổ sung test cho heuristics riêng (`evaluate_url_risk`).
- Thiết lập GitHub Actions mẫu:
  ```yaml
  name: Backend CI

  on: [push, pull_request]

  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-python@v5
          with:
            python-version: '3.11'
        - run: pip install -r backend/requirements.txt pytest
        - run: pytest
  ```

## 9. Bảo mật & Vận hành
- Bật CORS cho origin của extension nếu triển khai production (`flask-cors`).
- Thêm rate-limit (ví dụ `Flask-Limiter`) để tránh spam.
- Ghi log chuẩn bằng module `logging` hoặc gửi đến hệ thống giám sát (Elastic, Loki...).
- Sao lưu DB định kỳ; với SQLite có thể dùng cron copy file, với Postgres dùng `pg_dump`.

## 10. Lộ trình mở rộng
| Tuần | Công việc |
|------|-----------|
| 1    | Hoàn thiện CRUD báo cáo, triển khai SQLite local |
| 2    | Tích hợp heuristics nâng cao, thêm bảng `scan_logs` |
| 3    | Nhận và tích hợp model ML, tối ưu hiệu năng |
| 4    | Viết tài liệu API, thiết lập CI/CD, demo nội bộ |

## 11. Checklist bàn giao
- [ ] API chạy ổn định với dữ liệu test.
- [ ] README hướng dẫn cài đặt & chạy được cập nhật.
- [ ] Tài liệu API (request/response, ví dụ cURL) hoàn thiện.
- [ ] Database chứa ít nhất một số mẫu blacklist cho mục đích demo.
