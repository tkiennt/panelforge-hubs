# BÁO CÁO CẬP NHẬT & TÀI LIỆU TÍNH NĂNG MỚI (RELEASE NOTES V2.5)

> **Dự án:** PanelForge Manga Production Platform (`SEP490_PanelForge`)  
> **Nhánh cập nhật:** `trungkien` (Đã đồng bộ trên cả Backend và Frontend)  
> **Ngày cập nhật:** 26/10/2026  
> **Kiến trúc:** .NET 9 Backend (Clean Architecture, CQRS, EF Core) + React 19 / TypeScript Frontend (Tailwind CSS, Lucian UX/UI)

---

## 1. TỔNG QUAN TÌNH TRẠNG MERGE & ĐỒNG BỘ CODE

Cả hai kho mã nguồn (**Backend** và **Frontend**) trên nhánh `trungkien` đã được kiểm tra, đối soát toàn diện với tất cả các nhánh remote (`origin/main`, `origin/test-feature`, `origin/feat/cf4`, `origin/feat/cf5`, `origin/tam`, `origin/CongHoa`):

- **Frontend (`panelforge-fe`):** 
  - Đã tích hợp đầy đủ mọi thay đổi từ `origin/main`, `origin/tam` (Chapter Reader Modal & My Work Polish), `origin/feat/cf4` & `origin/CongHoa` (Lịch sử & Provenance Canvas), `origin/feat/cf5` (Catalog Reader & API xuất chương).
  - Hoàn tất kiểm tra TypeScript typecheck: **0 lỗi** (`tsc --noEmit` Passed).
  - Vượt qua 932 unit/integration tests trên Vitest.
  - Cây thư mục sạch sẽ, sẵn sàng triển khai.

- **Backend (`PanelForge_FA26SE251`):**
  - Đã tích hợp đầy đủ các luồng từ `origin/test-feature`, `origin/feat/cf4`, `origin/feat/cf5`.
  - Đã hoàn tất và commit bộ migration cơ sở dữ liệu EF Core:
    - **Migration File:** `20261023075951_AddFreezeScriptAndBibleReviewLifecycle.cs`
    - **Model Snapshot:** `PanelForgeDbContextModelSnapshot.cs`
    - **Commit:** `ccfe936 feat(migration): add migration for Freeze Script gate and Bible review lifecycle`

---

## 2. CHI TIẾT CÁC TÍNH NĂNG MỚI ĐÃ CẬP NHẬT

---

### PHẦN I: KIẾN TRÚC V2.5 & VÒNG ĐỜI SẢN XUẤT MỚI (PHASE 1)

#### 1. Độc lập hóa Biên kịch (Writer) khỏi Hệ thống Phân công việc (Assignment)
- **Vấn đề trước đây:** Biên kịch bị ép phải có thẻ phân công công việc (Assignment) từ Producer mới được gõ kịch bản, và bị bắt ép phải chia sẵn Trang (Page) và Khung tranh (Panel) dù chưa có Họa sĩ dàn trang.
- **Cải tiến mới:**
  - **Backend (`ScriptLineRules`, `SceneAssignmentGate`):** Cấp quyền tự do tạo, chỉnh sửa, xóa thoại (`ScriptLine`) và phân cảnh (`Scene`) cho vai trò `WorkspaceRole.Writer` và `Producer` mà không cần phụ thuộc vào thẻ Assignment, miễn là kịch bản của chương chưa bị đóng băng (`!IsScriptFrozen`).
  - **Frontend (`ScriptEditorView.tsx`, `permissions.ts`):** Biên kịch tập trung hoàn toàn vào cấu trúc tự sự chuẩn truyện tranh chuyên nghiệp:
    $$\text{Story Arc} \longrightarrow \text{Chapter Outline} \longrightarrow \text{Scene} \longrightarrow \text{ScriptLine}$$
    Ẩn toàn bộ các trường nhập số trang/khung tranh gây nhiễu, chuyển giao việc phân trang cho Họa sĩ (Artist) ở công đoạn Layout.

#### 2. Luồng Sản xuất Series Bible 3 Bên & Lưu trữ Bất biến SHA-256
- **Cải tiến:**
  - **Backend (`BibleEntryRevision`, `UploadBibleReferenceImageCommand`):** Bổ sung thuộc tính `ArtistUserId` (Guid) trên bản vẽ thiết kế để định danh nguồn gốc tác giả (Provenance). Cấp quyền cho Họa sĩ (`WorkspaceRole.Artist`) tải lên hình ảnh tham chiếu nhân vật/bối cảnh trực tiếp qua Content-Addressed Storage (CAS), sinh mã băm SHA-256 bất biến (`/api/series/{seriesId}/bible/assets/{sha}`).
  - **Frontend (`SeriesBibleView.tsx`, `BibleEntityDetailModal.tsx`):** Thay thế việc dán link ảnh thủ công bằng bộ chọn tải tệp ảnh trực tiếp lên server với thanh tiến trình tải và kiểm tra định dạng an toàn.

#### 3. Vòng đời Kiểm duyệt Series Bible 2 Tầng (Two-Tier Review Lifecycle)
- **Quy trình 2 tầng:**
  ```mermaid
  stateDiagram-v2
      [*] --> Draft: Artist phác thảo
      Draft --> ConceptSubmitted: Nộp bản vẽ
      ConceptSubmitted --> ReworkRequired: Writer/Editor yêu cầu sửa
      ReworkRequired --> ConceptSubmitted: Artist cập nhật bản vẽ
      ConceptSubmitted --> WriterEndorsed: Writer/Editor xác nhận khớp cốt truyện
      WriterEndorsed --> CanonLocked: Producer phê duyệt khóa Canon 🔒
      CanonLocked --> [*]: Không thể unlock (Chỉ có thể Supersede)
  ```
- **Backend:**
  - Enum `BibleRevisionStatus`: `Draft (1)`, `ConceptSubmitted (2)`, `ReworkRequired (3)`, `WriterEndorsed (4)`, `CanonLocked (5)`.
  - Bổ sung trường `ReworkFeedback` ghi nhận phản hồi sửa đổi.
  - Endpoints mới:
    - `POST /api/series/{seriesId}/bible/entries/{entryId}/revisions/{id}/endorse` (Duyệt kịch bản).
    - `POST /api/series/{seriesId}/bible/entries/{entryId}/revisions/{id}/request-rework` (Yêu cầu vẽ lại kèm lý do).
    - `POST /api/series/{seriesId}/bible/entries/{entryId}/revisions/{id}/lock` (Chốt khóa Canon chính thức).
    - Xóa bỏ hoàn toàn endpoint `/unlock`, duy trì tính bất biến bằng luồng `/supersede` (tạo revision kế thừa mới).
- **Frontend:**
  - Huy hiệu trạng thái động: `Bản nháp`, `Chờ Writer duyệt`, `Cần vẽ lại`, `Writer đã duyệt`, `Đã chốt Canon`.
  - Bộ nút hành động ngữ cảnh tùy theo vai trò: Writer thấy nút "Xác nhận cốt truyện" và "Yêu cầu vẽ lại" (kèm popup nhập lý do); Producer thấy nút "Chốt khóa Canon 🔒".

#### 4. Hàng đợi Thiết kế Bible cho Họa sĩ (Bible Design Queue)
- **Backend (`GetBibleDesignQueueQuery`):** Endpoint truy vấn danh sách tất cả các mục Bible đang ở trạng thái `Draft` hoặc `ReworkRequired`.
- **Frontend:** Thanh thông báo / Widget **Bible Design Queue** nổi bật trên đầu trang Series Bible, giúp Artist nắm bắt ngay các nhân vật, trang phục hoặc bối cảnh cần hoàn thiện gấp kèm lý do yêu cầu sửa từ Biên kịch.

#### 5. Cổng Kiểm tra Series Bible theo Chương (Chapter-Scoped Bible Gate)
- **Cơ chế rào chắn:** Trước khi kịch bản được đưa vào vẽ, hệ thống kiểm tra toàn bộ thực thể được đề cập trong chương.
- **Backend (`CheckChapterBibleGateQuery` - `GET /api/chapters/{chapterId}/bible-gate`):**
  - Quét toàn bộ `speakerCharacterId` trong thoại và các thực thể Bible được gắn thẻ trong chương.
  - Đối chiếu phiên bản có hiệu lực (`effectiveAtChapter`). Nếu phát hiện nhân vật hoặc bối cảnh chưa được khóa Canon (`CanonLocked`), trả về cảnh báo `CHARACTER_NOT_LOCKED` hoặc `ENTRY_NOT_LOCKED`.
- **Frontend:** Nút kiểm tra **Bible Gate** trực tiếp trên thanh công cụ kịch bản. Khi bấm sẽ kích hoạt Drawer liệt kê danh sách nhân vật/thực thể hợp lệ và cảnh báo các mục chưa đạt chuẩn Canon để Biên kịch/Producer xử lý kịp thời.

#### 6. Cơ chế Đóng Băng Kịch Bản (Freeze Script & Hand-off Gate)
- **Cơ chế chuyển giao sản xuất:**
  - **Backend (`FreezeChapterScriptCommand` - `POST /api/chapters/{id}/freeze-script`):**
    - Kiểm tra điều kiện tiên quyết từ Bible Gate.
    - Cập nhật cờ `IsScriptFrozen = true`, `ScriptFrozenAt`, `ScriptFrozenById` trên bảng `chapters`.
    - Đưa toàn bộ kịch bản của chương về trạng thái **Chỉ Đọc (Read-Only)** đối với Writer.
    - Tự động kích hoạt mở khóa công đoạn sản xuất hình ảnh đầu tiên (`Thumbnail / Layout`) cho Họa sĩ.
  - **Frontend:**
    - Producer có nút bấm nổi bật: **"Duyệt kịch bản & Đưa vào sản xuất"**.
    - Giao diện Writer chuyển sang chế độ an toàn có nhãn cảnh báo: **"🔒 Kịch bản đã đóng băng"**.

---

### PHẦN II: CẢI TIẾN TRẢI NGHIỆM GIAO DIỆN (UI/UX) & CÔNG CỤ ĐỌC THỬ

#### 1. Hệ Thống Thiết Kế Manga Paper x Ink x Tangerine (Producer Dashboard)
- Tái cấu trúc trang tổng quan sản xuất (`StudioOverviewView`):
  - Bố cục trang dàn trải toàn chiều rộng (**Full-width Chapter Tracker**), cân bằng 50/50 giữa danh sách nhân sự và bảng cảnh báo rủi ro tiến độ.
  - Tinh giản Modal giao việc (**Create Assignment Modal**): Gom nhóm các trường phụ thuộc dạng thu gọn (collapsible), lược bỏ các nhãn kỹ thuật không cần thiết.
  - Đồng bộ hệ font chữ: Sử dụng font **`Be Vietnam Pro`** hỗ trợ tiếng Việt hoàn hảo, kết hợp font có chân (Serif) phong cách truyện tranh Nhật Bản cao cấp.
  - Loại bỏ các thành phần rác: Gỡ bỏ huy hiệu trạng thái AI thừa ở thanh điều hướng trên cùng và nút kiểm toán AI không cần thiết.

#### 2. Bộ Đọc Chương Đa Năng (Chapter Reader Modal Polish)
- Tích hợp thanh trượt hình thu nhỏ (**Thumbnail Strip**) bên dưới chân màn hình đọc, cho phép độc giả và Producer lướt nhanh giữa các trang đôi và trang đơn.
- Tự động nạp dữ liệu từ danh mục thực tế (Real Catalog Reader API) thay thế cho màn hình giả lập tĩnh cũ.
- Xử lý mã lỗi `409 CHAPTER_READ_ONLY` (BR-12): Hiển thị thông báo thân thiện giải thích chương đang trong chế độ bảo vệ chỉ đọc thay vì bật hộp thoại xung đột phiên bản.

#### 3. Bàn Làm Việc Họa Sĩ & Nhãn Phạm Vi (My Work View Scope Label)
- Bổ sung nhãn phạm vi công việc chi tiết (`scopeLabel`), ví dụ: `Trang 1 - 4`, `Phân cảnh 2`, `Bìa chương`.
- Giúp Họa sĩ, Họa sĩ chèn chữ (Letterer) lập tức nhận diện phạm vi được phân công mà không cần mở sâu vào từng trang chi tiết.
- Tích hợp tính năng chống ghi đè Canvas và truy vết lịch sử chỉnh sửa theo mã băm hình ảnh.

---

## 3. CẤU TRÚC DỮ LIỆU & MIGRATION DATABASE

- **Migration ID:** `20261023075951_AddFreezeScriptAndBibleReviewLifecycle`
- **Các thay đổi lược đồ cơ sở dữ liệu:**
  1. Bảng `chapters`:
     - `is_script_frozen` (`boolean`, mặc định `false`): Trạng thái đóng băng kịch bản.
     - `script_frozen_at` (`timestamptz`, nullable): Thời điểm kịch bản được đóng băng.
     - `script_frozen_by_id` (`uuid`, nullable): ID người dùng (Producer) thực hiện đóng băng.
  2. Bảng `bible_entry_revisions`:
     - `artist_user_id` (`uuid`, nullable): ID họa sĩ thực hiện bản phác thảo tham chiếu.
     - `review_status` (`varchar(30)`, mặc định `'Draft'`): Trạng thái vòng đời 2 tầng.
     - `rework_feedback` (`varchar(1000)`, nullable): Nội dung nhận xét yêu cầu vẽ lại.
  3. Bảng `series_members`:
     - Thêm điều kiện lọc `is_deleted = false` cho Unique Index `ix_series_members_series_user`.

---

## 4. HƯỚNG DẪN KIỂM CHỨNG & VẬN HÀNH (VERIFICATION GUIDE)

### Bước 1: Áp dụng Migration trên Backend
Chạy lệnh sau tại thư mục `PanelForge_FA26SE251`:
```powershell
dotnet ef database update --project src/PanelForge.Infrastructure --startup-project src/PanelForge.Api
```

### Bước 2: Khởi chạy Backend API
```powershell
dotnet run --project src/PanelForge.Api
```
Truy cập Swagger UI tại `http://localhost:5044/swagger` để kiểm tra các endpoint mới:
- `POST /api/chapters/{id}/freeze-script`
- `GET /api/chapters/{id}/bible-gate`
- `POST /api/series/{seriesId}/bible/entries/{entryId}/revisions/{id}/endorse`
- `POST /api/series/{seriesId}/bible/entries/{entryId}/revisions/{id}/request-rework`
- `POST /api/series/{seriesId}/bible/entries/{entryId}/revisions/{id}/lock`

### Bước 3: Khởi chạy Frontend
Tại thư mục `panelforge-fe`:
```powershell
npm run dev
```
Đăng nhập với các vai trò tương ứng để trải nghiệm:
- **Biên kịch (`Writer`):** Soạn thảo kịch bản độc lập tại `/script`. Bấm nút kiểm tra *Bible Gate*.
- **Họa sĩ (`Artist`):** Vào `/bible` xem hàng đợi *Bible Design Queue*, tải lên bản vẽ tham chiếu nhân vật định dạng PNG/JPEG.
- **Biên tập / Biên kịch (`Writer` / `Editor`):** Duyệt bản vẽ (*Xác nhận cốt truyện*) hoặc yêu cầu vẽ lại kèm lý do.
- **Nhà sản xuất (`Producer`):** Thực hiện *Khóa Canon 🔒* Series Bible; duyệt và bấm *Đóng băng kịch bản* để đưa chương vào khâu vẽ.
