# BẢNG ĐẶC TẢ TEST CASES: LUỒNG SẢN XUẤT SERIES BIBLE (PANELFORGE)

> **Mã dự án:** SEP490_FA26SE251  
> **Module:** Series Bible Collaborative Production (Thực thể - Thời đại - Phiên bản - Duyệt 2 tầng - Gate Chapter)  
> **Tài liệu tham chiếu:** `note/plans/02_BIBLE_PLAN.md`  
> **Quy chuẩn UI/UX:** Lucian UX/UI Standards  
> **Phiên bản:** 2.5  

---

## I. MÔ TẢ TỔNG QUAN LUỒNG NGHIỆP VỤ (TEST FLOW OVERVIEW)

```
[Writer] Tạo Entity (Nhân vật/Địa danh) 
   │
   ├──> [Hệ thống] Tự động sinh Giai đoạn chuẩn (Era) & Mở Hàng đợi thiết kế (Design Queue)
   │
[Artist] Nhận việc trong Design Queue ──> Vẽ & Nộp Concept Art (ConceptSubmitted)
   │
   ├──> [Writer] Kiểm tra kịch bản:
   │      ├── Không khớp ──> [Request Rework] (Kèm lý do) ──> Trả về Artist vẽ lại
   │      └── Khớp ý đồ  ──> [Writer Endorse] (Xác nhận ý đồ hợp lệ)
   │
[Producer] Thẩm định chất lượng tổng thể ──> [Lock Canon] (Khóa bất biến)
   │
[Chapter Production Gate] Kiểm tra toàn bộ nhân vật trong Chapter đã có Canon chưa trước khi cho vẽ Manga
```

---

## II. MA TRẬN PHÂN QUYỀN (RBAC PERMISSION MATRIX)

| Hành động | Producer | Writer | Artist | Editor |
| :--- | :---: | :---: | :---: | :---: |
| Tạo Thực thể / Era mới | ✅ | ✅ | ❌ | ✅ |
| Nộp Concept Art / Nộp lại (Resubmit) | ❌ | ❌ | ✅ | ❌ |
| Yêu cầu vẽ lại (Request Rework) | ✅ | ✅ | ❌ | ✅ |
| Xác nhận ý đồ kịch bản (Endorse) | ✅ | ✅ | ❌ | ✅ |
| Phê duyệt & Khóa bất biến (Lock Canon) | ✅ | ❌ | ❌ | ❌ |
| Xóa Era / Version chưa khóa | ✅ | ✅ | ❌ | ❌ |
| Xóa Era / Version đã khóa Canon | ⛔ Chặn | ⛔ Chặn | ⛔ Chặn | ⛔ Chặn |

---

## III. DANH SÁCH TEST CASES CHI TIẾT

### NHÓM 1: QUẢN LÝ THỰC THỂ & TẠO MỚI (TC-ENT)

| Test Case ID | Tên Test Case | Tiền điều kiện | Các bước thực hiện | Dữ liệu kiểm thử | Kết quả mong đợi | Mức độ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ENT-01** | Tạo nhân vật không nhập độ tuổi | Đăng nhập tài khoản Writer/Producer, vào Series Bible | 1. Bấm nút `+ Thêm thực thể`.<br/>2. Chọn loại `Character`.<br/>3. Nhập tên và mô tả, để trống độ tuổi.<br/>4. Bấm `Lưu thực thể`. | Name: "Kaito"<br/>Type: Character<br/>Age/Stage: Để trống | - Tạo thành công.<br/>- Tự động sinh 1 Era mặc định duy nhất: **"Giai đoạn chuẩn"**.<br/>- Không bị trùng tab. | **High** |
| **TC-ENT-02** | Tạo nhân vật có nhập độ tuổi tại Ch.1 (Chống trùng lặp) | Đăng nhập tài khoản Writer/Producer, vào Series Bible | 1. Bấm nút `+ Thêm thực thể`.<br/>2. Chọn loại `Character`.<br/>3. Nhập tên, chọn Giai đoạn: "15 tuổi", từ Chương 1.<br/>4. Bấm `Lưu thực thể`. | Name: "Akira"<br/>Stage: "15 tuổi"<br/>From: Chapter 1 | - Tạo thành công.<br/>- Giai đoạn vừa nhập thay thế hoàn toàn giai đoạn chuẩn, **chỉ có 1 tab "15 tuổi"**.<br/>- Không sinh thừa thêm tab "Giai đoạn chuẩn". | **Critical** |
| **TC-ENT-03** | Tạo địa danh (Location) / Cổ vật (Lore) | Đăng nhập tài khoản Writer, vào Series Bible | 1. Bấm `+ Thêm thực thể`.<br/>2. Chọn loại `Location`.<br/>3. Nhập thông tin bối cảnh. | Type: Location<br/>Name: "Học viện Aoba" | - Thực thể hiển thị đúng trong bộ lọc `Địa danh`.<br/>- Không hiển thị các trường độ tuổi nhân vật. | **Medium** |
| **TC-ENT-04** | Tìm kiếm và lọc thực thể Series Bible | Đã có sẵn ít nhất 5 thực thể các loại | 1. Nhập từ khóa tìm kiếm vào ô Search.<br/>2. Bấm lọc theo tab: Tất cả, Nhân vật, Địa danh, Bối cảnh.<br/>3. Lọc theo trạng thái Canon / Đang vẽ. | Search: "Akira"<br/>Filter: Character | Danh sách cập nhật tức thì, hiển thị chính xác các card thỏa mãn điều kiện. | **Medium** |

---

### NHÓM 2: QUẢN LÝ THỜI ĐẠI & GIAI ĐOẠN ĐỘ TUỔI (TC-ERA)

| Test Case ID | Tên Test Case | Tiền điều kiện | Các bước thực hiện | Dữ liệu kiểm thử | Kết quả mong đợi | Mức độ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ERA-01** | Thêm giai đoạn độ tuổi mới (Timeskip) | Nhân vật đã có Era "Lúc nhỏ (Ch.1-14)" | 1. Mở modal chi tiết nhân vật.<br/>2. Bấm nút `+ Thêm giai đoạn độ tuổi`.<br/>3. Nhập tên: "Trưởng thành", từ Chương 15.<br/>4. Bấm xác nhận tạo. | Stage: "Trưởng thành"<br/>EffectiveFrom: 15 | - Xuất hiện tab mới: `🧑 Trưởng thành (Ch.15+)`.<br/>- Era mới có trạng thái chờ nộp bản vẽ.<br/>- Xuất hiện trong Design Queue của Artist. | **High** |
| **TC-ERA-02** | Xóa Era chưa có bản vẽ Canon | Nhân vật có từ 2 Era trở lên, Era muốn xóa chưa được khóa Canon | 1. Chọn tab Era muốn xóa.<br/>2. Bấm nút `Xóa giai đoạn`.<br/>3. Modal xác nhận hiển thị cảnh báo.<br/>4. Bấm `Đồng ý xóa`. | Era: "Trưởng thành" (Draft) | - Hệ thống xóa Era thành công.<br/>- Tab biến mất, tự động chuyển về hiển thị Era liền kề.<br/>- Dữ liệu cập nhật ngay không cần F5. | **High** |
| **TC-ERA-03** | Chặn xóa Era đã có bản vẽ Canon Locked | Era đang chọn đã được Producer khóa Canon | 1. Chọn tab Era đã Canon.<br/>2. Quan sát giao diện hành động. | Era: "Lúc nhỏ" (Canon Locked) | - Nút xóa bị ẩn hoặc vô hiệu hóa.<br/>- Nếu gọi API trực tiếp, Backend trả về lỗi `400 Bad Request` với thông báo không cho phép xóa Era đã có Canon. | **Critical** |
| **TC-ERA-04** | Chặn xóa Era duy nhất còn lại của thực thể | Nhân vật chỉ có 1 Era duy nhất | 1. Mở modal nhân vật.<br/>2. Quan sát nút xóa Era. | Chỉ có 1 Era duy nhất | Nút xóa Era bị vô hiệu hóa kèm tooltip giải thích: *"Thực thể phải có ít nhất một giai đoạn hoạt động"*. | **Medium** |

---

### NHÓM 3: VÒNG ĐỜI DUYỆT 2 TẦNG (TWO-TIER REVIEW WORKFLOW - TC-REV)

| Test Case ID | Tên Test Case | Tiền điều kiện | Các bước thực hiện | Dữ liệu kiểm thử | Kết quả mong đợi | Mức độ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-REV-01** | Artist nộp bản vẽ Model Sheet mới | Writer đã tạo Era, mục xuất hiện trong Design Queue | 1. Đăng nhập tài khoản Artist.<br/>2. Vào hàng đợi `Bible Design Queue`.<br/>3. Bấm `Nộp Concept Art`.<br/>4. Chọn file ảnh Model Sheet hợp lệ (PNG/JPG < 10MB).<br/>5. Hộp thoại LucianConfirmModal mở ra xem trước.<br/>6. Bấm `Xác nhận tải lên`. | File: `akira_concept_v1.png` | - Trạng thái chuyển thành `ConceptSubmitted`.<br/>- Card nhân vật chuyển sang trạng thái chờ duyệt.<br/>- Writer nhận được thông báo/thấy nút hành động. | **Critical** |
| **TC-REV-02** | Artist nộp lại (Resubmit) khi tải nhầm ảnh | Trạng thái đang là `ConceptSubmitted`, chưa khóa Canon | 1. Artist thấy ảnh đã nộp bị nhầm.<br/>2. Bấm nút `🔄 Nộp lại` trên Card hoặc Modal.<br/>3. LucianInlineAlert hiển thị hướng dẫn.<br/>4. Chọn file ảnh mới và xác nhận. | File: `akira_concept_v1_fixed.png` | - Bản vẽ mới được ghi nhận thành công.<br/>- Không làm mất lịch sử các lần nộp trước.<br/>- Ảnh mới nhất hiển thị làm đại diện. | **High** |
| **TC-REV-03** | Writer yêu cầu vẽ lại (Request Rework) | Trạng thái đang là `ConceptSubmitted`, đăng nhập Writer | 1. Mở modal nhân vật.<br/>2. Bấm nút `↺ Yêu cầu vẽ lại`.<br/>3. Modal ReworkFeedback hiển thị.<br/>4. Nhập lý do (chọn gợi ý "Sai màu tóc" và viết thêm chi tiết).<br/>5. Bấm `Gửi yêu cầu`. | Feedback: "Tóc của Akira phải là màu đen theo kịch bản Chương 1, không phải màu nâu." | - Trạng thái chuyển thành `ReworkRequired`.<br/>- Nút chuyển trạng thái cập nhật.<br/>- Lý do phản hồi được lưu trữ trong DB. | **Critical** |
| **TC-REV-04** | Artist nhận phản hồi Rework và sửa lại | Đăng nhập tài khoản Artist sau khi bị yêu cầu sửa | 1. Vào `Bible Design Queue`.<br/>2. Tìm card nhân vật vừa bị yêu cầu sửa.<br/>3. Bấm `Nộp bản sửa lại`. | Quan sát hộp thoại | - Khối cảnh báo màu cam hiển thị rõ ràng nội dung feedback của Writer.<br/>- Artist nộp ảnh mới thành công, trạng thái trở lại `ConceptSubmitted`. | **Critical** |
| **TC-REV-05** | Writer duyệt ý đồ kịch bản (Writer Endorse) | Trạng thái là `ConceptSubmitted`, đăng nhập Writer | 1. Mở xem Model Sheet đã nộp.<br/>2. Thấy chuẩn kịch bản, bấm `✓ Duyệt ý đồ (Endorse)`.<br/>3. Xác nhận trên hộp thoại. | Action: Writer Endorse | - Trạng thái chuyển thành `WriterEndorsed`.<br/>- Hiển thị badge: *"Biên kịch đã duyệt · Chờ Producer khóa Canon"*. | **High** |
| **TC-REV-06** | Producer thẩm định & Khóa Canon (Lock Canon) | Trạng thái là `WriterEndorsed` (hoặc `ConceptSubmitted`), đăng nhập Producer | 1. Đăng nhập tài khoản Producer.<br/>2. Mở modal nhân vật.<br/>3. Bấm nút `🔒 Duyệt & Khóa Canon`.<br/>4. Xác nhận qua hộp thoại bảo vệ. | Action: Lock Canon | - Trạng thái chuyển thành `Canon Locked` (Biểu tượng 🔒).<br/>- Model Sheet này chính thức trở thành chuẩn tham chiếu toàn dự án.<br/>- Khóa toàn bộ quyền sửa/xóa trên version này. | **Critical** |

---

### NHÓM 4: QUẢN LÝ & XÓA VERSION (TC-DEL)

| Test Case ID | Tên Test Case | Tiền điều kiện | Các bước thực hiện | Dữ liệu kiểm thử | Kết quả mong đợi | Mức độ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-DEL-01** | Xóa Version nháp / chưa khóa Canon | Phiên bản đang ở trạng thái Draft hoặc ReworkRequired | 1. Mở danh sách lịch sử sửa đổi (Revisions).<br/>2. Bấm nút icon thùng rác bên cạnh Version nháp.<br/>3. Hộp thoại LucianConfirmModal hiển thị.<br/>4. Bấm `Xác nhận xóa`. | Version: #1 (Draft) | - Version bị xóa hoàn toàn khỏi DB.<br/>- Danh sách Revisions cập nhật ngay tức thì.<br/>- Version còn lại (nếu có) tự động được chọn hiển thị. | **High** |
| **TC-DEL-02** | Chặn xóa Version đã khóa Canon Locked | Phiên bản đã được Producer duyệt Canon (🔒) | 1. Mở danh sách Revisions.<br/>2. Tìm đến Version có nhãn Canon Locked.<br/>3. Quan sát giao diện nút bấm. | Version: #2 (Canon Locked) | - Không hiển thị nút xóa (hoặc nút xóa disabled có tooltip "Không thể xóa bản Canon").<br/>- Backend chặn xóa và trả về `400 Bad Request` nếu cố tình gửi request. | **Critical** |

---

### NHÓM 5: KIỂM TRA CHAPTER BIBLE GATE (TC-GATE)

| Test Case ID | Tên Test Case | Tiền điều kiện | Các bước thực hiện | Dữ liệu kiểm thử | Kết quả mong đợi | Mức độ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-GATE-01** | Chặn/Cảnh báo bắt đầu Chapter khi thiếu Canon | Chapter 2 có gán nhân vật "Akira" nhưng "Akira" chưa có bản vẽ Canon cho giai đoạn tương ứng | 1. Vào màn hình quản lý Chapter 2.<br/>2. Kiểm tra trạng thái Bible Gate của Chapter.<br/>3. Thử chuyển trạng thái Chapter sang phân cảnh/vẽ. | Chapter: 2<br/>Character: Akira (Chưa có Canon) | - Gate hiển thị trạng thái Cảnh báo / Blocked.<br/>- Liệt kê rõ: *"Nhân vật Akira chưa có thiết kế Canon cho Chương 2"*. | **Critical** |
| **TC-GATE-02** | Thông qua Bible Gate khi đủ Canon Model Sheet | Toàn bộ nhân vật trong Chapter 2 đều đã có bản vẽ Canon Locked | 1. Producer khóa Canon cho tất cả nhân vật của Chapter 2.<br/>2. Quay lại màn hình Chapter 2. | Tất cả nhân vật đã Canon | - Gate chuyển màu xanh: `✓ All Characters Canon Approved`.<br/>- Cho phép phân công Họa sĩ và tiến hành vẽ Storyboard/Pages. | **High** |

---

### NHÓM 6: TIÊU CHUẨN GIAO DIỆN & TƯƠNG TÁC LUCIAN UX/UI (TC-UI)

| Test Case ID | Tên Test Case | Tiền điều kiện | Các bước thực hiện | Dữ liệu kiểm thử | Kết quả mong đợi | Mức độ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-UI-01** | Chuyển đổi mượt mà giữa các Era Tabs | Nhân vật có từ 2 Era trở lên, mỗi Era có các Version riêng | 1. Bấm qua lại giữa các Tab độ tuổi.<br/>2. Quan sát Model Sheet, thông số và lịch sử Revisions. | Click Tab 1 ➔ Tab 2 | - Nội dung Model Sheet và thông số cập nhật tương ứng theo từng Era.<br/>- Không giật lag, không load lại toàn trang. | **Medium** |
| **TC-UI-02** | Phân cấp thị giác nút quan trọng | Đang mở Modal chi tiết nhân vật | Quan sát kích thước, màu sắc các nút: Duyệt (Endorse), Khóa Canon, Yêu cầu sửa, Xóa | N/A | - Nút chính (Endorse / Lock Canon): Nổi bật nhất (Primary/Emerald/Indigo).<br/>- Nút hành động phụ (Rework): Thứ cấp (Outline/Warning).<br/>- Nút Xóa: Nhỏ gọn, màu đỏ cảnh báo (Danger), nằm tách biệt để tránh bấm nhầm. | **Medium** |
| **TC-UI-03** | Chuẩn hóa ngôn ngữ & Không xuất hiện yếu tố AI | Rà soát toàn bộ giao diện Series Bible | Đọc các nhãn, placeholder, tooltip, nút bấm trên trang Series Bible và Modal | Toàn bộ trang | - 100% tiếng Việt chuyên nghiệp theo ngữ cảnh làm truyện tranh (Model Sheet, Bản vẽ nhân vật, Lần sửa đổi, Giai đoạn).<br/>- Không xuất hiện bất kỳ từ khóa "AI", "Prompt", "Sinh ảnh AI". | **High** |

