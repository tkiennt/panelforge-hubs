# TÀI LIỆU ĐẶC TẢ KIẾN TRÚC & TRIỂN KHAI: CHAPTER & SCRIPT MANAGEMENT

> **Dự án:** PanelForge Manga Production Platform (`SEP490_FA26SE251`)  
> **Kiến trúc áp dụng:** .NET 9 Clean Architecture + React 19 / TypeScript + Zero-Trust RBAC + Content-Addressed Storage (CAS SHA-256).  
> **Ngày cập nhật:** 12/11/2026 (Đồng bộ chuẩn Master Spec V2.6 Final).  
> **Tài liệu tham chiếu gốc:** [`PANELFORGE_MASTER_SPECIFICATION_V2_6.md`](../V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6.md)

---

## 1. TỔNG QUAN PHÂN HỆ CHAPTER & SCRIPT (CHUẨN V2.6 FINAL)

Phân hệ **Chapter (Quản lý Chương)** và **Script (Biên kịch Kịch bản Manga)** đóng vai trò là "trái tim" trong giai đoạn tiền kỳ (Pre-production) của quy trình sản xuất truyện tranh Manga trên PanelForge:

1. **Chapter Management:** Thiết lập vòng đời chương truyện, tiến độ công đoạn (Pipeline Stages), ngày phát hành mục tiêu, và kiểm soát quyền hạn Zero-Trust giữa Producer và các thành viên sáng tác (Writer, Artist, Letterer, Editor). Trạng thái Chapter được tách biệt hoàn toàn khỏi tiến độ vẽ/kịch bản.
2. **Script Flow Tinh Gọn (V2.6 Final):** Loại bỏ tầng `Scene` khỏi giao diện soạn thảo, tổ chức kịch bản trực tiếp theo 3 cấp tự nhiên bên dưới. **Quyết định D2 (chốt 2026-11-12):** mỗi Chương có một Scene mặc định ẩn do hệ thống tạo; `scene_id` giữ `NOT NULL` dưới DB (không đổi sang `nullable`) để giữ nguyên lịch sử revision và luồng AI theo Scene.
   - **Page (Trang truyện):** Sắp xếp theo thuật toán `LexoRank`.
   - **Panel (Khung tranh):** Tọa độ BoundingBox `{x, y, w, h}` chuẩn hóa (0..1 trên khung 1200×1800) và `panelIndex`.
   - **Panel Contents (Nội dung bên trong Panel):** Danh sách có thứ tự gồm 4 thành phần: `ACTION_DIRECTION` (vẽ gì, chữ thuần; nhân vật quần chúng tả trực tiếp, không cần Bible), `DIALOGUE/THOUGHT` (thoại/suy nghĩ kèm tên người nói `speaker_label`), `NARRATION` (hộp dẫn chuyện), `SFX` (hiệu ứng âm thanh).
3. **Cơ chế Tiền kỳ & Gate 1 (Q16, BR-35):** tên người nói tự khớp tên/bí danh mục Bible, chưa có thì hệ thống tự tạo mục nháp (Writer gắn cờ *Quần chúng* nếu không cần); nhân vật trong lời dẫn được Writer bôi đen để tham chiếu. Tất cả lập thành **Danh sách thực thể chương** (không chặn mạch viết). Producer bấm 1 nút duy nhất **Approve Script & Start Production** tại Gate 1: chặn nếu còn thực thể (không Quần chúng) chưa gắn bản `CanonLocked`; thành công thì đóng băng kịch bản (`is_script_frozen = true`), khoá `chapter_bible_bindings` và mở bảng Kanban.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> PreProduction: Đang viết Script & thiết kế Bible
    PreProduction --> InProduction: Gate 1 (Producer duyệt Script Freeze)
    InProduction --> ChapterApproved: Gate 3 (100% Trang Approved ➔ Tạo Snapshot)
    ChapterApproved --> InProduction: Producer Reopen kèm lý do Audit
    ChapterApproved --> HandedOffAndPublished: Producer bàn giao / phát hành (publishAt <= UtcNow)
```

---

## 2. KIẾN TRÚC BACKEND (.NET 9 CLEAN ARCHITECTURE)

### 2.1. Domain Entities & Enums

#### 1. `Chapter` (`PanelForge.Domain.Entities.Content.Chapter`)
- **Khóa chính:** `Id` (`Guid`).
- **Khóa ngoại:** `SeriesId` (`Guid`), `WorkspaceId` (`Guid`).
- **Thuộc tính tiến độ:**
  - `ChapterNumber` (`int`): Thứ tự chương (1, 2, 3...).
  - `Title` (`string`): Tiêu đề chương.
  - `TargetReleaseDate` (`DateTime?`): Hạn chót phát hành mục tiêu.
  - `Status` (`ChapterStatus`): Vòng đời chương chuẩn V2.6 (`PreProduction`, `InProduction`, `ChapterApproved`, `HandedOffAndPublished`).
  - `IsScriptFrozen` (`bool`): Cờ khóa kịch bản (ngăn chặn chỉnh sửa kịch bản khi đã bước sang Gate 1 sản xuất).
  - `PipelineStages` (`ICollection<ChapterStage>`): Danh sách công đoạn sản xuất (`PencilInProgress`, `InkAndLetterTrack`, `CompositeUnderReview`, `Approved`).

#### 2. Cấu trúc Kịch bản Trực tiếp trên `Chapter` / `Page` / `Panel` (Quyết định D5)
- Bỏ hoàn toàn entity `ChapterScript` tách rời; nội dung kịch bản được lưu trữ trực tiếp theo cấu trúc `Chapter -> Page (LexoRank) -> Panel -> Content (ACTION_DIRECTION / DIALOGUE / NARRATION / SFX)`.
- Truy xuất nhanh theo `ChapterId` và hỗ trợ `ContentHash` (SHA-256) / `IsScriptFrozen` trực tiếp trên `Chapter`.

#### 3. `ChapterStatus` (`PanelForge.Domain.Enums.ChapterStatus`)
Chuẩn hóa 4 trạng thái cốt lõi: `PreProduction`, `InProduction`, `ChapterApproved`, `HandedOffAndPublished` (đã gộp `Locked` vào `ChapterApproved` theo Q1; `Published` là trạng thái trên từng ấn bản ngôn ngữ `ChapterEdition`).

### 2.2. Domain Services & Quy Tắc Nghiệp Vụ

#### 1. `ChapterProductionStateMachine`
- Quản lý việc chuyển đổi trạng thái hợp lệ giữa các bước trong quy trình.
- **Quy tắc bắt buộc:**
  - Chuyển từ `PreProduction` sang `InProduction` chỉ xảy ra tại Gate 1 khi Producer bấm **Approve Script & Start Production**, kích hoạt đóng băng kịch bản `IsScriptFrozen = true`.
  - Chuyển từ `InProduction` sang `ChapterApproved` chỉ xảy ra tại Gate 3 khi kiểm tra chốt an toàn `ChapterLockGate` (BR-12): 100% Trang `Approved`, 0 ChangeRequest mở, 0 cờ Impact, 0 lỗi Blocking.
  - Chuyển từ `ChapterApproved` sang `HandedOffAndPublished` do **Producer** thực hiện bàn giao / phát hành; **Publisher** chỉ sử dụng Publisher Portal (chỉ đọc nội dung sản xuất) và cấu hình thương mại (giá VNĐ, số trang xem trước miễn phí) trên từng `ChapterEdition`.

#### 2. `ProductionAccessGuard` (Zero-Trust RBAC Gate)
- **Tạo và Xóa Chapter (`CreateChapter`, `DeleteChapter`):** Duy nhất người dùng có vai trò `Producer` hoặc `WorkspaceOwner` mới có quyền thực thi. Người dùng vai trò `Writer`, `Artist`, `Letterer`, `Editor` chỉ được xem hoặc nhận task phân công.
- **Biên kịch (`EditScript`):** Độc quyền cho `Writer` được phân công (`Producer` chỉ đọc, không sửa kịch bản — BR-07). Nếu `IsScriptFrozen == true`, mọi vai trò (kể cả Writer) đều bị từ chối sửa nội dung trừ khi `Producer` thực hiện thao tác mở khóa kịch bản đặc quyền (`UnfreezeScriptCommand`).

### 2.3. Hợp Đồng API RESTful (API Contracts)

| Phương thức | Đường dẫn API | Vai trò tối thiểu | Chức năng |
|---|---|---|---|
| `POST` | `/api/chapters` | **Producer** | Tạo mới chương truyện trong Series |
| `GET` | `/api/chapters/series/{seriesId}` | Thành viên Workspace | Lấy danh sách chương (hỗ trợ phân trang) |
| `GET` | `/api/chapters/{id}` | Thành viên Workspace | Lấy thông tin chi tiết của 1 chương |
| `PUT` | `/api/chapters/{id}` | **Producer** | Cập nhật tiêu đề, số chương, ngày phát hành mục tiêu |
| `DELETE` | `/api/chapters/{id}` | **Producer** | Xóa chương (Yêu cầu xác nhận xóa) |
| `GET` | `/api/chapters/{id}/script-versions` · `/working-copy` · `/{versionId}` | Thành viên Workspace | Danh sách phiên bản, bản đang sửa, một phiên bản (Q15) |
| `POST` | `/api/chapters/{id}/script-versions` | **Writer** | Lưu = commit một `ScriptVersion` (trùng nội dung thì không tạo) |
| `POST` | `/api/chapters/{id}/submit-script` · `/recall-script` | **Writer** | Gửi duyệt (`Draft/InReview → InReview`) · Hủy gửi (`InReview → Draft`) |
| `GET` / `POST` | `/api/chapters/{id}/script-comments` | Thành viên / **Editor** | Góp ý theo dòng (không đổi trạng thái) |
| `POST` | `/api/chapters/{id}/freeze-script` | **Producer** | Bắt đầu sản xuất (Gate 1): `InReview → Frozen`, chương `PreProduction → InProduction`; chặn nếu Bible chưa khoá Canon (BR-35) |
| `POST` | `/api/chapters/{id}/unfreeze-script` | **Producer** | Mở lại kịch bản kèm lý do (`Frozen → Draft`) |

> Endpoint `request/approve/reject-script-reopen` còn trong code sẽ bị gỡ (câu hỏi 25, SCR-09). Producer chỉ đọc nội dung kịch bản (BR-07).

---

## 3. KIẾN TRÚC FRONTEND (REACT 19 + TYPESCRIPT)

### 3.1. Phân Rã Thành Phần (Component Architecture)

```
panelforge-fe/src/
├── roles/producer/
│   ├── modals/
│   │   ├── SeriesChaptersModal.tsx        # Modal Quản lý danh sách, thêm, sửa, xóa chương
│   │   └── SeriesChaptersModal.test.tsx   # Kiểm thử đơn vị giao diện quản lý chương
│   └── views/
│       ├── DashboardView.tsx              # Bảng điều khiển tiến độ tổng quan theo chương
│       └── DashboardView.test.tsx         # Kiểm thử bảo vệ không sập màn hình trắng
├── roles/writer/
│   ├── components/script/
│   │   ├── chapter-selection/
│   │   │   └── ChapterSelectionView.tsx   # Cổng chọn chương cho Writer (Gate Producer-only)
│   │   └── flow/
│   │       ├── ScreenplayFlowEditor.tsx   # Trình soạn thảo kịch bản Screenplay Flow
│   │       ├── scriptFlowAdapter.ts       # Chuyển đổi hai chiều giữa Data Model và Block Nodes
│   │       ├── types.ts                   # Định nghĩa Block Types (Page, Panel, Dialogue...)
│   │       └── nodes/
│   │           └── ScriptLineBlockNode.ts # BlockNode tùy biến với giao diện Screenplay
│   └── views/
│       ├── ScriptEditorView.tsx           # Màn hình chính tích hợp kịch bản, Bible Drawer, Thumbnail Studio
│       └── ScriptEditorView.test.tsx      # Kiểm thử quyền thao tác kịch bản
└── shared/
    └── components/
        ├── ErrorBoundary.tsx              # Lá chắn ngăn sập giao diện toàn ứng dụng
        ├── RouteFallback.tsx              # Spinner tải trang mượt mà
        └── TypeToConfirmModal.tsx         # Hộp thoại xác nhận gõ "DELETE" để xóa an toàn
```

### 3.2. Trình Soạn Thảo Screenplay Flow Manga (`ScreenplayFlowEditor.tsx`)

Trình soạn thảo Screenplay Flow được thiết kế riêng biệt cho việc sản xuất truyện tranh với các tính năng vượt trội:

1. **Khối phân trang & khung ảnh tự động (Page & Panel Hierarchy):**
   - Khối `page_heading` đại diện cho 1 trang truyện (`# Page 1`, `Trang 2`).
   - Khối `panel_heading` đại diện cho khung truyện. Trình biên tập tự động tính số thứ tự khung theo trang (`1.1`, `1.2`, `1.3`...) khi người dùng gõ phím hoặc thêm khối mới.
2. **Bảng công cụ phím tắt nổi (Floating Quick Palette):**
   - Thanh công cụ gắn bên phải màn hình cho phép chèn 1-chạm các khối chuẩn Manga:
     - `Trang (# Page)`: Ngắt trang mới.
     - `Khung (Panel)`: Thêm khung hình mới (kèm 1 Scene mặc định ẩn dưới DB theo D2).
     - `Hành động (Action)`: Mô tả vẽ gì, góc nhìn (tên nhân vật viết bình thường; Writer bôi đen để tham chiếu tới Series Bible — chỉ trên dòng Mô tả, Lời dẫn, SFX; không trên tiêu đề Panel và lời thoại, Q19).
     - `Lời thoại (Dialogue / Thought)`: Thoại/suy nghĩ kèm `speaker_character_id`.
     - `Dẫn chuyện (Narration)`: Hộp dẫn chuyện.
     - `Hiệu ứng (SFX)`: Âm thanh truyện tranh (`BÙM!`, `XẸT!`).
3. **Phím tắt Comic Markdown:**
   - Gõ `# Page 1` hoặc `Trang 1` và nhấn Enter $\rightarrow$ Tự động chuyển đổi thành khối Trang.
   - Gõ `Panel` hoặc `Khung` $\rightarrow$ Tự động đánh số thứ tự panel tiếp theo của trang hiện hành.
4. **Con trỏ Screenplay độ tương phản cao:**
   - Hiển thị con trỏ cam độ tương phản cao và hiệu ứng đánh dấu dòng đang nhập, tối ưu trải nghiệm gõ kịch bản tập trung (Writer Focus Mode).

### 3.3. Cơ Chế Chống Màn Hình Trắng & Phục Hồi Lỗi (Zero Blank-Screen Architecture)

- **Nguyên lý:** Mọi truy cập thuộc tính mảng/đối tượng từ API tiến độ đều có fallback an toàn (`progress?.chapters?.length`, `c.stages || []`, `progress.workload || []`, kiểm tra `!isNaN(new Date(dueDate).getTime())`).
- **`ErrorBoundary`:** Đặt tại tầng layout `AppShell` và gốc `App`. Khi xảy ra lỗi ngoại lệ, người dùng nhận được hộp thoại cảnh báo thân thiện hiển thị chi tiết lỗi kèm nút **"Tải lại trang"**, không bao giờ bị rơi vào màn hình trắng vô định.
- **`RouteFallback`:** Thay thế `fallback={null}` bằng biểu tượng đang tải rõ ràng, tránh cảm giác ứng dụng bị đơ khi tải component lười.

---

## 4. HƯỚNG DẪN THAO TÁC NGƯỜI DÙNG (USER GUIDE)

### 4.1. Cách Tạo & Quản Lý Chương
1. Đăng nhập với vai trò **Producer**.
2. Truy cập vào Dashboard bộ truyện: `/workspaces/{workspaceId}/series/{seriesId}/dashboard`.
3. Nhấp vào nút **"Quản lý chương (Duyệt)"** ở góc trên bên phải.
4. Nhập tiêu đề, số chương, ngày phát hành dự kiến và bấm **"Tạo chương"**.

### 4.2. Cách Xóa Chương An Toàn (Type-to-Confirm)
1. Trong modal **Quản lý chương**, tìm đến dòng chương muốn xóa.
2. Nhấp vào biểu tượng thùng rác màu đỏ (**Xóa chương**).
3. Hộp thoại xác nhận an toàn sẽ hiện lên. Người dùng bắt buộc phải gõ đúng chữ **`DELETE`** vào ô xác nhận để kích hoạt nút xóa. Điều này loại bỏ hoàn toàn rủi ro vô tình xóa nhầm dữ liệu chương đang sản xuất.
4. Tại giao diện soạn kịch bản (`ScriptEditorView`), Producer cũng có thể nhấn nút thùng rác trên thanh điều hướng để xóa chương hiện hành.

### 4.3. Cách Soạn Kịch Bản & Khóa Kịch Bản
1. Vào mục **Kịch bản (Script)** từ menu điều hướng.
2. Lựa chọn chương cần viết trong danh sách.
3. Sử dụng thanh công cụ bên phải hoặc gõ trực tiếp markdown để tạo cấu trúc Trang và Khung ảnh.
4. Hệ thống tự động lưu bản nháp theo cơ chế Debounce.
5. Khi hoàn tất và được Producer phê duyệt, kịch bản sẽ được chuyển sang trạng thái **Đóng băng (Frozen)** để bảo toàn nội dung, ngăn chặn việc sửa đổi kịch bản trong lúc họa sĩ đang vẽ Storyboard.

