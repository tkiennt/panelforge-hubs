# 03 · GIAO VIỆC, PIPELINE & KANBAN (`ASG`)

> **Spec:** Phần II (2.1 giao việc theo giai đoạn, 2.2 1..N Artist), Module 2 mục 2, BR-07/23 (ghi theo Page/Panel được giao), BR-19 (phụ thuộc công đoạn), BR-30 (chuyển phạm vi giữa chừng).
> **Thay cho:** plan tổng P1-02 (phần giao Page), P1-03, P5-01; `archive/IMPLEMENTATION_PLAN_V2_5.md` Phase 3.
> **Repo:** `PanelForge_FA26SE251`, `panelforge-fe`.
> **Phụ thuộc:** ASG-01 cần [SCR-10](01_SCRIPT_PLAN.md) (ApproveScript) và [REL-01](06_RELEASE_PLAN.md) (ChapterStatus).

---

## 1. Đã xong

| Hạng mục | Bằng chứng |
|---|---|
| Giao việc theo Chapter / Page / Panel, kế hoạch giao việc, giao hàng loạt | `WorkflowEntityType.{Chapter,Page,Panel}`, `CreateAssignmentPlanCommand`, `CreateBulkAssignmentCommand` (V2.5 3.1 "Default Chapter Assignee" = việc cấp Chapter) |
| Tách phạm vi khỏi việc cả chương | `StageProgressRules.CarvedOutAsync`, `ResolvePanelsAsync` |
| Ghi theo phạm vi việc (403 ngoài phạm vi) | `Assignments/Common/WorkScopeGuard.cs`, dùng trong mọi handler CanvasElements |
| Chuyển phạm vi giữa chừng + chuyển CR (BR-30) | `TransferAssignmentScopeCommand`, `ChangeRequest.TransferTo`, FE `CreateAssignmentModal.tsx:900` |
| Cờ ảnh hưởng ⚑ + Keep/Rework | `StageProgressRules.FlagImpactedWorkAsync`, `ResolveImpactReviewCommand` |

## 2. Task

#### ASG-01 · Gate 1 một chạm: Approve Script & giao Page — BE + FE · 🟡 · cũ P1-02
- [ ] BE `StartChapterProductionCommand(ChapterId, PageAssignments[{artistId, pageFrom, pageTo}], LettererAssignments?)` trong 1 transaction: `ApproveScriptCommand` (SCR-10) → tạo việc Page (tái dùng `CreateAssignmentPlan`/`CreateBulkAssignment`) → `Chapter.StartProduction()` (REL-01) → audit.
- [ ] Hỗ trợ 1 Artist cho cả chương (việc cấp Chapter) hoặc chia dải trang; kiểm tra dải trang chồng lấn → 409 (V2.5 3.2).
- [ ] FE tab "Gate 1" trong `ChapterReleaseModal` (REL-03 tạo khung): kết quả Bible gate, chọn Artist theo dải trang, Letterer tuỳ chọn, một nút.
- [ ] i18n vi/en; test.
- **DoD:** Producer bấm 1 nút → kịch bản Frozen + Kanban có thẻ Page cho từng Artist. Sau đó làm REL-02 (chặn trang chưa giao ở Gate 3).
- **Rà soát 2026-11-13:** Gate 1 hiện là `FreezeChapterScriptCommand` (D12), **không giao Page** và **không kiểm Bible Gate** (D11). Bước "kết quả Bible gate" ở FE lấy từ `GET /api/chapters/{id}/cast` (`gate.blockers`, [BIB-14](02_BIBLE_PLAN.md)/[BIB-16](02_BIBLE_PLAN.md), Q16); `ApproveScriptCommand` của SCR-10 đã được thay bằng `FreezeChapterScriptCommand`.

#### ASG-02 · Ink ∥ Lettering song song sau Pencil (BR-19) — BE + FE · 🟡 · cũ P1-03
- [ ] Đọc `SubmitAssignmentCommand.cs` (~200–320) và `StageProgressRules.cs`: hiện chạy tuần tự Ink → Letter → Review.
- [ ] Nộp Pencil Page X → mở đồng thời track Ink (Artist trang/Inker) và track Lettering (Letterer nếu được giao, không thì chính Artist).
- [ ] Gate 2 chỉ mở khi cả 2 track `Submitted`; kích hoạt ghép composite ([ART-08](04_ARTWORK_PLAN.md)).
- [ ] Pipeline template mặc định: thêm cờ "parallel group" nếu cần.
- [ ] FE Kanban hiển thị 2 track song song mỗi Page.
- [ ] Test: Ink xong, Letter chưa xong → chưa vào review.

#### ASG-03 · Xác minh thứ tự ưu tiên Panel > Page > Chapter — BE · ✅ 🔍 · plan tổng M2-06
- [ ] Đọc `WorkScopeGuard` + `CarvedOutAsync`, viết test: việc Panel của B nằm trong trang của A → A bị 403 ở Panel đó, B ghi được.

#### ASG-04 · Cờ ảnh hưởng chéo khi đổi layout — BE · 🔍 · V2.5 3.4
- [ ] Xác minh đổi toạ độ/xoá Panel (`UpdatePanelCoordinatesCommand`, `DeletePanelCommand`) có gắn ⚑ cho việc stage sau đã Approved; nếu chưa, gọi `FlagImpactedWorkAsync`.

#### ASG-05 · SignalR production hub — BE + FE · ❌ · cũ P5-01
- [ ] `ProductionHub` group `chapter:{id}` / `page:{id}`, kiểm tra quyền Workspace khi join.
- [ ] Phát sự kiện: assignment đổi trạng thái, Ink mới, self-rollback, CR tạo/đóng, cờ Check Balloon.
- [ ] FE: invalidate TanStack Query theo sự kiện; `LetteringWorkspace` tự đổi ảnh nền.

#### ASG-06 · Kanban trung thực & tải công việc — FE · ❌ · từ UIQ GĐ5, Lucian #181
- [ ] `WorkflowBoardView.tsx`: gỡ số viết cứng ("99.4% AI Continuity", "3.2 hrs / page", "1.4 hrs avg") và Sparkles không phải AI (phần chung ở UIQ-01).
- [ ] (Tuỳ chọn) Thanh tải công việc Artist trong `CreateAssignmentModal` dùng số việc mở thật từ API.

#### ASG-07 · Chặn việc sản xuất trước Gate 1 — BE + FE · ❌ · rà soát 2026-11-13
- **Lỗi:** `Chapter.IsContentEditable` gồm cả `PreProduction`; `CreateAssignment`, `CreateAssignmentPlan`, `CreateBulkAssignment`, `StartAssignment` chỉ kiểm `AssignmentRules.ChapterNotEditableReason` (`AssignmentRules.cs:14`) → Producer giao được việc Artist/Letterer/Editor và Artist bắt đầu vẽ khi kịch bản còn `Draft`, bỏ qua Gate 1.
- [ ] [BE] Thêm `AssignmentRules.ProductionNotStartedReason(chapter)`: việc vai Artist / Letterer / Editor (stage Layout, Pencil, Ink, Lettering, Review) chỉ tạo và bắt đầu được khi `Status == InProduction` → 409 "Chương chưa qua Gate 1 (Bắt đầu sản xuất)". Áp vào 4 handler trên và `SubmitChapterManuscriptCommand`.
- [ ] [BE] Quyết định khi kịch bản bị mở lại (`InProduction` + `ScriptStatus.Draft`): việc đang làm vẫn tiếp tục (không chặn), chỉ cảnh báo; ghi rõ trong comment.
- [ ] [BE] Test: chương `PreProduction` → tạo việc Artist 409; sau Bắt đầu sản xuất → 201.
- [ ] [FE] `CreateAssignmentModal` / Kanban: chương `PreProduction` ẩn nút giao việc sản xuất, hiện gợi ý "Chờ Producer bắt đầu sản xuất".
- **DoD:** không thể có việc sản xuất nào trên chương chưa qua Gate 1. Khi ASG-01 xong, việc Page được tạo ngay trong Gate 1.

## 3. Changelog

| Ngày | Task | Trạng thái | Nhánh / Commit | Ghi chú |
|---|---|---|---|---|
| 2026-11-12 | — | Lập kế hoạch | — | Từ plan tổng P1-02/P1-03/P5-01 và V2.5 Phase 3 |
