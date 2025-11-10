# PhishGuard – Bộ giải pháp phát hiện phishing toàn diện

Kho lưu trữ này chứa bộ mã nguồn mẫu cho dự án extension phát hiện trang web lừa đảo. Cấu trúc được xây dựng dựa trên yêu cầu của các nhóm chức năng:

- **Nhóm 3A (UI/UX & Logic cảnh báo)** – Thư mục `extension/ui`, `extension/warning`, `extension/settings` và các file CSS/JS đi kèm.
- **Nhóm 3B (Core Logic & API Integration)** – Thư mục `extension` với `background.js`, `content.js`, `manifest.json`.
- **Nhóm Backend & Database** – Thư mục `backend` với mã nguồn Flask và cấu hình dữ liệu.
- **Nhóm Machine Learning & Heuristics** – Thư mục `ml` chứa dữ liệu, notebook phân tích và báo cáo huấn luyện.

## Cấu trúc

```text
extension/
  manifest.json
  background.js
  content.js
  assets/
    css/
    js/
    img/
  ui/
    popup.html
  warning/
    warning.html
  settings/
    settings.html
backend/
  app.py
  requirements.txt
  README.md
ml/
  data/
    sample_urls.csv
  feature_engineering.md
  model_training.md
README.md
```

## Cách chạy nhanh backend mẫu

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app app run --debug
```

API Flask chạy ở `http://localhost:5000`.

## Tài liệu API

Xem thêm trong [`backend/README.md`](backend/README.md).

## Bộ dữ liệu và notebook

- [`ml/data/sample_urls.csv`](ml/data/sample_urls.csv) minh họa định dạng dữ liệu.
- [`ml/feature_engineering.md`](ml/feature_engineering.md) mô tả pipeline tạo đặc trưng.
- [`ml/model_training.md`](ml/model_training.md) trình bày thử nghiệm mô hình và kết quả đánh giá.

Các tệp này được cung cấp để các nhóm tiếp tục mở rộng và triển khai hệ thống hoàn chỉnh.
