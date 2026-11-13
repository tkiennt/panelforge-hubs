# KẾ HOẠCH TRIỂN KHAI & ĐỐI CHIẾU CODEBASE — PANELFORGE SPEC V2.6

> **Nguồn đặc tả:** `panelforge-hub/docs/V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6.md` (bản SSOT duy nhất, đồng bộ trên GitHub). Việc của cả nhóm: `panelforge-hub/docs/tracking/TEAM_WORKBOARD.md`.
> **Ngày đối chiếu:** 2026-11-12 · **Phạm vi quét:** `PanelForge_FA26SE251/src`, `panelforge-fe/src`, `panelforge-mobile/lib` (nhánh đang checkout ở thư mục gốc).
> **Mục đích:** Bảng tra cứu cho AI Agent ở các phase sau: chọn task theo ID, đọc bằng chứng (file đã có), làm sub-task, cập nhật trạng thái.
> **Plan module (chi tiết task):** [`note/plans/`](plans/README.md) — 8 plan: Kịch bản, Bible, Giao việc, Bàn vẽ, Gate 2, Phát hành, Độc giả, Chất lượng UI.

---

## 0. CÁCH DÙNG FILE NÀY (DÀNH CHO AI AGENT)

1. Chọn task theo thứ tự **Phase** ở mục 3 (P0 → P6), rồi mở plan module tương ứng trong `note/plans/` để lấy sub-task. Không nhảy phase trừ khi task không phụ thuộc.
2. Mỗi task có: `ID`, repo, agent phụ trách, BR liên quan, bằng chứng hiện trạng, sub-task (checkbox), tiêu chí nghiệm thu (DoD).
3. Trước khi code: tạo worktree theo `.agents/AGENTS.md` §5; đọc file trong cột "Bằng chứng" trước, **không** quét đệ quy.
4. Sau khi xong: đổi `[ ]` → `[x]`, đổi trạng thái task, ghi ngày + commit hash vào cột "Ghi chú" ở mục 4 (Changelog).
5. Trạng thái có đánh dấu 🔍 là **chưa xác minh kỹ** khi đối chiếu (chỉ thấy dấu hiệu qua grep). Agent nhận task phải đọc code để xác nhận trước khi sửa.
6. Không chạy test runner trừ khi user yêu cầu; chỉ `dotnet build` / `npm run typecheck` / `flutter analyze`.

**Chú giải trạng thái:** ✅ Đã có · 🟡 Có một phần / lệch đặc tả · ❌ Chưa có · ⏸️ Ngoài đặc tả V2.6 (giữ nguyên, không ưu tiên)

---

## 1. TỔNG QUAN MỨC ĐỘ HOÀN THÀNH

| Module | Nội dung | ✅ | 🟡 | ❌ | Đánh giá |
|---|---|:-:|:-:|:-:|---|
| **M0** | Nền tảng chung (state machine, cấu trúc dữ liệu, realtime, audit) | 3 | 4 | 3 | Nền tảng vững, thiếu SignalR sản xuất & state machine V2.6 |
| **M1** | Studio, Series Bible, Kịch bản, Gate 1 | 8 | 3 | 1 | Gần xong; Gate 1 chưa "1 chạm" |
| **M2** | Bàn vẽ Layout/Pencil/Ink & Lettering | 6 | 4 | 6 | Lệch lớn nhất: BR-31 Artist đặt chữ, Ink ∥ Letter, Self-Rollback |
| **M3** | Gate 2 – QC & cô lập lỗi cấp Panel | 5 | 3 | 5 | Thiếu thuật toán giao thoa 15%, định tuyến theo lớp, chế độ so sánh |
| **M4** | Sửa kịch bản muộn & truy vết | 6 | 1 | 0 | Cơ bản hoàn thành |
| **M5** | Gate 3, Snapshot, Publisher, Analytics, Revenue | 4 | 4 | 6 | Thiếu toàn bộ Readership Analytics & Revenue Report |

---

## 2. BẢNG ĐỐI CHIẾU CHI TIẾT THEO MODULE

### M0 — Nền tảng chung (Cross-cutting)

| ID | Hạng mục đặc tả | Trạng thái | Bằng chứng / Hiện trạng |
|---|---|:-:|---|
| M0-01 | Clean Architecture + CQRS MediatR, Result&lt;T&gt; | ✅ | `src/PanelForge.Application/Features/*` (31 feature folder) |
| M0-02 | CAS SHA-256 + `AssetReference` dedup (BR-04/13) | ✅ | `Features/Assets/.../UploadArtworkCommand.cs:54-64` so hash client/server; `Domain/Entities/Assets/AssetReference.cs` |
| M0-03 | Optimistic concurrency `expectedVersion` (BR-11) | ✅ | `Page.EnsureElementVersion`, `Chapter.VersionVector`, 13 file dùng `ExpectedVersion` |
| M0-04 | Marten Event Store cho thay đổi canvas (append-only) | ✅ | `Infrastructure/Persistence/EventStore/MartenPageRepository.cs`, `Page.Apply(IDomainEvent)` |
| M0-05 | Máy trạng thái Chương 4 bước (`PreProduction → InProduction → ChapterApproved → HandedOffAndPublished`, Reopen) | 🟡 | `Domain/Enums/ChapterStatus.cs` = `InProduction, Approved, Locked, Published`. Thiếu `PreProduction`, `HandedOff`; `Locked` dư so với spec |
| M0-06 | Thứ tự Page bằng LexoRank | 🟡 | BE dùng `Page.PageNumber:int` + `ReorderPageCommand`; LexoRank chỉ có ở FE offline `panelforge-fe/src/db/schema.ts:157` |
| M0-07 | Bỏ Scene khỏi luồng soạn thảo (D2: Scene mặc định ẩn mỗi chương, `scene_id` giữ NOT NULL) | 🟡 | `Panel.SceneId` đã nullable ✅; `ScriptLine.SceneId` giữ bắt buộc theo D2. Còn thiếu: tự tạo Scene mặc định khi tạo chương + ẩn Scene trên UI → task SCR-05 của [01_SCRIPT_PLAN.md](plans/01_SCRIPT_PLAN.md) |
| M0-08 | Audit log transactional cho mọi đổi trạng thái (BR-18) | ✅ | `Infrastructure/Persistence/PanelForgeDbContext.cs` `SaveChangesAsync` tự ghi `AuditLog` (CREATE/UPDATE/DELETE + changesJson) cho mọi entity EF trong cùng transaction. Thao tác cần lý do (vd Unfreeze) ghi thêm bản audit nghiệp vụ |
| M0-09 | SignalR cho Kanban / cảnh báo liên đới realtime | ❌ | Chỉ có `API/Hubs/AiStreamHub.cs` (AI streaming); không có hub production theo `ChapterId/PageId` |
| M0-10 | BoundingBox native PostgreSQL `box` + GiST | ❌ | `Panel.BoundingBox` là `string` JSON; giao thoa tính trong C# là đủ cho MVP (ưu tiên thấp) |

### M1 — Studio, Series Bible & Soạn kịch bản (CF1)

| ID | Hạng mục đặc tả | Trạng thái | Bằng chứng / Hiện trạng |
|---|---|:-:|---|
| M1-01 | Producer tạo Workspace, mời thành viên 5 vai trò | ✅ | `Features/Workspaces/*` (Create/AddMember/Accept/RejectInvitation, UpdateMemberRole) |
| M1-02 | Series với hướng đọc RTL/LTR/Vertical | ✅ | `Domain/Enums/ReadingDirection.cs`, `Features/Series/Commands/CreateSeries` |
| M1-03 | Thành viên Series | ✅ | `Features/SeriesMembers/*`, FE `roles/producer/views/ProjectMembersView.tsx` |
| M1-04 | Writer độc quyền soạn kịch bản (BR-07/23) | ✅ 🔍 | `Features/ScriptLines/*` (Batch save, Restore revision), FE `roles/writer/views/ScriptEditorView.tsx`. Cần xác minh 403 khi Producer sửa thoại |
| M1-05 | Nội dung Panel: ACTION_DIRECTION / DIALOGUE / THOUGHT / NARRATION / SFX | ✅ 🔍 | `ScriptLine` có `DialogueText`, `StageDirection`, `NarrationMode`, `SpeakerCharacterId` nullable (quần chúng) |
| M1-06 | ~~Gõ `@Tên` liên kết Bible, tự tạo `@Stub`~~ → người nói tự khớp/tự tạo nháp, lời dẫn bôi đen tham chiếu (Q16) | ❌ thay bằng BIB-09, BIB-11..BIB-16 | `BibleEntry.CreateStub/IsStub/PromoteFromStub`, `LinkBibleEntriesCommand`, FE `@tiptap/extension-mention` |
| M1-07 | Bible 2 tầng `Draft → ConceptSubmitted → WriterEndorsed → CanonLocked` | ✅ | `BibleEntryRevision.SubmitConcept/Endorse/Lock/RequestRework`; enum `BibleRevisionStatus` (có thêm `ReworkRequired` thay cho "quay về Draft" — chấp nhận được) |
| M1-08 | Cấm `/unlock`, chỉ `/supersede` (BR-01) | ✅ | Không có endpoint unlock trong `BibleController`; `MarkSuperseded`, `AddBibleEntryRevisionCommand` |
| M1-09 | ~~Era versioning `EffectiveRevisionAt(N)`~~ → biến thể tạo hình + bản theo binding của chương (BR-15 mới, Q16) | ❌ thay bằng BIB-09, BIB-15, gỡ ở BIB-17 | `BibleEntry.EffectiveRevisionAt(int, canonOnly)`, `GetBibleEntriesAtChapterQuery` |
| M1-10 | Gate 1 chốt Bible theo Danh sách thực thể chương (BR-21/30/35, Q16) | ❌ | Rà soát 2026-11-13: `CheckChapterBibleGateQuery` luôn qua và **không** được `FreezeChapterScriptCommand` gọi → BIB-14 |
| M1-11 | **Gate 1 "1 nút": Approve Script & Start Production + xác nhận giao Page** | 🟡 | Freeze (`FreezeChapterScriptCommand`) và giao việc (`CreateAssignmentPlanCommand`, `CreateBulkAssignmentCommand`) là 2 thao tác rời; chương không chuyển `PreProduction → InProduction` |
| M1-12 | Màn `ChapterReleaseModal.tsx` (Gate 1 / Gate 3 / Transfer / Revenue) | ❌ | Không tồn tại; chức năng rải ở `ProducerWorkspaceView`, `CreateAssignmentModal`, `PublishingView` |

### M2 — Bàn vẽ Layout/Pencil/Ink & Lettering (CF2)

| ID | Hạng mục đặc tả | Trạng thái | Bằng chứng / Hiện trạng |
|---|---|:-:|---|
| M2-01 | Frame Template + áp vào Page | ✅ | `Features/FrameTemplates/*`, FE `roles/artist/components/FrameTemplatePicker.tsx` |
| M2-02 | Thuật toán Row-Banding tính `panelIndex` (RTL/LTR) | 🟡 | Có trong `ApplyFrameTemplateCommand.cs:~80-100` nhưng: (a) không xử lý `Vertical`; (b) không chạy lại khi tạo/sửa Panel thủ công (`CreatePanelCommand`, `UpdatePanelCoordinatesCommand`); (c) RTL sort theo `X+W` thay vì tâm `cx` |
| M2-03 | Artist đổi thứ tự đọc Panel thủ công | 🟡 🔍 | `Panel.UpdateReadingOrder` có ở Domain; chưa thấy endpoint/UI riêng cho Panel (endpoint `reading-order` hiện là của Element) |
| M2-04 | Ánh xạ dòng kịch bản vào Panel + Script Coverage Counter 100% | 🟡 | BE ✅ `AssignPanelScriptLinesCommand`, `AutoAssignScriptLinesCommand`. FE coverage bar chỉ có ở Writer storyboard (`ScriptThumbnailStoryboardView.tsx:250`), cần xác minh trên `ArtistDeskView` |
| M2-05 | Upload artwork kèm SHA-256 + kiểm tra người giữ việc | ✅ | `UploadArtworkCommand.cs:54-134` |
| M2-06 | Page-scoped ABAC (Panel > Page > Chapter default) | ✅ 🔍 | Element handlers trả `Forbidden` khi `outOfScope` (`AddElementCommandHandler.cs:37`, `MoveElementCommandHandler.cs:34`…). Cần xác minh thứ tự ưu tiên Panel > Page > Chapter |
| M2-07 | **BR-31: Artist mặc định có `letter:write`** | ✅ | Đã sửa (P0-01): 4 endpoint `text`, `overflow-ack`, `reading-order`, `style` trong `ElementsController.cs` mở cho Artist; FE `lib/permissions.ts` thêm `letter:write` cho ARTIST |
| M2-08 | BR-31: Letterer chỉ có công cụ chữ, khóa Layout/Graphic (403) | 🟡 🔍 | Upload artwork yêu cầu assignment đúng stage; cần xác minh `PanelsController`/`FrameTemplates/Apply` chặn Letterer |
| M2-09 | **BR-19: Sau Pencil mở đồng thời Ink ∥ Lettering** | 🟡 | `SubmitAssignmentCommand.cs:235,304` vận hành pipeline tuần tự (Ink → Letter → Review). Spec yêu cầu 2 nhánh song song, Gate 2 mở khi **cả hai** xong |
| M2-10 | Bóng thoại 1-1 `script_line_id` + Position Record độc lập (BR-05) | ✅ | `AddElementCommand.ScriptLineId`, `ElementState` lưu x,y,w,h riêng |
| M2-11 | Geometry Guard BR-20 (`TEXT_OVERFLOW`, `READING_ORDER_MISMATCH`, `OVERLAPS_KEY_ARTWORK_REGION`) | ✅ | `Features/CanvasElements/Common/LetteringWarningRules.cs` |
| M2-12 | **Self-Rollback Ink → Pencil (BR-27.1)** | ❌ | Không có command/endpoint/UI |
| M2-13 | Cờ nhắc kiểm tra bóng thoại khi rollback / Ink mới | ❌ | Không có `CheckBalloonPlacement` / `is_artwork_updated_alert` |
| M2-14 | Composite 1200×1800 chạy nền (Channels + Skia) | 🟡 | `Application/Common/Interfaces/Services/IPageLetteringCompositor.cs` có; chưa là background worker qua `Channel<T>`, chưa lưu CAS composite cho Gate 2 🔍 |
| M2-15 | Magnetic Snapping & Safe Margin 3% / 8px | ❌ | Không có code snap trong FE artist |
| M2-16 | Ghost Pencil Overlay (opacity slider) | ❌ | Không có |
| M2-17 | SHA-256 trong Web Worker + Presigned PUT R2 | ❌ | `crypto.subtle` chỉ ở 1 file, chạy main thread; upload đi qua server .NET |

### M3 — Gate 2: Kiểm định & cô lập lỗi cấp Panel (CF3)

| ID | Hạng mục đặc tả | Trạng thái | Bằng chứng / Hiện trạng |
|---|---|:-:|---|
| M3-01 | Hàng đợi review của Editor | ✅ | `GetEditorReviewQueueQuery`, FE `roles/editor/views/ReviewView.tsx`, `EditorDeskView.tsx` |
| M3-02 | Luật 4 mắt BR-06 (Reviewer ≠ Assignee ≠ Submitter → 403) | ✅ | `ReviewRules.cs:25-30` chặn cả Assignee và người từng nộp; P0-04 bổ sung cùng luật cho `ReturnWorkFromReviewCommand` (đường trả việc từ màn duyệt cả chương) |
| M3-03 | Rework bắt buộc vùng khoanh + nhận xét | ✅ 🔍 | `ReturnWorkFromReviewCommand` + `ChangeRequest.ValidateRegion` |
| M3-04 | **`FindIntersectingPanelIds()` – OverlapRatio ≥ 15%** | ❌ | `ChangeRequest.PanelId` là 1 giá trị do client gửi; không tính giao thoa |
| M3-05 | Chỉ Panel lỗi về `ReworkRequired`, Panel khác giữ Approved | 🟡 | `StageProgress` theo Panel có `ReopenForRework/RequestChanges`; cần nối với M3-04 và đảm bảo Assignment cấp Page không kéo cả trang về rework |
| M3-06 | **Định tuyến theo lớp lỗi (Artwork vs Lettering)** | ❌ | `ChangeRequest` không có trường Layer; `ResponsibleUserId` lấy từ assignment đích |
| M3-07 | Cờ `is_artwork_updated_alert` (⚠️ Check Balloon Fit) khi Panel bị sửa nét | ❌ | Liên quan M2-13 |
| M3-08 | Vòng đời CR `Open → Resolved → Verified` (+Reopen/Reject) | ✅ | `ChangeRequest.Resolve/Verify/Reopen/Reject`, commands tương ứng |
| M3-09 | `Approve Page` chỉ mở khi 100% CR trang Verified | 🟡 🔍 | Cần xác minh trong `ApproveAssignmentCommand` |
| M3-10 | So sánh Side-by-side | ✅ 🔍 | 4 file FE editor nhắc side-by-side |
| M3-11 | So sánh Swipe slider, Onion-skin, Canvas Pixel Diff | ❌ | Không có trong `roles/editor` |
| M3-12 | AI Continuity / Consistency findings | ✅ | `Features/Consistency/*`, `ConsistencyRules/*`, FE `VisualChecksTab.tsx` |
| M3-13 | Transfer Scope giữa Artist (BR-30 mid-flight) + chuyển CR | ✅ | `TransferAssignmentScopeCommand`, `ChangeRequest.TransferTo`, FE `CreateAssignmentModal.tsx:900` |

### M4 — Sửa kịch bản muộn & truy vết (CF4)

| ID | Hạng mục đặc tả | Trạng thái | Bằng chứng / Hiện trạng |
|---|---|:-:|---|
| M4-01 | Append-only event + CAS | ✅ | xem M0-02, M0-04 |
| M4-02 | Restore tạo Version n+1 (BR-08) | ✅ | `RestorePageVersionCommand`, `Page.RestoreTo`, `RestoreScriptRevisionCommand` |
| M4-03 | Unfreeze/Reopen Script **bắt buộc lý do** vào Audit | ✅ | P0-03: endpoint nhận body `{ reason }` (bắt buộc, ≤500 ký tự), ghi audit `UNFREEZE_SCRIPT`; FE `ScriptEditorView` dùng `ReasonForm` |
| M4-04 | Thông báo Artist/Letterer khi refreeze | ✅ 🔍 | Freeze có nhánh flag impact (`FreezeScriptCommands.cs:80-110`); xác minh Notification |
| M4-05 | `FlagImpactReview` ⚑ lên Panel/Assignment khi sửa dòng đã gắn | ✅ | `Assignment.FlagScriptImpact`, `StageProgress.FlagScriptImpact`, `StageProgressRules.cs:291` |
| M4-06 | Bóng thoại `isStale` | ✅ | `GetPageSnapshotQueryHandler.cs:57` |
| M4-07 | Quyết định `Keep` / `Rework` | ✅ | `ResolveImpactReviewCommand` (`ImpactReviewDecision.Keep/Rework`) |

### M5 — Gate 3, Snapshot, Publisher, Analytics & Revenue (CF5)

| ID | Hạng mục đặc tả | Trạng thái | Bằng chứng / Hiện trạng |
|---|---|:-:|---|
| M5-01 | ChapterLockGate BR-12 | 🟡 | P0-02 đã thêm `IMPACT_FLAGS` (chặn) và `PAGES_WITHOUT_WORK` (mới chỉ cảnh báo, liệt kê số trang). Chuyển `PAGES_WITHOUT_WORK` thành chặn sau P1-02 |
| M5-02 | Trả 409 kèm danh sách trang vướng | 🟡 🔍 | Gate trả Count, chưa trả danh sách PageId |
| M5-03 | ChapterSnapshot bất biến (manifest hash) | ✅ | `Domain/Entities/Content/ChapterSnapshot.cs` (`ManifestJson`, `ManifestHash`) |
| M5-04 | PreviewLink ≤72h, gắn email, watermark SVG (BR-09/16/17) | ✅ 🔍 | `Preview/PreviewLink.cs` (`RecipientEmail`, `ExpiresAt`), `PreviewDtos.cs:32-40`; mobile `screens/review/*`. Xác minh trần 72h ở validator |
| M5-05 | Signed URL 10 phút cho ảnh gốc | ✅ 🔍 | `IssueArtworkAccessLinkCommand` |
| M5-06 | Export PDF / CBZ / Webtoon Vertical Slice / JSON Provenance | 🟡 | `Infrastructure/Exports/SkiaChapterExportRenderer.cs` có CBZ + ComicInfo, ảnh trang, PDF. Cần xác minh Webtoon slice & JSON provenance |
| M5-07 | **Publisher là External Stakeholder** | 🟡 | Code đang có `SystemRole.Publisher` + portal (`PublisherController`, FE `roles/publisher/*`). Lệch định vị V2.6 → cần quyết định (xem P4-03) |
| M5-08 | Trạng thái `HandedOff / Published`, Reader đọc trên Web/Mobile | 🟡 | `PublishChapterCommand`, `Chapter.IsVisibleToReaders`; thiếu bước HandedOff |
| M5-09 | **Bảng `chapter_readership_metrics`** | ❌ | Không có entity/migration |
| M5-10 | **Beacon `POST /api/catalog/chapters/{id}/read-heartbeat` + buffer batch** | ❌ | Không có (BE, FE reader, mobile reader) |
| M5-11 | **Bảng `chapter_revenue_reports` + CRUD Producer** | ❌ | `TotalRevenueVnd` hiện tại là doanh thu ví in-app (`Payments`), khác khái niệm Gross Revenue từ Publisher |
| M5-12 | **Owner 360° Dashboard (Views, Unique, Completion, Avg time, Web/Mobile, Rating, Revenue, RPM)** | ❌ | `roles/producer/views/DashboardView.tsx` chưa có các chỉ số này |
| M5-13 | Reader rating 1..5 | ❌ | Mobile `models/comic_model.dart:229` rating là dữ liệu cứng 4.9 |
| M5-14 | Ví / mở khóa / thanh toán (VNĐ) | 🟡 | `Features/Payments/*`, mobile `monetization_service.dart`. Ví VNĐ đúng Q11; còn đổi giá & quyền đọc sang theo ấn bản ngôn ngữ (RDR-07, RDR-10), bỏ VIP (RDR-08) |

### Điều hướng (Spec §5.3)

| ID | Hạng mục | Trạng thái | Hiện trạng |
|---|---|:-:|---|
| NAV-01 | `/login → /workspaces → /workspace/:wId/series → /workspace/:wId/series/:sId` | ✅ | `panelforge-fe/src/app/routes*` có các path tương ứng (có cả `workspaces/:workspaceId/series/:seriesId`) |
| NAV-02 | Sidebar Series: Dashboard+Readership+Revenue / Pipeline Kanban / Bible / Members / Audit & Provenance | 🟡 | Có `dashboard`, `bible`, `publishing`, `export`; thiếu mục Readership/Revenue và Audit cấp Series 🔍 |
| NAV-03 | Bàn làm việc theo vai trò (`ScriptEditorView`, `ArtistDeskView`, `LetteringWorkspace`, `ReviewView`, `ChapterReleaseModal`) | 🟡 | Có đủ trừ `ChapterReleaseModal` |

---

## 3. LỘ TRÌNH — CHI TIẾT NẰM Ở PLAN MODULE

> Từ 2026-11-12, sub-task chi tiết của từng hạng mục nằm trong bộ plan module [`note/plans/`](plans/README.md). Mục này chỉ giữ thứ tự ưu tiên và ánh xạ ID cũ → ID mới. Khi làm xong, cập nhật plan module **và** Changelog mục 4 bên dưới.

| Phase | ID cũ | Hạng mục | Plan module → Task | Trạng thái |
|---|---|---|---|---|
| P0 | P0-01 | BR-31: Artist đặt chữ | [04_ARTWORK](plans/04_ARTWORK_PLAN.md) (đã xong) | ✅ |
| P0 | P0-02 | Gate 3: cờ ⚑, trang chưa giao | [06_RELEASE](plans/06_RELEASE_PLAN.md) → REL-02 (phần còn lại) | ✅ một phần |
| P0 | P0-03 | Unfreeze bắt buộc lý do | [01_SCRIPT](plans/01_SCRIPT_PLAN.md) (đã xong) | ✅ |
| P0 | P0-04 | Luật 4 mắt | [05_REVIEW](plans/05_REVIEW_PLAN.md) (đã xong) | ✅ |
| P0 | P0-05 | Audit transactional | đã có sẵn, M0-08 | ✅ |
| P1 | P1-01 | Máy trạng thái Chương | REL-01 (làm cùng SCR-08) | 🟡 |
| P1 | P1-02 | Gate 1 một chạm | SCR-10 (phần kịch bản) + ASG-01 (giao Page) + REL-03 (modal) | 🟡 |
| P1 | P1-03 | Ink ∥ Lettering | [03_ASSIGNMENT](plans/03_ASSIGNMENT_PLAN.md) → ASG-02 | 🟡 |
| P1 | P1-04 | Thứ tự đọc Panel | ART-01 | 🟡 |
| P1 | P1-05 | Self-Rollback | ART-02 | ❌ |
| P1 | P1-06 | Coverage Counter bàn vẽ | ART-03 | 🟡 🔍 |
| P1 | P1-07 | Letterer bị khoá Layout | ART-04 | 🟡 🔍 |
| P2 | P2-01 | Giao thoa 15% | REV-01 | ❌ |
| P2 | P2-02 | Lớp lỗi Artwork/Lettering | REV-02 | ❌ |
| P2 | P2-03 | Check Balloon Fit | ART-06 + REV-03 | ❌ |
| P2 | P2-04 | Cô lập Panel khi rework | REV-04 | 🟡 |
| P2 | P2-05 | Chế độ so sánh | REV-05 | ❌ |
| P2 | P2-06 | Composite nền | ART-08 | 🟡 |
| P3 | P3-01..P3-04, P3-06 | Readership, beacon, rating, Dashboard 360° | [07_READER](plans/07_READER_PLAN.md) → RDR-01..04, RDR-06 | ❌ |
| P3 | P3-05 | Revenue report | RDR-05 | ⏸️ |
| P4 | P4-01 | Scene không bắt buộc | SCR-04..SCR-07 (D2: Scene ẩn) | 🟡 |
| P4 | P4-02 | LexoRank Page | ART-05 | 🟡 |
| P4 | P4-03 | Publisher Portal, một Publisher duy nhất | REL-04 | 🟡 |
| P4 | P4-04 | HandedOff & gói bàn giao | REL-05 | 🟡 |
| P4 | P4-05 | Free/Trả phí theo ấn bản, VNĐ, bỏ VIP | RDR-07, RDR-08, RDR-10, REL-09 | 🟡 |
| P5 | P5-01 | SignalR production hub | ASG-05 | ❌ |
| P5 | P5-02 | Ghost Pencil | ART-09 | ❌ |
| P5 | P5-03 | Magnetic Snapping | ART-10 | ❌ |
| P5 | P5-04 | Web Worker hash + Presigned PUT | ART-07 | ❌ |
| P6 | P6-01 | PostgreSQL `box` + GiST | REV-08 | ❌ tuỳ chọn |
| — | — | Series Bible frontend | [02_BIBLE](plans/02_BIBLE_PLAN.md) → BIB-01..08 | 🟡 |
| — | — | Chống AI-slop, i18n, mobile | [08_UI_QUALITY](plans/08_UI_QUALITY_PLAN.md) → UIQ-01..08 | 🟡 |

**Làm ngay, độc lập:** SCR-01..03 (sửa lỗi + dọn code chết), BIB-03 (FE theo kịp backend Bible), UIQ-01 (gỡ số liệu giả).

---
## 4. CHANGELOG TIẾN ĐỘ (AGENT CẬP NHẬT)

| Ngày | Task ID | Trạng thái mới | Repo / Commit | Ghi chú |
|---|---|---|---|---|
| 2026-11-12 | — | Khởi tạo | — | Đối chiếu lần đầu với spec V2.6 |
| 2026-11-12 | P0-01..P0-05 | ✅ (P0-02 một phần) | BE `feature/p0-spec-v26-fixes-be`: 7dc2c4f, 01f5f9f, c8dc9c2, 916eda2 · FE `feature/p0-spec-v26-fixes-fe`: 35264e6, d5521da | Build BE + typecheck/i18n FE đạt; chưa chạy unit test. Đã merge & push `trungkien`: BE f0ebc7c, FE 4cc89c7 |
| 2026-11-12 | P1-01, P1-02, P4-01 | Lập kế hoạch con | — | Chi tiết ở [01_SCRIPT_PLAN.md](plans/01_SCRIPT_PLAN.md); chờ chốt D1, D3–D6 |
| 2026-11-12 | P4-01 | ➡️ Thay thế bởi S1-01..S1-04 | — (chỉ tài liệu) | Chốt D2: Scene mặc định ẩn, `scene_id` giữ NOT NULL. Đã sửa đặc tả master §1.2 (3 bản) và `CHAPTER_AND_SCRIPT_SPECIFICATION.md` (2 bản). Còn chờ D1, D3–D6 |
| 2026-11-12 | P1-01, P1-02, P4-01 | Đã chốt đủ D1–D6 | — (chỉ tài liệu) | Kế hoạch kịch bản sẵn sàng triển khai từ Phase S0; S1-03 bị huỷ theo D6 |
| 2026-11-12 | Q7–Q11 | Đối chiếu spec | — (chỉ tài liệu) | Spec viết lại Module 5, BR-32/33/34, §5.1–5.3, §6.1.5–6 (ấn bản ngôn ngữ `ChapterEdition`, Publisher đặt giá, Producer xem số liệu, tiền thật VNĐ). Plan: RDR-06/07 sửa, RDR-10/11 thêm; REL-03/04/05 sửa, REL-08/09 thêm; ART-14/15 thêm. Câu hỏi mở 15–17 |
| 2026-11-12 | Q12–Q14 | Đối chiếu spec | — (chỉ tài liệu) | Một Publisher duy nhất; tiền nạp về tài khoản nền tảng (Admin duyệt); ấn bản dịch Editor duyệt, Producer cho phép phát hành. Plan: REL-04, REL-09, RDR-07, RDR-10 sửa; RDR-12 thêm. Đóng câu hỏi mở 15–17 |
| 2026-11-12 | — | Rà tài liệu repo & phối hợp | `feature/repo-docs-sync-*` (BE, FE, MO) | Archive CF1/CF4/CF5 (BE `docs/archive/implementation/`), sửa README Publisher/Producer (FE), trỏ `CLAUDE.md` 3 repo về `note/plans/`; thêm quy tắc phối hợp `note/plans/README.md` §2 + bảng "Đang làm" §5; thêm REL-05 (gắn Snapshot vào ExportJob), REL-10 (kiểm thử trình duyệt); câu hỏi mở 18 (phạm vi phiếu V1.2) |
| 2026-11-12 | — | Bỏ phiếu V1.2 | BE `feature/repo-docs-sync-be` | Archive `PanelForge_Scope_V1.2.md`, `project-plan.md`; đóng câu hỏi 18 |
| 2026-11-12 | — | Hub là SSOT tài liệu | hub `main`; BE, FE, MO `trungkien` | Spec ở `docs/V2.6/`; gộp bảng "Đang làm" về `TEAM_WORKBOARD.md`; bỏ bản sao spec/workboard/DESIGN_RULES/đặc tả Chương khỏi repo code; quy tắc mọi lần sửa `docs/` phải commit + push hub ngay (plans/README §2.5) |
| 2026-11-13 | SCR-25..SCR-36 | Lập kế hoạch | hub `b9e9163` | Phase H của [01_SCRIPT_PLAN.md](plans/01_SCRIPT_PLAN.md): luật gõ, ô người nói, nhãn Trang/Panel, thanh loại dòng, Board view, lọc, thống kê mật độ, xuất kịch bản, ảnh tham chiếu Panel. Câu hỏi mở 19 |
| 2026-11-13 | D7–D10 (SCR) | ✅ Chốt | — (chỉ tài liệu) | User chốt theo khuyến nghị; đóng câu hỏi mở 19. Phase H sẵn sàng (SCR-26+ vẫn cần SCR-04/07/19) |
| 2026-11-13 | SCR-25 | ✅ Xong | FE `trungkien` | Luật gõ dạng hàm thuần (`flow/grammar/scriptGrammar.ts`) theo bảng H.1 + 19 unit test pass 100% |
| 2026-11-13 | D11, SCR-25/26 (làm lại), SCR-27 ⛔ | ✅ | FE `trungkien` `30b975a` | Editor Writer xây lại theo luật đo trên WriterSolo; kịch bản chữ thuần, không liên kết Series Bible. Typecheck/i18n/eslint sạch; test viết, chưa chạy; chưa thử trong app. Câu hỏi 20 |
| 2026-11-13 | D12, SCR-08 (🟡), SCR-37, SCR-38 (❌) | ✅ | BE `d136057`, `9059e5a`; FE `e98d8ad` | Luồng kịch bản: Writer gửi duyệt ↔ hủy gửi duyệt → Producer bắt đầu sản xuất; Editor góp ý theo dòng (không chặn, không đổi trạng thái); `ChapterStatus.PreProduction` mặc định. Build BE/FE thành công; 86 test BE cần cập nhật trước khi push (SCR-38). Câu hỏi 21 |
| 2026-11-13 | SCR-12, SCR-15 (thay), SCR-21, SCR-37 | ✅ | BE `a3b9a29`, `5e55c97`; FE `eda8d4f` | Lưu = commit / Gửi duyệt = push (câu hỏi 22): drawer lịch sử (mã băm rút gọn, nhãn ĐÃ GỬI DUYỆT, so với bản đã gửi), Editor đọc bản đã gửi theo Trang → Panel → dòng + tab Thay đổi + cờ góp ý cũ; gỡ stage Script khỏi pipeline và luồng duyệt kịch bản qua Assignment. Build BE/FE, typecheck, i18n:check đạt; chưa chạy test, chưa thử trong app |
| 2026-11-13 | Rà soát luồng Script → Bible → Production | Lập kế hoạch sửa | — (chỉ tài liệu) | Đối chiếu spec với code BE/FE; bảng §4.1. Thêm SCR-39, ASG-07, BIB-09, BIB-10; bổ sung SCR-01, SCR-03, SCR-11, ASG-01, REL-01, REL-02, REL-04. Câu hỏi mở 23–25 |
| 2026-11-14 | Q16 (câu 23), câu 24, câu 25 | ✅ Chốt | hub (chỉ tài liệu) | Bible chốt theo chương (BR-35) → BIB-09, BIB-11..BIB-17, sửa đặc tả master; Producer chỉ đọc kịch bản → SCR-11; bỏ luồng Writer xin mở lại → SCR-09 |
| 2026-11-14 | Q16 (chỉnh) | ✅ Chốt | hub (chỉ tài liệu) | Người nói tự khớp/tự tạo nháp + cờ Quần chúng; lời dẫn chỉ tham chiếu khi Writer bôi đen; bỏ quét chữ và nhóm phân loại tên mới → BIB-11..BIB-17 viết lại |
| 2026-11-14 | Q17 | ✅ Chốt | hub (chỉ tài liệu) | Bôi đen tham chiếu chỉ Writer; duyệt thiết kế Bible: Writer góp ý, Editor chốt → BIB-10 (khôi phục, viết lại), BIB-13, BIB-16; sửa spec §5.1, máy 1, glossary, chuẩn đặt tên |

### 4.1. Rà soát luồng Script → Series Bible → Production (2026-11-13)

Đọc code, chưa chạy test. Mỗi lỗi chỉ ghi ở **một** task module.

| # | Mức | Lỗi (đã xác nhận trong code) | Task |
|---|---|---|---|
| 1 | 🔴 | Kịch bản không còn liên kết Bible (D11) → Bible Gate luôn qua, Gate 1 không kiểm `CanonLocked` (spec §1.1, BR-21) | [BIB-09, BIB-11..BIB-17](plans/02_BIBLE_PLAN.md) · Q16 |
| 2 | 🔴 | Gate 3 không kiểm 100% trang `Approved`: chương 0 việc vẫn `ApproveChapter` được, Snapshot trang chưa vẽ | [REL-02](plans/06_RELEASE_PLAN.md) |
| 3 | 🔴 | Giao việc / bắt đầu vẽ được khi chương còn `PreProduction` (bỏ qua Gate 1) | [ASG-07](plans/03_ASSIGNMENT_PLAN.md) |
| 4 | 🔴 | Producer mở lại kịch bản rồi chốt lại không gắn ⚑ Panel (chỉ đường xin mở lại V2.5 có); dò bằng `UpdatedAt` bỏ sót dòng xoá/thêm | [SCR-01](plans/01_SCRIPT_PLAN.md) |
| 5 | 🔴 | `SCRIPT_NOT_FROZEN` chỉ cảnh báo → duyệt chương khi kịch bản đang sửa | [REL-02](plans/06_RELEASE_PLAN.md) |
| 6 | 🟠 | Producer sửa được kịch bản (BE "Producer luôn được"; FE `canEditScript` mở khi chưa rõ vai trò) — trái BR-07 | [SCR-11](plans/01_SCRIPT_PLAN.md) · câu hỏi 24 |
| 7 | 🟠 | Publish chỉ cho Publisher, Reopen cho cả Publisher — trái quyết định 1/11 | [REL-04](plans/06_RELEASE_PLAN.md) |
| 8 | 🟠 | `ChapterStatus` còn `Locked`, chưa có `HandedOffAndPublished` | [REL-01](plans/06_RELEASE_PLAN.md) |
| 9 | 🟡 | Hai cơ chế mở lại kịch bản song song (Unfreeze V2.6 và Xin/Duyệt/Từ chối V2.5) | câu hỏi 25 → SCR-09/SCR-10 |
| 10 | 🟡 | Tài liệu/comment lệch D12 (`InReview` khoá sửa, còn `ChangesRequested`/`Amending`); hai hệ phiên bản `ContentRevision` / `ScriptVersion` | [SCR-39](plans/01_SCRIPT_PLAN.md) |
| 11 | 🟡 | Quyền Endorse Bible lệch (đã chốt Q17: Writer góp ý, Editor chốt; code còn cho Writer endorse); máy trạng thái Bible lệch spec; gate ép số chương decimal → int (tự hết khi gỡ era ở BIB-17) | [BIB-10, BIB-17](plans/02_BIBLE_PLAN.md) |
| 12 | 🟡 | `chapterScriptMachine.ts` code chết còn luật `canFreeze = isBibleGatePassed` | [SCR-03](plans/01_SCRIPT_PLAN.md) |

**Thứ tự đề xuất:** ASG-07 + REL-02 + SCR-01 (BE, độc lập, không chờ quyết định) → REL-04, REL-01 (đã chốt từ 2026-11-12) → SCR-11 (câu 24 đã chốt) → chuỗi Bible Q16: BIB-09 → BIB-11 → BIB-12 → BIB-13 → BIB-14 → BIB-15 ∥ BIB-16 → BIB-17 → SCR-39, BIB-10, SCR-03.

---

## 5. CÂU HỎI MỞ CẦN USER QUYẾT ĐỊNH

### Đang chờ (rà soát 2026-11-13)

23. ✅ **Series Bible chốt theo chương** (user chốt 2026-11-14, chỉnh lại cùng ngày; spec **Q16**, BR-35): **tên người nói** tự khớp tên/bí danh mục Bible, chưa có thì hệ thống **tự tạo bản nháp** nhân vật, Writer gắn cờ **Quần chúng** nếu không cần thiết kế; **lời dẫn/mô tả không tự khớp**, Writer **bôi đen** đoạn chữ để tham chiếu mục có sẵn hoặc tạo mục mới; mục mới chờ Writer viết định nghĩa rồi Artist vẽ. Luồng tạo Bible trước: ghi đúng tên ở ô người nói là tự tham chiếu. Bỏ mốc chương hiệu lực, dùng **biến thể tạo hình** (`variant_label`), gợi ý bản đã dùng ở chương gần nhất trước đó. `chapter_bible_bindings` khoá cùng kịch bản ở Gate 1 (bản gắn cho phép NULL trước Gate 1); Gate 1 chặn khi còn thực thể không Quần chúng chưa `CanonLocked`; đổi bản sau khi mở lại thì gắn ⚑; đưa vào Snapshot Gate 3 → [02_BIBLE_PLAN.md](plans/02_BIBLE_PLAN.md) BIB-09, BIB-11..BIB-17. Đã sửa đặc tả master (§1.1, §1.2, §2.1, Module 1 mục 2–4, BR-01/15/21/30/35, §5.1, §5.2 máy 1, §5.3), `CHAPTER_AND_SCRIPT_SPECIFICATION.md`, glossary.
24. ✅ **Producer chỉ đọc kịch bản** (user chốt 2026-11-13, theo spec BR-07 / §5.1): sửa nội dung kịch bản trả 403 với Producer; Producer góp ý, Bắt đầu sản xuất, Mở lại → SCR-11.
25. ✅ **Bỏ luồng Writer xin mở lại kịch bản (V2.5)** (user chốt 2026-11-13): chỉ Producer *Mở lại* kèm lý do; gỡ `request/approve/reject-script-reopen`, `ScriptReopenStatus` và 4 cột `ScriptReopen*` → SCR-09, SCR-23.

### Đã chốt (2026-11-12)

1. ✅ **Publisher:** phương án A, portal chỉ đọc. Publish/Reopen chuyển về Producer → P4-03.
2. ✅ **`ChapterStatus.Locked`:** gộp vào `Approved` → P1-01.
3. ✅ **CR vắt nhiều Panel:** tách nhiều CR, gom bằng `GroupId` → P2-01.
4. ⏸️ **Revenue report:** triển khai sau, giữ task để theo dõi → P3-05.
5. ✅ **Ví / mở khóa chương:** giữ trong demo. Chương Free hoặc Trả phí (xem trước N trang) → P4-05.
6. ✅ ~~Người cấu hình Free/Trả phí, giá, số trang xem trước: chỉ Producer~~ → **thay bằng mục 11** (Publisher quy định).
7. ✅ ~~Đơn vị trong Ví: token mua theo gói cố định (Q6)~~ → **thay bằng mục 14**.

Các quyết định trên đã được ghi vào đặc tả `PANELFORGE_MASTER_SPECIFICATION_V2_6.md` (bản SSOT duy nhất `docs/V2.6/` trong `panelforge-hub`).

8. ✅ **Gói VIP:** bỏ; quyền đọc ấn bản trả phí chỉ đến từ mở khoá ấn bản đó → RDR-08.
9. ✅ **Scene (D2 của kế hoạch kịch bản):** giữ một Scene mặc định ẩn mỗi chương, `scene_id` không đổi sang nullable → P4-01 thay bằng SCR-04..SCR-07 của [01_SCRIPT_PLAN.md](plans/01_SCRIPT_PLAN.md). Đã ghi vào đặc tả master §1.2 (cả 3 bản).
10. ✅ **Luồng kịch bản (D1, D3–D6 của [01_SCRIPT_PLAN.md](plans/01_SCRIPT_PLAN.md)):** bỏ stage Script khỏi pipeline · Gate 1 không bắt buộc qua Editor duyệt · ~~Writer không sửa khi Chờ duyệt~~ (thay bằng mục 22: Writer sửa tiếp, Editor đọc bản đã gửi) · bỏ entity `ChapterScript` · không chuyển đổi dữ liệu kịch bản cũ (seed mới nạp sau).
11. ✅ **Quy định xem trước & đặt giá: Publisher** (Q7, thay mục 6), theo từng ấn bản ngôn ngữ. Producer chỉ xem; Publish/Reopen vẫn là Producer → RDR-07, REL-04.
12. ✅ **Xem lượt đọc & doanh thu: Producer** (và Admin); doanh thu VNĐ, lọc theo ấn bản (Q8) → RDR-06.
13. ✅ **Ngôn ngữ bóng thoại & ấn bản ngôn ngữ:** Series khai báo ngôn ngữ gốc + ngôn ngữ phát hành; mỗi bóng thoại một vị trí, nhiều bản chữ. Producer **nghiệm thu từng ngôn ngữ**, Publisher đặt **giá khác nhau theo ngôn ngữ**, độc giả **mua ngôn ngữ nào đọc ngôn ngữ đó** (Q9, Q10, BR-34) → ART-14, ART-15, REL-09, REL-08, RDR-07, RDR-10, RDR-11.

14. ✅ **Không dùng token, dùng tiền thật VNĐ** (Q11, thay mục 7): giá, Ví, giao dịch, doanh thu đều VNĐ; một đơn vị tiền tệ, không quy đổi ngoại tệ. Ví VNĐ trong code đã đúng, giữ nguyên.

15. ✅ **Toàn hệ thống chỉ có một tài khoản Publisher** (Q12): Publisher thấy và đặt giá cho mọi Series; không cần gắn Publisher với Series. Chặn tạo Publisher thứ hai → REL-04.
16. ✅ **Tiền nạp vào tài khoản ngân hàng của nền tảng** (Q13): Admin quản lý tài khoản và duyệt giao dịch nạp; doanh thu Workspace tính từ giao dịch mở khoá ấn bản → RDR-12, RDR-06.
17. ✅ **Ấn bản dịch: Editor duyệt, Producer cho phép phát hành** (Q14): `Draft → InReview → EditorApproved → Approved → Published`, luật 4 mắt giữa Editor và người dịch → REL-09.

Các mục 11–17 đã ghi vào đặc tả (bảng "Nhật ký quyết định" Q1–Q14 ở đầu `docs/V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6.md`).

### Đã chốt thêm

18. ✅ **Bỏ phiếu đăng ký V1.2 làm căn cứ phạm vi** (user chốt 2026-11-12): spec V2.6 là phạm vi chính thức, gồm cả xuất bản, độc giả trả phí, ấn bản ngôn ngữ. `PanelForge_Scope_V1.2.md` và `project-plan.md` đã chuyển vào `PanelForge_FA26SE251/docs/archive/`.

19. ✅ **Trải nghiệm gõ kịch bản (D7–D10 của [01_SCRIPT_PLAN.md](plans/01_SCRIPT_PLAN.md) §3.5)** (user chốt 2026-11-13, theo khuyến nghị): hậu tố `(nghĩ)` ở ô người nói → Thought · bỏ cú pháp gõ tắt `@Tên: "..."`, `SFX:`, `Caption:`, ký tự mồi trong editor (chỉ còn ở luồng dán/chuyển đổi) · cảnh báo (không chặn) khi > 7 panel/trang, > 3 bóng thoại/panel, > 25 chữ/bóng thoại, panel không có Action · kéo thả Page/Panel chỉ khi `Draft`/`ChangesRequested`/`Amending`, Panel đã có artwork thì hỏi xác nhận và gắn ⚑.

20. ✅ **Editor kịch bản giống WriterSolo, không liên kết Series Bible** (D11 của [01_SCRIPT_PLAN.md](plans/01_SCRIPT_PLAN.md), user chốt 2026-11-13): luật gõ đo trực tiếp trên WriterSolo thay bảng H.1; kịch bản là chữ thuần (không `@mention`, không chọn người nói từ Bible); xây lại, không tương thích dữ liệu cũ. ✅ Phần Bible Gate đã chốt lại ở mục 23 (Q16) và đặc tả master đã sửa.

21. ✅ **Luồng nộp kịch bản** (D12 của [01_SCRIPT_PLAN.md](plans/01_SCRIPT_PLAN.md), user chốt 2026-11-13): `Draft ↔ InReview → Frozen`; chỉ Writer gửi duyệt / hủy gửi duyệt; Editor chỉ góp ý theo dòng, không bắt buộc trước Gate 1; Producer bấm *Bắt đầu sản xuất* khi `InReview` (chương `PreProduction → InProduction`); bỏ `ChangesRequested` / `Amending` và duyệt kịch bản qua Assignment. ✅ Đã ghi vào đặc tả master (Q15, Module 1 mục 4, §5.2 máy 4 và máy 5 `ScriptStatus`).

22. ✅ **Lưu = commit, Gửi duyệt = push** (user chốt 2026-11-13, đối chiếu tài liệu thiết kế): mỗi lần lưu tạo `ScriptVersion` bất biến (SHA-256, trùng nội dung thì không tạo); gửi duyệt ghi con trỏ `LastSubmittedVersionId` / `PreviousSubmittedVersionId`. Editor đọc bản đã gửi; Writer sửa, lưu và *Gửi duyệt lại* khi `InReview`; *Bắt đầu sản xuất* bị từ chối nếu bản live khác bản đã gửi. Lịch sử tuyến tính nên không lưu `parentCommitHash` (cha = phiên bản số liền trước). Không thêm `jsondiffpatch` / `react-diff-viewer`: diff LCS từng dòng tự viết (`shared/features/script-versions`), khoá dòng ổn định `line:{id}` đóng vai `objectHash`.
