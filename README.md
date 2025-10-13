# Kế hoạch Phân chia Công việc Nhóm 7 Người

Tài liệu này mô tả cơ cấu tổ chức và phạm vi công việc cho dự án phát triển extension phát hiện phishing. Nhóm gồm 7 thành viên, được chia thành 5 đội nhỏ với nhiệm vụ cụ thể như sau:

## 1. Project Manager & Documentation (1 người)
**Trách nhiệm chính**
- Lập kế hoạch tổng thể cho dự án và duy trì các mốc tiến độ (ví dụ: biểu đồ Gantt).
- Theo dõi tiến độ các thành viên, tổ chức họp nhóm hằng tuần.
- Quản lý kho mã nguồn chung, điều phối quy trình Git (branch, pull request, review).
- Thu thập và biên tập tài liệu từ các nhóm khác để hình thành báo cáo cuối kỳ.
- Chuẩn bị slide thuyết trình cuối kỳ.

**Deliverables**
- Kế hoạch dự án chi tiết.
- Báo cáo cuối kỳ đầy đủ.
- Bộ slide thuyết trình.
- Repository được tổ chức khoa học, tuân thủ quy trình làm việc.

## 2. Research & Content (1 người)
**Trách nhiệm chính**
- Nghiên cứu chuyên sâu về phishing: khái niệm, lịch sử, các biến thể (Email, Spear, Whaling, Smishing...).
- Phân tích kỹ thuật tấn công: typosquatting, homograph, URL shortener, social engineering...
- Tổng hợp các giải pháp chống phishing hiện có, đánh giá ưu/nhược điểm.
- Viết nội dung phần Giới thiệu và Tổng quan lý thuyết cho báo cáo.

**Deliverables**
- Tài liệu nghiên cứu đầy đủ (Word/Google Docs) làm nền tảng cho báo cáo.
- Nội dung cho 3-5 slide giới thiệu đầu tiên của bài thuyết trình.

## 3. Frontend – Extension Development (2 người)
### Thành viên 3A – UI/UX & Logic cảnh báo
**Trách nhiệm chính**
- Thiết kế UI cho extension: popup, trang cảnh báo (màu đỏ, vàng), trang cài đặt.
- Hiện thực giao diện bằng HTML/CSS.
- Viết JavaScript điều khiển hiển thị cảnh báo dựa trên dữ liệu nhận được.

**Deliverables**
- Bộ file HTML, CSS, JavaScript liên quan đến giao diện.

### Thành viên 3B – Core logic & API integration
**Trách nhiệm chính**
- Xây dựng logic lõi của extension bằng JavaScript (background, content scripts).
- Bắt các sự kiện trình duyệt (đổi tab, tải trang).
- Gửi URL tới backend để kiểm tra và xử lý phản hồi.
- Thực hiện các heuristic đơn giản trên trình duyệt (kiểm tra IP, punycode...).

**Deliverables**
- Các file JavaScript lõi (background.js, content.js) và manifest.json.

## 4. Backend & Database (1 người)
**Trách nhiệm chính**
- Chọn ngôn ngữ/framework backend (Node.js + Express, Python + Flask...).
- Thiết kế API:
  - `POST /api/check-url`: nhận URL, điều phối kiểm tra (blacklist, ML) và trả kết quả.
  - `POST /api/report-url`: nhận URL người dùng báo cáo.
- Thiết kế và quản lý cơ sở dữ liệu (ví dụ MongoDB) lưu blacklist tùy chỉnh.
- Tích hợp model machine learning vào API kiểm tra URL.

**Deliverables**
- Mã nguồn backend đầy đủ.
- Tài liệu hướng dẫn API cho nhóm Frontend.
- Cơ sở dữ liệu được thiết lập và kết nối.

## 5. Machine Learning & Heuristics (2 người)
### Thành viên 5A – Data & Feature Engineering
**Trách nhiệm chính**
- Thu thập dữ liệu URL (an toàn/lừa đảo) từ các nguồn như PhishTank, Kaggle.
- Làm sạch dữ liệu và trích xuất đặc trưng (độ dài URL, ký tự đặc biệt, từ khóa nhạy cảm...).

**Deliverables**
- Dataset sạch dạng CSV.
- Mã nguồn (notebook/script) mô tả quá trình xử lý và trích xuất đặc trưng.

### Thành viên 5B – Model Training & Evaluation
**Trách nhiệm chính**
- Huấn luyện, thử nghiệm các mô hình ML/DL (Logistic Regression, Random Forest, NN...).
- Đánh giá Accuracy, Precision, Recall, F1 để chọn model tốt nhất.
- Lưu mô hình đã huấn luyện (pkl/h5) và ghi lại quy trình sử dụng.

**Deliverables**
- File mô hình đã huấn luyện.
- Notebook/script huấn luyện & đánh giá.
- Báo cáo ngắn gọn về hiệu suất mô hình.

## 6. Kiến trúc mã nguồn & hướng dẫn chạy thử

```
phising-extentions/
├─ extension/             # Mã nguồn Chrome Extension (Manifest v3)
├─ backend/               # REST API Node.js phục vụ kiểm tra phishing
└─ ml/                    # Pipeline ML để trích xuất đặc trưng & huấn luyện
```

### Extension (Nhóm Frontend)
- Tải extension ở chế độ developer trong Chrome:
  1. Mở `chrome://extensions` → bật **Developer mode**.
  2. Chọn **Load unpacked** và trỏ vào thư mục `extension/`.
- Thêm ba biểu tượng PNG (`icon16.png`, `icon48.png`, `icon128.png`) vào `extension/icons/` theo hướng dẫn trong `extension/icons/README.md` trước khi load extension.
- Khi duyệt web, service worker (`background.js`) sẽ:
  - Chạy heuristic tại chỗ (xem `heuristics.js`).
  - Gửi yêu cầu tới backend (`/api/check-url`) để nhận điểm ML.
  - Hiển thị cảnh báo bằng `content.js` và cập nhật popup UI.
- Tùy chỉnh endpoint backend & ngưỡng cảnh báo trong trang `options/options.html`.

### Backend (Nhóm Server)
- Yêu cầu Node.js 18+.
- Cài đặt phụ thuộc và chạy server:
  ```bash
  cd backend
  npm install
  npm run dev
  ```
- Các endpoint chính:
  - `POST /api/check-url`: nhận URL và trả về `{ verdict, score, reasons }`.
  - `POST /api/report-url`: lưu URL do người dùng báo cáo.
  - `GET /api/report-url`: truy vấn các báo cáo đã lưu.
- Cấu hình qua biến môi trường (`.env`), ví dụ `PORT`, `WARNING_THRESHOLD`, `DANGER_THRESHOLD`.

### Machine Learning (Nhóm 5)
- Cập nhật dataset trong `ml/data/`.
- Chạy `python ml/feature_engineering.py` để tạo `engineered_features.csv`.
- Huấn luyện logistic regression bằng `python ml/train_model.py`.
- Nếu muốn áp dụng trọng số mới cho backend, lưu chúng thành file JSON (ví dụ `logistic_model.json`) rồi cấu hình biến môi
  trường `MODEL_PATH` trỏ tới file đó hoặc sao chép file vào thư mục `backend/src/model/`.

## 7. Quy trình phối hợp giữa các nhóm
- **Frontend & Backend:** Backend cung cấp tài liệu API sớm để Frontend tích hợp.
- **Backend & Machine Learning:** Nhóm ML bàn giao file model và hướng dẫn tích hợp cho Backend.
- **Tất cả nhóm & Project Manager:** Cập nhật tiến độ hằng tuần, đẩy mã nguồn lên Git khi hoàn thành phần việc.
- **Tất cả nhóm & Research:** Cập nhật kiến thức, đảm bảo mọi thành viên hiểu bối cảnh và yêu cầu dự án.

## 8. Mốc thời gian gợi ý
| Tuần | Công việc chính |
| --- | --- |
| 1 | Project Manager lập kế hoạch; Research bắt đầu thu thập tài liệu; ML tìm nguồn dữ liệu. |
| 2 | Frontend thiết kế UI; Backend thiết kế kiến trúc; ML hoàn thiện feature engineering. |
| 3 | Backend dựng API cơ bản; Frontend tích hợp logic; ML huấn luyện model đầu tiên. |
| 4 | Tích hợp ML vào Backend; Frontend hoàn thiện cảnh báo; chạy thử end-to-end. |
| 5 | Kiểm thử, tinh chỉnh; hoàn thiện tài liệu, báo cáo và slide. |

## 9. Công cụ & Quy ước chung
- Sử dụng Git với chiến lược branch theo chức năng; yêu cầu pull request trước khi merge.
- Giao tiếp qua kênh chung (Slack/Discord) và họp hàng tuần do Project Manager chủ trì.
- Lưu trữ tài liệu nghiên cứu và báo cáo trên Google Drive hoặc Notion.
- Mỗi nhóm cập nhật nhật ký công việc (log) để tiện tổng hợp báo cáo cuối kỳ.

## 10. Cách kiểm thử end-to-end
### 10.1 Backend API
1. Cài đặt dependencies và chạy toàn bộ bộ kiểm thử tự động:
   ```bash
   cd backend
   npm install
   npm test
   ```
   Bộ lệnh trên sẽ chạy `node --test` cùng với `supertest` để đảm bảo:
   - API `/api/check-url` trả mã lỗi 400 khi thiếu tham số.
   - Một URL an toàn được phân loại `safe` cùng điểm số và danh sách lý do.
   - API kết hợp điểm ML với kết quả heuristic của extension.
   - Dịch vụ lưu trữ báo cáo tôn trọng biến môi trường `REPORTS_PATH` (hữu ích khi chạy test không muốn ghi đè dữ liệu thật).

2. Chạy thủ công server dev để thử nghiệm cùng extension:
   ```bash
   npm run dev
   ```
   Mặc định backend dùng cổng `4000`. Có thể dùng `curl` để kiểm tra nhanh:
   ```bash
   curl -X POST http://localhost:4000/api/check-url \
     -H 'Content-Type: application/json' \
     -d '{"url": "https://example.com"}'
   ```

### 10.2 Chrome Extension
1. Đảm bảo backend đã chạy hoặc cập nhật endpoint trong trang `Options`.
2. Mở `chrome://extensions`, bật **Developer mode** và chọn **Load unpacked** trỏ tới thư mục `extension/`.
3. Điều hướng tới một URL giả (ví dụ `http://login.evil-banking-secure.com@attackers.ru/secure`). Popup sẽ hiển thị mức cảnh báo `Danger` và màu đỏ.
4. Kiểm thử nút **Report URL** trong popup để chắc chắn yêu cầu `POST /api/report-url` thành công (xem log trong tab `Service Worker` của extension).

### 10.3 Pipeline Machine Learning
1. Tạo môi trường Python (khuyến nghị `python -m venv .venv && source .venv/bin/activate`).
2. Cài đặt gói cần thiết:
   ```bash
   pip install -r ml/requirements.txt
   ```
3. Chạy trích xuất đặc trưng và huấn luyện mẫu:
   ```bash
   python ml/feature_engineering.py
   python ml/train_model.py
   ```
4. Sau khi huấn luyện, xuất trọng số sang JSON và cập nhật đường dẫn thông qua biến môi trường `MODEL_PATH` (hoặc đặt file vào `backend/src/model/`) trước khi khởi chạy server. Có thể chạy lại bộ kiểm thử bằng lệnh `npm test` để bảo đảm endpoint vẫn trả kết quả mong muốn.

