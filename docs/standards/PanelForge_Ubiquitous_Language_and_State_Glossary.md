# PanelForge — Bộ Ngôn Ngữ Chung (Ubiquitous Language) & Quy Chuẩn Trạng Thái Hệ Thống

> **Dự án:** PanelForge Manga Production Platform (`FA26SE251` / `GFA26SE140`)  
> **Mục đích:** Thiết lập từ vựng chuẩn hóa duy nhất (Single Source of Truth) giữa **Mã nguồn (.NET, React, Flutter)**, **Tài liệu đồ án (Report 3 SRS, Report 4 SDD)**, và **Văn bản cam kết Hội đồng (BM04 Review 2)**.  
> **Áp dụng:** Giải quyết triệt để lỗi dùng sai trạng thái, lẫn lộn giữa thực thể cha - con, và không đồng nhất danh từ.  
> **Tài liệu bổ trợ chuyên sâu:** Xem [Quy chuẩn Đặt tên State Machine & Khung Chuẩn Hóa](file:///d:/FPT-STUDY/10_FALL-2026/SEP490/Report/02_Reports/PanelForge_State_Machine_Naming_Standards.md) (Ánh xạ ngữ pháp Parts of Speech, Casing, XState v5 `dot.case`, Guards/Actions).

---

## 1. NGUYÊN TẮC CỐT LÕI VỀ TRẠNG THÁI (CORE STATE PRINCIPLES)

Theo hướng dẫn chuyên đề Workflow của Trường (*slide W03, W07, W13*):
1. **Một thực thể (Entity) chỉ sở hữu vòng đời của chính nó:** Không được gán trạng thái của thực thể con (`Assignment`, `Script`) vào thực thể cha (`Chapter`).
2. **Năm khái niệm không được trùng lặp:**
   - **ChapterStatus:** Chương đang sản xuất, đã duyệt hay đã phát hành ra công chúng?
   - **ScriptLifecycle:** Kịch bản đang soạn, đã đóng băng hay đang xin mở lại?
   - **AssignmentStatus:** Người được giao việc (Artist/Letterer) đang làm đến đâu?
   - **StageProgressStatus:** Khung tranh / Trang đang ở nấc thang công đoạn nào?
   - **SubmissionStatus:** Bản nộp bài nào đang chờ duyệt, bản nào bị thay thế?
3. **Mỗi bước chuyển trạng thái (Transition) bắt buộc có:** Sự kiện kích hoạt (Event/Trigger), Điều kiện tiên quyết (Guards/BR), và Quyết định phân quyền (Actor/RBAC).

---

## 2. BỘ NGÔN NGỮ CHUNG (UBIQUITOUS LANGUAGE)

### 2.1. Phân vai & Người dùng (Roles & Actors)

| Thuật ngữ Tiếng Anh | Tiếng Việt chuẩn | Phạm vi | Mô tả trách nhiệm |
|---|---|---|---|
| **Administrator** | Quản trị viên hệ thống | Toàn hệ thống | Quản lý tài khoản (bao gồm duy nhất 1 tài khoản Publisher toàn hệ thống, Q12), tài khoản ngân hàng nền tảng (Q13), cấp quyền tạo Studio, quota AI. Không can thiệp nội dung. |
| **Producer** | Giám đốc sản xuất / Chủ Studio | Workspace | Quản lý workspace, tạo Series, đóng băng kịch bản (Gate 1, *Bắt đầu sản xuất*) và mở lại kịch bản; chỉ đọc Series Bible ngoài quyền yêu cầu vẽ lại concept (Q20, Q22), giao việc Page/Panel, nghiệm thu chương (Gate 3) và phát hành (Q7). |
| **Writer** | Tác giả kịch bản | Workspace / Series | Độc quyền sáng tác kịch bản (`Page -> Panel -> Content`), bôi đen tham chiếu Bible, gắn cờ Quần chúng, viết định nghĩa mục nháp, đổi biến thể theo chương khi cần (mặc định tự đề xuất, Q22), góp ý / yêu cầu vẽ lại concept Bible (Q19, Q20). |
| **Artist** | Họa sĩ (Chì / Mực) | Workspace / Series | Vẽ Concept Art Bible, thực hiện Pencil & Ink trên Page được giao (mặc định có cả `graphic:write` và `letter:write` theo BR-31). |
| **Letterer** | Người đặt thoại & SFX | Workspace / Series | Vai trò phụ việc tùy chọn (`letter:write` only): bố trí Position Record bóng thoại `{x,y,w,h}`, nội dung đa ngôn ngữ và SFX. |
| **Editor** | Biên tập viên | Workspace / Series | Xác nhận concept Series Bible = khoá Canon (Q20); duyệt Gate 2 (`CompositeUnderReview`), khoanh vùng tạo Change Request (sinh nhiều CR chung `group_id` nếu vắt nhiều Panel ≥ 15%), duyệt bản dịch `ChapterEdition`. |
| **Publisher** | Đối tác phát hành (1 tài khoản duy nhất) | Publisher Portal | Xem/tải gói bàn giao & PreviewLink chỉ đọc; **quy định thương mại** (Free/Trả phí, `price_vnd`, `free_preview_pages`) theo từng ấn bản ngôn ngữ (Q7, Q12). Không sửa nội dung hay phát hành. |
| **External Reviewer** | Người đánh giá bên ngoài | Ngoài nền tảng | Nhận link xem thử có watermark (`PreviewLink`), gửi nhận xét trước ngày xuất bản. Không có tài khoản WS. |
| **Reader** | Độc giả | Web Catalog / Mobile Reader | Đăng ký tài khoản `User`, chọn ngôn ngữ đọc, nạp Ví VNĐ (`wallets`) và mở khóa từng ấn bản ngôn ngữ (`edition_entitlements`). |

---

### 2.2. Danh mục Thực thể Nghiệp vụ (Business Entities)

| Thực thể (Entity) | Cấp độ (Scope) | Định nghĩa chuẩn |
|---|---|---|
| **StudioWorkspace** | Toàn cục | Không gian làm việc khép kín của một Studio, độc lập về dữ liệu, thành viên và quota. |
| **Series** | Workspace | Một bộ truyện tranh, có cấu trúc pipeline công đoạn, hướng đọc (RTL/LTR), Bible riêng. |
| **SeriesBible** | Series | Hồ sơ kinh thánh bối cảnh của Series; lưu trữ thiết kế nhân vật, sự kiện, địa điểm, luật thế giới. |
| **BibleEntry** | SeriesBible | Một nhân vật / địa điểm / đạo cụ (hoặc thuật ngữ, quy tắc, sự kiện); có `name`, `aliases`, cờ **Quần chúng** (`is_crowd`) và cờ nháp chờ định nghĩa (`IsStub`) (Q16). |
| **BibleEntryRevision** | BibleEntry | Một bản tạo hình của mục, gắn **nhãn biến thể** (`variant_label`, ví dụ "Lúc nhỏ"), ảnh concept CAS SHA-256; không gắn số chương (Q16, BR-15). |
| **Danh sách thực thể chương** (`chapter_bible_bindings`) | Chapter | Các mục Bible có trong kịch bản chương (người nói tự khớp/tự tạo, đoạn Writer bôi đen) và bản tạo hình chương dùng; khoá cùng kịch bản ở Gate 1 (BR-35). |
| **Chapter** | Series | Một chương truyện (gồm `ChapterStatus`, `ScriptStatus`, các `ScriptVersion` và tập hợp `Page`). |
| **ScriptVersion** | Chapter | Phiên bản kịch bản bất biến tạo mỗi lần Writer lưu (mã băm SHA-256); chương giữ con trỏ bản đã gửi duyệt (Q15). |
| **ChapterEdition** | Chapter × Lang | Ấn bản theo từng ngôn ngữ (`original_language` / `release_languages`) với trạng thái xuất bản và giá VNĐ riêng (Q9, Q10). |
| **Scene (Ẩn dưới DB)** | Chapter | Một Scene mặc định ẩn do hệ thống tạo cho mỗi Chapter (`scene_id` NOT NULL dưới DB theo D2); không hiển thị trên UI kịch bản và đã bỏ `ChapterScript` (D5). |
| **PanelContent** | Panel | Đơn vị nội dung trong Panel (`ACTION_DIRECTION`, `DIALOGUE/THOUGHT`, `NARRATION`, `SFX`), chữ thuần; thoại ghi tên người nói `speaker_label`. Liên kết Bible: người nói tự khớp/tự tạo, lời dẫn do Writer bôi đen tham chiếu; gom ở Danh sách thực thể chương (Q16). |
| **Page** | Chapter | Một trang truyện vật lý trong chương; chứa một hoặc nhiều khung tranh (Panel). |
| **Panel** | Page | Một khung tranh; đơn vị cơ sở để giao việc, kiểm tra chất lượng và cô lập sửa chữa. |
| **Assignment** | Chapter / Panel | Thẻ phân công công việc cụ thể cho một thành viên ở một công đoạn (PipelineStage). |
| **Submission** | Assignment | Lần nộp bài của nghệ sĩ (gắn asset hash và số revision cụ thể). |
| **ChangeRequest** | Submission | Phiếu yêu cầu chỉnh sửa do Editor phát hành, khoanh vùng lỗi trên panel hoặc ảnh. |
| **StageProgress** | Panel × Stage | Tiến độ kiểm duyệt cổng kỹ thuật của một panel qua từng công đoạn. |
| **AiWorkflowRun** | Scene / Chapter | Một phiên chạy ngầm của tiến trình AI nhiều bước (Multi-agent run). |
| **AiSuggestion** | AiWorkflowRun | Một đề xuất cụ thể do AI đưa ra; bắt buộc chờ con người phê chuẩn. |
| **PreviewLink** | Chapter | Đường dẫn xem trước bảo mật có giới hạn thời gian, sinh watermark cho người ngoài. |
| **PreviewFeedback** | PreviewLink / Mobile | Nhận xét của độc giả/reviewer gắn với vị trí panel hoặc chương đang xem. |

---

## 3. BẢNG QUY CHUẨN TRẠNG THÁI TOÀN HỆ THỐNG (STATE ENUMS & MACHINES)

### 3.1. ChapterStatus (Vòng đời Chương — chuẩn V2.6 Final)
*Thực thể: `Chapter` — Người quyết định: `Producer`*

```mermaid
stateDiagram-v2
    [*] --> PreProduction: Khởi tạo chương
    PreProduction --> InProduction: Producer duyệt Gate 1 (Script Freeze)
    InProduction --> ChapterApproved: Producer nghiệm thu Gate 3 (100% Page Approved)
    ChapterApproved --> InProduction: Producer mở lại chương kèm lý do Audit (BR-12)
    ChapterApproved --> HandedOffAndPublished: Producer bàn giao & phát hành (publishAt <= UtcNow)
    HandedOffAndPublished --> [*]
```

| Tên trạng thái | Ý nghĩa chuẩn | Quyền chuyển | Ghi chú & Điểm sửa |
|---|---|---|---|
| `PreProduction` | Đang chuẩn bị kịch bản & Series Bible trước Gate 1. | Mặc định | Khóa sửa kịch bản khi sang `InProduction`. |
| `InProduction` | Chương đang trong quá trình vẽ tranh & đặt thoại. | Producer | Bắt đầu từ Gate 1. |
| `ChapterApproved` | Producer xác nhận toàn bộ trang đã hoàn tất và đạt Gate 3. | Producer | Gộp `Locked` cũ vào `ChapterApproved` theo **Q1**. |
| `HandedOffAndPublished` | Chương đã bàn giao & phát hành công khai cho độc giả. | Producer | `Published` là trạng thái trên từng `ChapterEdition` (**Q7, Q10**). |

> [!WARNING]
> **ĐIỂM SỬA QUAN TRỌNG:** Loại bỏ hoàn toàn chữ `Locked` khỏi vòng đời Chapter. Không đưa `Frozen` hay `InProgress` vào `ChapterStatus`!

---

### 3.2. ScriptStatus (Vòng đời Kịch bản trên Chapter — Q15)
*Thực thể: `Chapter.ScriptStatus` — Quyết định: `Writer` (gửi / hủy gửi), `Producer` (bắt đầu sản xuất / mở lại)*

```mermaid
stateDiagram-v2
    [*] --> Draft: Writer viết; mỗi lần Lưu tạo ScriptVersion (SHA-256)
    Draft --> InReview: Writer Gửi duyệt (push bản mới nhất; Danh sách thực thể chương đã chốt: mục nháp đã định nghĩa hoặc Quần chúng — Q21, Q22)
    InReview --> InReview: Writer lưu tiếp / Gửi duyệt lại; Editor góp ý theo dòng
    InReview --> Draft: Writer Hủy gửi duyệt
    InReview --> Frozen: Producer Bắt đầu sản xuất (Gate 1; bản hiện tại = bản đã gửi; Bible đã khoá Canon)
    Frozen --> Draft: Producer Mở lại kèm lý do (Audit Log)
```

| Trạng thái | Ý nghĩa |
|---|---|
| `Draft` | Writer viết và lưu tự do; chưa gửi Editor. |
| `InReview` | Đã gửi; Editor đọc đúng bản đã gửi và góp ý theo dòng (không đổi trạng thái, không bắt buộc). Writer vẫn sửa, lưu và gửi lại. |
| `Frozen` | Kịch bản chỉ đọc (sửa trả **409**), chương `InProduction`. Chỉ Producer mở lại; không có luồng Writer xin mở lại (đã bỏ `ScriptReopenStatus`, quyết định câu 25). |

`IsScriptFrozen` là cột phụ bằng `ScriptStatus == Frozen`, giữ cho truy vấn cũ. Producer chỉ đọc nội dung kịch bản (BR-07).

---

### 3.3. BibleRevisionStatus (Vòng đời Series Bible)
*Thực thể: `BibleEntryRevision` — Quyết định: `Writer` (định nghĩa, góp ý, yêu cầu vẽ lại), `Artist` (nộp phiên bản concept, trả lời góp ý), `Editor` (góp ý, yêu cầu vẽ lại, **xác nhận = khoá Canon**), `Producer` (chỉ yêu cầu vẽ lại) — Q19, Q20, Q22*

```mermaid
stateDiagram-v2
    [*] --> Draft: Writer đặc tả / hệ thống tự tạo (IsStub chờ định nghĩa)
    Draft --> ConceptSubmitted: Artist nộp phiên bản concept (CAS SHA-256), mục đã có định nghĩa
    ConceptSubmitted --> ConceptSubmitted: Writer/Editor góp ý, Artist trả lời (theo phiên bản)
    ConceptSubmitted --> ReworkRequired: Writer, Editor hoặc Producer yêu cầu vẽ lại kèm nhận xét (Q22)
    ReworkRequired --> ConceptSubmitted: Artist nộp phiên bản concept mới
    ConceptSubmitted --> CanonLocked: Editor xác nhận = khoá canon (🔒 Bất biến, Q20)
    CanonLocked --> Superseded: Bản thay thế cùng biến thể được khoá (chương gắn bản cũ giữ nguyên, Q23)
```

| Tên trạng thái | Ý nghĩa chuẩn | Actor thực hiện |
|---|---|---|
| `Draft` | Bản mô tả của Writer (chờ Artist vẽ concept). Mục tự tạo từ người nói / bôi đen bắt đầu ở đây với cờ `IsStub` (chờ Writer viết định nghĩa; Artist chưa nộp concept được, `409`). | Writer / hệ thống |
| `ConceptSubmitted` | Artist đã nộp một **phiên bản concept** (bất biến, `v1, v2…`, ảnh CAS SHA-256). Góp ý và trả lời gắn theo phiên bản, không đổi trạng thái. | Artist |
| `ReworkRequired` | Bản vẽ bị trả về kèm nhận xét; Artist nộp phiên bản mới. | Writer, Editor hoặc Producer |
| `CanonLocked` | Editor xác nhận phiên bản đang nộp và khoá vĩnh viễn làm bản mẫu chính thức của Series (khác Artist đã nộp, BR-06). Không thể unlock; sửa thiết kế cùng biến thể qua `/supersede`, tạo hình khác thì thêm biến thể mới. | Editor |
| `Superseded` | Bản thay thế cùng biến thể đã được khoá; không chọn tay được nữa, chương đang gắn bản này vẫn dùng — không tự chuyển (Q23) (suy ra từ sự kiện, không phải giá trị enum). | Hệ thống (khi Editor khoá bản thay thế) |

> `WriterEndorsed` bị bỏ theo Q20 (Editor xác nhận là khoá luôn). Dữ liệu cũ đang `WriterEndorsed` chuyển về `ConceptSubmitted` để Editor xác nhận lại.

Cờ **Quần chúng** (`is_crowd`) trên mục (chỉ Writer bật/tắt, Q19): không cần thiết kế, không vào hàng đợi Artist, không chặn Gate 1; chương đã chốt giữ giá trị cờ lúc chốt.

---

### 3.4. AssignmentStatus (Trạng thái Nhiệm vụ phân công)
*Thực thể: `Assignment` — Quyết định: `Artist`, `Letterer`, `Editor`*

```mermaid
stateDiagram-v2
    [*] --> Assigned: Producer giao việc
    Assigned --> InProgress: Người nhận bắt đầu làm (Stage trước đã Approved)
    Assigned --> Blocked: Dependency chưa hoàn thành
    Blocked --> InProgress: Hết chặn
    InProgress --> Submitted: Người nhận nộp bài (Đủ artifact)
    Submitted --> UnderReview: Editor mở xem bài nộp
    UnderReview --> Approved: Editor duyệt đạt (Khác người nộp, BR-26)
    UnderReview --> ReworkRequired: Editor trả về kèm ChangeRequest
    ReworkRequired --> InProgress: Người nhận vào sửa
    Approved --> ReworkRequired: Kịch bản đổi (Impact Review đánh dấu)
    Assigned --> Cancelled: Producer hủy việc
    Approved --> [*]
```

| Tên chuẩn thống nhất | Tên cũ / Alias trong code | Ý nghĩa chuẩn |
|---|---|---|
| `Assigned` | `Assigned` | Đã giao việc, chờ người nhận bắt đầu. |
| `Blocked` | `Blocked` | Bị chặn do khâu trước chưa xong hoặc phụ thuộc kịch bản. |
| `InProgress` | `InProgress` | Người nhận đang thực hiện công việc. |
| `Submitted` | `Submitted` | Đã nộp bài, tạo Submission Pending. |
| `UnderReview` | `Reviewing` (trong BM04) | Editor đang thẩm định bài nộp. |
| `Approved` | `Approved` / `Done` | Editor duyệt đạt, mở khóa stage kế tiếp. |
| `ReworkRequired` | `ReworkRequired` | Bị trả về từ cổng duyệt hoặc bị cờ Impact Review do kịch bản đổi. |
| `Cancelled` | (Planned RF-17) | Producer hủy bỏ nhiệm vụ hoặc tái phân công. |

> [!TIP]
> **THỐNG NHẤT DANH TỪ:** Thống nhất dùng **`UnderReview`** (trong code) hoặc cho phép hiển thị trên UI là **`In Review` / `Reviewing`**. Trong tài liệu SDD & SRS, ghi rõ: `UnderReview (Reviewing)`.

---

### 3.5. StageProgressStatus (Tiến độ Kỹ thuật của Panel)
*Thực thể: `StageProgress` — Đơn vị: Panel × Stage*

- `InProgress`: Đang vẽ / gia công.
- `Submitted`: Đã nộp bài.
- `InReview`: Editor đang mở xem xét.
- `ChangesRequested`: Có yêu cầu sửa đổi (tương ứng với `ReworkRequired` bên Assignment).
- `Approved`: Công đoạn đã được duyệt, đóng băng chỉ đọc.

---

### 3.6. SubmissionStatus & ChangeRequestStatus
*Thực thể: `Submission` & `ChangeRequest` — Module Quality Control*

- **Submission:**
  - `Pending`: Mới nộp, chờ xem xét.
  - `Approved`: Được chấp thuận.
  - `Rejected`: Bị từ chối.
  - `Superseded`: Bị thay thế khi nghệ sĩ nộp lại bản vẽ mới sau chỉnh sửa.
- **ChangeRequest:**
  - `Open`: Editor phát hành yêu cầu sửa kèm vùng khoanh.
  - `Resolved`: Nghệ sĩ đã sửa xong và đánh dấu giải quyết.
  - `Verified`: Editor kiểm tra lại và xác nhận đã sửa đạt.
  - `Rejected`: Producer/Editor bác bỏ yêu cầu sửa sau khi trao đổi.

---

### 3.7. AI Workflow & Suggestion Status
*Thực thể: `AiWorkflowRun` & `AiSuggestion` — Module AI*

- **AiRunStatus:** `Queued` $\rightarrow$ `Running` $\rightarrow$ `WaitingForHuman` (chờ người) / `Completed` (hoàn tất) / `Failed` (thất bại) / `Interrupted` (bị gián đoạn).
- **AiSuggestionStatus:** `Pending` $\rightarrow$ `Accepted` (chấp nhận, tạo revision) / `Rejected` (từ chối, không đổi gì) / `ChangesRequested` (yêu cầu sửa).

---

## 4. MA TRẬN ĐỐI CHIẾU ĐIỂM LỆCH (DISCREPANCY MATRIX) & GIẢI PHÁP KHẮC PHỤC

| Mục so sánh | Trong Code hiện tại | Trong Commitment BM04 | Trong Report 3 (SRS) / Report 4 (SDD) | Điểm lệch & Nguy cơ | Giải pháp chuẩn hóa thống nhất |
|---|---|---|---|---|---|
| **1. Vòng đời Chapter** | `InProduction, Approved, Locked, Published` | `InProduction → Approved → Published` | Nhiều chỗ còn ghi `Locked` | Code và báo cáo còn tồn tại chữ `Locked` trong khi BM04 đã bỏ. | • Giữ BM04 theo chuẩn mới bỏ `Locked`.<br>• Cập nhật task **RF-16** xóa `Locked` khỏi code trước 20/11.<br>• Tìm và thay thế `Locked` $\rightarrow$ `Approved` trong SRS/SDD. |
| **2. Kịch bản vs Chapter** | `Chapter.ScriptStatus` (`Draft / InReview / Frozen`); code còn `ScriptReopenStatus` (sẽ gỡ, SCR-09) | Ghi gộp: `Chapter: InProduction → Frozen → ReopenRequested...` | Một số sơ đồ vẽ lẫn vào Chapter | Nhầm thực thể cha (`Chapter`) với trạng thái kịch bản và tác vụ (`Assignment`). | • Viết tách: `Script: Draft ↔ InReview → Frozen → Draft (Producer mở lại)`; `Chapter: PreProduction → InProduction → ChapterApproved`; `Assignment: Approved → ReworkRequired → InProgress`. |
| **3. Trạng thái duyệt việc** | `AssignmentStatus.UnderReview` | `Assignment: ... → Reviewing → ...` | SDD §4 ghi `UnderReview`, BM04 ghi `Reviewing` | Lệch danh từ giữa code (`UnderReview`) và BM04 (`Reviewing`). | • Chấp nhận `UnderReview` là mã nội bộ (Code enum), `Reviewing` là nhãn hiển thị nghiệp vụ (Display Label). Bổ sung chú thích này vào SDD. |
| **4. Cờ hủy Assignment** | Chưa có enum `Cancelled` | BM04 ghi có `Cancelled` | State machine §6.4 có vẽ `Cancelled` | Code chưa định nghĩa giá trị enum `Cancelled = 8`. | • Nằm trong task **RF-17** (hạn 20/11) do Tâm phụ trách. Thêm `Cancelled = 8` vào `AssignmentStatus.cs`. |
| **5. Tài khoản Reader** | `Catalog API` public; Reader là `User` có Ví VNĐ và quyền đọc theo ấn bản | Ghi: `Publisher and Reader have accounts (BR-07, BR-24)` | SRS phân định Web Reader và Mobile Reader | Dễ hiểu lầm phải đăng ký mới đọc được ấn bản Free. | • Theo BR-33: ấn bản Free đọc không cần mở khoá; ấn bản Trả phí cần tài khoản + Ví VNĐ để mở khoá đúng ấn bản ngôn ngữ đó. |

---

## 5. TỔ CHỨC CẤU TRÚC THƯ MỤC CHUẨN ĐỒ ÁN (FOLDER STRUCTURE REFACTORING)

Toàn bộ thư mục `Report` đã được tái cấu trúc thành 6 nhóm chức năng rõ ràng, không còn file rác hay file lộn xộn ở thư mục gốc:

```
D:\FPT-STUDY\10_FALL-2026\SEP490\Report\
│
├── 00_Huong_Dan_Templates/         # Toàn bộ hướng dẫn của Trường & Giảng viên
│   ├── Capstone_Huong-dan-chuan-bi-Review-va-Hoi-dong_v1.3.pdf
│   ├── Casptone Project Excel Template.xlsx
│   ├── Mo-hinh-hoa-hanh-vi-Activity-Sequence-State-Machine.pdf
│   └── Workflow_La_Gi_Dinh_Nghia_Va_Dac_Ta.pdf      # [ĐÃ CHUYỂN VÀO] Slide quy chuẩn Workflow
│
├── 01_Phieu_De_Tai_BM01/           # Phiếu đăng ký đề tài & Hồ sơ thay đổi (BM01, BM03)
│   ├── GFA26SE140_Phieu_FA26SE251_JapanComicWorkflow_V1.3.docx
│   └── _Old_Versions/
│
├── 02_Reports/                     # Các tập báo cáo chuyên môn (Report 1 -> Report 6)
│   ├── PanelForge_Ubiquitous_Language_and_State_Glossary.md  # [FILE NÀY] Từ vựng & Trạng thái chuẩn
│   ├── PanelForge_State_Machine_Naming_Standards.md          # [MỚI] Quy chuẩn đặt tên State Machine & XState v5
│   ├── Report1_Introduction/
│   ├── Report2_Management_Plan/
│   ├── Report3_SRS/                # Đặc tả yêu cầu phần mềm
│   │   ├── PanelForge_57_Use_Cases.docx             # [ĐÃ CHUYỂN VÀO] Danh sách 57 Use Cases
│   │   ├── PanelForge_UseCase_Diagram.mmd           # [ĐÃ CHUYỂN VÀO] Sơ đồ Use Case Mermaid
│   │   ├── PanelForge_UseCase_Diagram.puml          # [ĐÃ CHUYỂN VÀO] Sơ đồ Use Case PlantUML
│   │   └── Report3_Software Requirement Specification.docx
│   ├── Report4_SDD/                # Thiết kế kiến trúc & Dữ liệu
│   │   ├── PanelForge_Production_Workflow_Optimization.md # [ĐÃ CHUYỂN VÀO] Báo cáo tối ưu hóa quy trình
│   │   ├── Report4_PanelForge_Architecture_and_Diagrams.docx # [ĐÃ ĐƯA TỪ PENDING VÀO]
│   │   └── Report4_Software Design Document.docx
│   ├── Report5_Testing/            # Kế hoạch & Kết quả kiểm thử
│   └── Report6_UserGuides/         # Hướng dẫn sử dụng
│
├── 03_Defense_Review/              # Tài liệu các đợt Review và Bảo vệ Hội đồng
│   ├── Review2/                    # [MỚI] Tài liệu đợt Review 2
│   │   ├── SEP490_FA26SE251_R2_Commitment.docx       # Cam kết BM04
│   │   └── phu-luc-A-defense-1.1.md                 # Đề xuất khối lượng công việc
│   └── Defense1.1/                 # [MỚI] Chuẩn bị hồ sơ cho Defense 1.1
│
├── 04_Final_Report/                # Bộ báo cáo tổng hợp cuối kỳ (gộp tất cả các report)
│
├── 05_Visualizers_Prototypes/      # [MỚI] Bộ công cụ HTML trực quan hóa tương tác
│   ├── PanelForge_Editor_Workspace.html
│   ├── PanelForge_Sequential_Workflow.html
│   ├── PanelForge_Workflows_Swimlane.html
│   └── PanelForge_Workflows_Visualizer.html
│
└── _Archive_Dumps/                 # [MỚI] Lưu trữ các file trích xuất tạm (*_dump.txt)
    ├── bm01_v1.3_dump.txt
    ├── report1_dump.txt
    └── report2_dump.txt
```
