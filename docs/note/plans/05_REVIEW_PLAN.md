# 05 · GATE 2 — KIỂM DUYỆT TRANG & CÔ LẬP LỖI CẤP PANEL (`REV`)

> **Spec:** Module 3, §5.2 máy trạng thái 2 và 3, §6.1 mục 1 (`FindIntersectingPanelIds`, ngưỡng 15%), BR-06/26 (4 mắt), BR-27.2.
> **Thay cho:** plan tổng P2-01..P2-05, P6-01; UI GĐ8 của `ANTI_SLOP_REFACTOR_PLAN.md`; `UI_REFACTOR_CHECKLIST` B4; Lucian #302, #176, #180; `panelforge-fe/docs/implement-plan/ongoing/editor-review-screens.md`.
> **Repo:** `PanelForge_FA26SE251`, `panelforge-fe`.

---

## 1. Đã xong

| Hạng mục | Bằng chứng |
|---|---|
| Hàng đợi Editor | `GetEditorReviewQueueQuery`, FE `ReviewView.tsx`, `EditorDeskView.tsx` |
| **Luật 4 mắt đủ hai vế** (người làm, người từng nộp → 403) | `Assignments/Common/ReviewRules.cs:25-30`; P0-04 bổ sung cho `ReturnWorkFromReviewCommand` (commit `916eda2`) |
| Trả bài kèm mô tả + vùng khoanh (validate vùng) | `ReturnWorkFromReviewCommand`, `ChangeRequest.ValidateRegion` |
| Vòng đời CR `Open → Resolved → Verified` (+ Reopen, Reject) | `ChangeRequest.*`, commands tương ứng |
| Tiến độ theo Panel (`StageProgress.ReopenForRework/RequestChanges`) | `Domain/Entities/Workflow/StageProgress.cs` |
| Consistency findings (AI + luật) | `Features/Consistency/*`, FE `VisualChecksTab.tsx` |
| Bố cục duyệt chung cho mọi cổng Editor (bài nộp ở giữa, tab Notes / Checks, thanh Return / Approve), mảnh dùng chung `review-shared/` (`ReasonForm`, `DecisionBar`, trạng thái CR, nháp theo bài nộp) | FE `roles/editor/views/review-shared/*` |
| Duyệt artwork Page/Panel: bài nộp hiện tại, so sánh side-by-side với bài đã quyết lần trước, khoanh vùng dạng nháp, verify / reopen / drop, triage nhất quán, impact review | FE `ReviewView.tsx` |
| Duyệt kịch bản: ghi chú dòng/scene thành CR có neo (`SceneId`, `ScriptLineId`, `QuotedText`) | FE `ScriptReviewView.tsx` |
| Comic reader review mode cho Editor trong `ScriptReviewView` (UIQ-11o) | FE `ScriptReviewView.tsx` tích hợp chế độ đọc truyện kiểm định |
| Duyệt thiết kế Bible cho Editor (`editor/bible`) | FE `BibleReviewView.tsx` |
| Series Continuous Reader & Ghim nhận xét toạ độ (UIQ-11r) | `/workspaces/:wId/series/:sId/read`, `SeriesReaderView.tsx`, `POST /api/chapters/{chId}/pages/{pageId}/comments`, `ConvertCommentToReworkCommand` |

## 2. Task

#### REV-01 · `FindIntersectingPanelIds` ≥ 15% — BE + FE · ✅ lưới V3 (2026-11-28, BE `733278a`, FE `09e4792`) · cũ P2-01
- Lưới V3: `POST task-grid/tasks/{id}/request-changes` nhận `changes[]` (như V2); mỗi vùng thành một CR gắn ô (`change_requests.stage_task_id`, `assignment_id` thành nullable, check đúng một trong hai — migration `AddStageTaskChangeRequests`) cho từng khung giao ≥ 15%, chung `GroupId`. Màn duyệt gửi vùng khoanh lên server thay vì gộp vào nhận xét.
- [ ] Hàm Domain thuần: `OverlapRatio = Area(Error ∩ Panel) / min(Area(Error), Area(Panel))`; trả PanelId có ratio ≥ 0.15 (Quyết định 2026-11-15 (D8)).
- [ ] `ReturnWorkFromReviewCommand` / `RequestAssignmentChangesCommand`: không có `PanelId` thì tự tính từ `RegionJson`; **một CR mỗi Panel giao thoa**, các CR cùng vùng lỗi chung `ChangeRequest.GroupId` (Guid?, migration) — đã chốt 2026-11-12, không dùng bảng nối.
- [ ] FE danh sách CR gom theo `GroupId`; đóng từng CR theo Panel.
- [ ] Test: hộp vắt 2 panel 50/50 → 2 panel; lấn 10% → 1 panel.

#### REV-02 · Định tuyến theo lớp lỗi Artwork / Lettering — DB + BE + FE · ✅ lưới V3 (2026-11-28) · cũ P2-02
- Lưới V3: lớp Tranh → ô vẽ cuối nhánh tranh của trang; lớp Chữ → ô Lettering cùng trang (đã tự duyệt thì mở lại, Letterer được báo). Nộp lại ô = CR `Resolved`; duyệt ô cổng = `Verified` cho ô cổng + ô cuối nhánh song song cùng trang; còn CR `Open` thì duyệt 409.
- [ ] `ChangeRequest.Layer` (`Artwork | Lettering`) + migration.
- [ ] `Lettering` → Letterer được giao Page (fallback Artist của Page); `Artwork` → Artist giữ Panel (ưu tiên Panel > Page > Chapter).
- [ ] CR Lettering không đổi trạng thái lớp Ink.
- [ ] FE chọn lớp lỗi khi khoanh vùng.

#### REV-03 · Check Balloon Fit khi Panel bị sửa nét — BE · ✅ lưới V3 (2026-11-28) · cũ P2-03
- Lưới V3: CR lớp Tranh trên khung có bóng thoại gọi `BalloonFitRules.FlagAsync`; duyệt bị chặn tới khi xác nhận (ART-06).
- [ ] Dùng chung cơ chế [ART-06](04_ARTWORK_PLAN.md); CR `Artwork` tạo cho Panel X bật cờ.
- [ ] Nộp lại Gate 2 bị chặn khi còn cờ chưa xác nhận (`PanelReworkRequired → CompositeUnderReview`).

#### REV-04 · Cô lập trạng thái Panel khi rework — BE · 🟡 · cũ P2-04
- [ ] Chỉ `StageProgress` của Panel lỗi → `ChangesRequested`; Panel khác giữ `Approved`; việc cấp Page không kéo cả trang về rework.
- [ ] `Approve Page` chỉ khi 100% CR của trang `Verified` (xác minh `ApproveAssignmentCommand` 🔍).
- [ ] Test end-to-end trang 5 panel, lỗi panel 2.

#### REV-05 · Chế độ so sánh trong ReviewView — FE · ❌ · cũ P2-05 · **cần user chốt**
- **Xung đột:** plan Editor cũ (`editor-review-screens.md`) đã **cố ý gỡ** Swipe, Onion-skin, Pixel diff, fullscreen khỏi màn duyệt để giữ "tính năng cơ bản, không rối công cụ". Spec V2.6 Module 3 mục 1 lại yêu cầu 3 chế độ + Pixel Diff. Chốt: làm lại theo spec, hay sửa spec giữ side-by-side?
- [ ] Toggle `Side-by-side | Swipe | Onion-skin` + slider opacity.
- [ ] Pixel diff bằng Canvas offscreen (tô màu pixel lệch + % khác), Web Worker nếu ảnh lớn.
- [ ] Căn giữa viewport composite 1200×1800, danh sách CR + thanh Approve / Request Changes bên phải (UI checklist B4).

#### REV-06 · Tách & dọn màn Editor — FE · ❌ · cũ UI GĐ8
- [ ] Phạm vi: `ReviewView.tsx` (~2.940), `ChapterReviewView.tsx` (~1.990), `ArtworkPanel.tsx` (~1.660), `ChapterProvenanceModal.tsx` (~1.150). (`ScriptReviewView` thuộc [SCR-21](01_SCRIPT_PLAN.md).)
- [ ] Tách khung so sánh, danh sách CR, bảng finding, thanh hành động duyệt.
- [ ] Màu trạng thái: Open rose, Resolved emerald, InReview amber; thay ~97 class lệch bảng ở `ChapterReviewView` và `ArtworkPanel`.
- [ ] Dialog/drawer đóng bằng Esc, có `aria-modal`.
- [ ] `ChapterReviewView` (duyệt cả chương): chuyển sang cùng bố cục (danh sách trang bên trái), trả việc theo từng assignment đích qua tab Notes dùng chung, bỏ checklist chỉ lưu cục bộ và `window.prompt` còn sót (từ `editor-review-screens.md` "Next").

#### REV-07 · (Tuỳ chọn) Ghim nhận xét & dải phiên bản — FE · ❌ · Lucian #302, #176
- [ ] Ghim CR tại toạ độ trên ảnh (dùng `RegionJson` có sẵn).
- [ ] Dải phiên bản v1/v2/v3 của Submission để so sánh/khôi phục (khôi phục = n+1, BR-08).

#### REV-08 · (Tuỳ chọn) PostgreSQL `box` + GiST — DB · ❌ · cũ P6-01
- [ ] Chỉ làm nếu REV-01 có vấn đề hiệu năng: cột `bounding_box box` song song JSON, index GiST, `&&`.

#### REV-09 · Mở lại trang đã duyệt trước Gate 3 (Q27) — BE + FE · ❌ · mới
- [ ] [BE] Lệnh khoanh lỗi trên trang `Approved` (dùng lại luồng tạo `ChangeRequest` của Gate 2 + REV-01): Editor, Producer dự phòng; chương `InProduction` (chưa `ChapterApproved`) → Panel giao thoa chuyển `Approved → PanelReworkRequired`, trang rời trạng thái duyệt; bắt buộc nhận xét; Audit Log; thông báo Artist/Letterer theo lớp lỗi (REV-02).
- [ ] [BE] Sau Gate 3 → 409 ("Producer mở lại chương").
- [ ] [FE] `ReviewView`: trang đã duyệt có nút "Mở lại để sửa" → vào chế độ khoanh lỗi.
- [ ] Test: Panel lỗi về rework, Panel khác giữ `Approved`; Gate 3 bị chặn tới khi duyệt lại; sau `ChapterApproved` → 409.

#### REV-10 · Phân tách PageReviewStatus và PanelStageProgress (D6) — DB + BE + FE · ❌
- [ ] [DB + BE] Tách biệt tường minh giữa `PageReviewStatus` (cấp Trang: `Draft`, `Reviewing`, `ChangesRequested`, `Approved`) và `PanelStageProgress` (cấp Panel: `InProgress`, `Submitted`, `InReview`, `ChangesRequested`, `Approved`) (Quyết định 2026-11-15 (D6)).
- [ ] [BE] Logic suy diễn: Trang đạt `PageReviewStatus.Approved` khi và chỉ khi 100% Panel thuộc trang đó có `PanelStageProgress == Approved` ở công đoạn tương ứng. Chặn không cho set trực tiếp `PageReviewStatus = Approved` nếu còn bất kỳ Panel nào chưa `Approved`.
- [ ] [FE] Kanban & Review UI: Badge trạng thái duyệt trang suy diễn từ tiến độ các Panel; tooltip hiển thị rõ tiến độ từng panel.

## 3. Changelog

| Ngày | Task | Trạng thái | Nhánh / Commit | Ghi chú |
|---|---|---|---|---|
| 2026-11-14 | REV-09 | Thêm | — (chỉ tài liệu) | Q27: Editor mở lại trang đã duyệt trước Gate 3 |
| 2026-11-12 | Luật 4 mắt | ✅ | BE `916eda2` (merge `f0ebc7c`) | P0-04 |
| 2026-11-12 | — | Lập kế hoạch | — | Gom từ plan tổng P2 + anti-slop GĐ8 |
