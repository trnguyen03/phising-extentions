# Phishing Extensions

Dự án cung cấp bộ mã nguồn cho backend kiểm tra URL phishing, kèm theo tài liệu định hướng kiến trúc.

## Cấu trúc

- `backend/`: Mã nguồn Flask và yêu cầu cài đặt để triển khai API kiểm tra phishing.
- `docs/`: Tài liệu kế hoạch chi tiết cho backend và cơ sở dữ liệu.
- `tests/`: Bộ kiểm thử tự động cho API.

## Cách chạy backend

1. Tạo và kích hoạt môi trường ảo.
2. Cài đặt phụ thuộc:

   ```bash
   pip install -r backend/requirements.txt
   ```

3. Khởi động dịch vụ:

   ```bash
   flask --app backend.app run --debug
   ```

   Mặc định dịch vụ sử dụng SQLite (`phishguard.db`) nằm cùng thư mục dự án.

## Chạy kiểm thử

1. Cài đặt phụ thuộc kiểm thử (ví dụ `pytest`):

   ```bash
   pip install pytest
   ```

2. Thực thi bộ kiểm thử:

   ```bash
   pytest
   ```

## Tài liệu

Kế hoạch triển khai chi tiết nằm trong [`docs/backend_database_plan.md`](docs/backend_database_plan.md).
