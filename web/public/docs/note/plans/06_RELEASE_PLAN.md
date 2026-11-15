# 06 · VÒNG ĐỜI CHƯƠNG, GATE 3 & BÀN GIAO PUBLISHER (`REL`)

> **Spec:** Module 5 mục 1–2, §5.2 máy trạng thái 4, BR-09/16/17 (PreviewLink ≤72h, watermark, signed URL 10 phút), BR-12/28 (ChapterLockGate).
> **Thay cho:** plan tổng P1-01, phần còn lại của P0-02, P4-03, P4-04, M1-12; `UI_REFACTOR_CHECKLIST` C1, C4; Lucian #189.
> **Repo:** `PanelForge_FA26SE251`, `panelforge-fe`, `panelforge-mobile` (enum trạng thái).

---

## 1. Đã xong

| Hạng mục | Bằng chứng |
|---|---|
| ChapterLockGate: `NO_PAGES`, `ASSIGNMENTS_NOT_APPROVED`, `OPEN_CHANGE_REQUESTS`, `BLOCKING_FINDINGS`, **`IMPACT_FLAGS`** (chặn), **`PAGES_WITHOUT_WORK`** (cảnh báo) | `Chapters/Common/ChapterLockGate.cs`; P0-02 commit `01f5f9f` |
| ChapterSnapshot bất biến (manifest hash), duyệt lại tạo snapshot mới | `Domain/Entities/Content/ChapterSnapshot.cs` |
| PreviewLink gắn email, có hạn, watermark; mobile review | `Preview/PreviewLink.cs`, `PreviewDtos.cs:32-40`, `screens/review/*` |
| Signed URL ảnh gốc | `IssueArtworkAccessLinkCommand` 🔍 |
| Export CBZ (ComicInfo RTL), ảnh trang, PDF | `Infrastructure/Exports/SkiaChapterExportRenderer.cs` |

## 2. Quyết định đã chốt (2026-11-12)

- `ChapterStatus.Locked` gộp vào `Approved`.
- Publisher: **phương án A** — portal chỉ đọc với nội dung sản xuất (nhận gói, PreviewLink); Publish/Reopen chuyển về Producer.
- **Bổ sung Q7 (2026-11-12):** Publisher **quy định thương mại** (Free/Trả phí, giá VNĐ, số trang xem trước) theo từng ấn bản ngôn ngữ qua Publisher Portal — chi tiết ở [RDR-07](07_READER_PLAN.md). Producer chỉ xem cấu hình này.
- **Bổ sung Q10:** mỗi cặp (chương, ngôn ngữ) là một **ấn bản `ChapterEdition`**; Producer nghiệm thu, phát hành, mở lại **từng ấn bản**; Snapshot và gói xuất theo ấn bản (BR-34.5–6). `Approve Chapter` = khoá tranh + nghiệm thu ấn bản gốc.
- **Quyết định 2026-11-15 (Quyền phát hành & bàn giao V2.6):** Producer duyệt nghiệm thu chương (`ChapterApproved`) và bàn giao sang Publisher (`HandOffToPublisher`); **PUBLISHER** chọn thời điểm phát hành ngay hoặc hẹn giờ (`PublishEdition`, `ScheduleEdition`), theo từng ấn bản ngôn ngữ (chuyển chương sang `HandedOffAndPublished`). Tuyệt đối không có cơ chế trả về / từ chối bàn giao từ Publisher. Mở lại sản xuất (về `InProduction`) vẫn độc quyền thuộc Producer. Publisher cấu hình tài khoản ngân hàng nhận thanh toán; Publisher không duyệt thanh toán VietQR; Publisher giữ quyền định giá ấn bản và số trang xem trước (preview).

## 3. Task

#### REL-01 · Chuẩn hoá máy trạng thái Chương — DB + BE + FE + MO · 🟡 · cũ P1-01 · **làm cùng [SCR-08](01_SCRIPT_PLAN.md)**
- [ ] Enum: thêm `PreProduction = 0` (mặc định khi tạo), `Archived = 5`; chuẩn hoá `ChapterApproved = 2`; xoá `Locked = 3` (gộp vào `ChapterApproved`, Q1). Vòng đời Chapter kết thúc tại `ChapterApproved` (Gate 3). Bàn giao là domain event `ChapterHandedOff` (lưu `handed_off_at`, `handed_off_by`, Quyết định 2026-11-15 (D1, D3)).
- [ ] Migration: `UPDATE chapters SET status = 2 WHERE status = 3`; chương chưa freeze → `PreProduction`.
- [ ] Domain `Chapter`: `StartProduction()`, `RecordHandedOff()`, `Archive()`, `Restore()`; `Reopen()` chỉ `ChapterApproved → InProduction` kèm lý do (chỉ Producer).
- [ ] Rà mọi điều kiện `Status == InProduction` (~24 file).
- [ ] (Rà soát 2026-11-13) `PreProduction` đã có (D12); enum vẫn còn `Approved = 2, Locked = 3, Published = 4` → còn việc gộp `Locked`, thêm `Archived`, bỏ `Published` khỏi Chapter (chuyển sang `ChapterEdition`).
- [ ] FE/Mobile: type enum, badge, i18n.
- **DoD:** `PreProduction → InProduction → ChapterApproved` (phát sinh `ChapterHandedOff`, Publisher phát hành ấn bản trên `ChapterEdition`); `Archived` soft-delete; Reopen độc quyền Producer có audit.

#### REL-02 · Gate 3 hoàn chỉnh — BE · 🟡 · phần còn lại P0-02
- [ ] Sau [ASG-01](03_ASSIGNMENT_PLAN.md): `PAGES_WITHOUT_WORK` chuyển từ cảnh báo thành **chặn**; cập nhật test `LockGate_PageWithoutProductionWork_IsWarningOnly`.
- [ ] Item gate trả kèm danh sách `PageId/PageNumber` vướng (thêm trường tuỳ chọn, không phá DTO).
- [ ] **(Rà soát 2026-11-13, xác nhận lỗi)** `ChapterLockGate` không kiểm "100% Trang `Approved`" (BR-12): chỉ đếm `ASSIGNMENTS_NOT_APPROVED`. Chương **không có việc nào** → 0 việc chưa duyệt, `PAGES_WITHOUT_WORK` chỉ cảnh báo → `ApproveChapter` thành công và tạo Snapshot từ trang chưa vẽ. Không chờ ASG-01: chặn ngay khi chương không có việc Artist/Letterer nào; sau ASG-01 chặn theo từng trang.
- [ ] Tính điều kiện theo trang: mọi Page phải có lượt duyệt Gate 2 `Approved` (StageProgress/Assignment Review của trang), không suy ra từ tổng số việc.
- [ ] `SCRIPT_NOT_FROZEN` (`ChapterLockGate.cs:59`) chuyển từ cảnh báo thành **chặn**: hiện Producer mở lại kịch bản rồi vẫn duyệt chương được trong lúc Writer đang sửa → tranh lệch kịch bản.
- [ ] **Ảnh cuối = bản đã duyệt (Q27):** `FinalArtwork.cs` (khoảng dòng 43–55) đang lấy `AssetReference` mới nhất theo `StageOrder`/`VersionNumber`, kể cả bản upload chưa duyệt. Đổi thành bản ảnh của **lần duyệt Gate 2 gần nhất** của từng trang; chương cũ chưa có lần duyệt nào giữ cách cũ làm dự phòng để Preview không trống.
- [ ] Snapshot ghi `frozen_script_version_id` (Q26, [SCR-41](01_SCRIPT_PLAN.md), [BIB-14](02_BIBLE_PLAN.md)).
- [ ] Test: chương 0 việc → 409; kịch bản đang `Draft` sau Unfreeze → 409; ảnh upload sau khi trang được duyệt không vào Snapshot.

#### REL-03 · `ChapterReleaseModal.tsx` — FE · ❌ · cũ M1-12 (Ảnh hưởng Quyết định 2026-11-15)
- [ ] Khung modal Producer một chỗ với các tab: Gate 1 (ASG-01), Chuyển phạm vi, Gate 3 (danh sách item lock gate + nút Approve), Bàn giao sang Publisher (REL-05). Quyền phát hành ấn bản chuyển sang Publisher Portal của Publisher (REL-04).
- [ ] Gate 3 hiển thị checklist điều kiện từng nấc (ý tưởng Lucian #189), số liệu thật từ `GET /lock-gate`.
- [ ] Bước "Editor xác nhận biên tập" trước cổng bàn giao của Producer (checklist BR-28) — việc còn lại của `editor-review-screens.md`; chốt có cần trạng thái riêng hay chỉ là item trong lock gate.

#### REL-04 · Publisher Portal: Bàn giao, định giá, cấu hình ngân hàng & phát hành ấn bản — BE + FE · 🟡 · cũ P4-03 (Ảnh hưởng Quyết định 2026-11-15)
- [ ] Quyết định 2026-11-15: Producer bàn giao chương (`ChapterApproved` + `ChapterHandedOff`); Publisher nhận gói bàn giao và độc quyền chọn phát hành ngay hoặc hẹn giờ theo từng ấn bản ngôn ngữ (`POST /api/editions/{id}/publish`, `POST /api/editions/{id}/schedule` -> `Published`, trỏ con trỏ `current_published_snapshot_id`, D1). Tuyệt đối không có lệnh trả về / từ chối bàn giao từ Publisher. Mở lại sản xuất (`InProduction`) giữ độc quyền cho Producer (`POST /api/chapters/{id}/reopen`). Cập nhật test `ChapterPublishFlowTests`.
- [ ] **Bắt buộc cấu hình Free/Paid (BR-33, D4):** Publisher bắt buộc phải cấu hình hình thức thương mại (Miễn phí hoặc Trả phí kèm giá VNĐ và số trang xem thử) trước khi phát hành ấn bản. Tuyệt đối không có giá trị mặc định "chưa cấu hình = Free" (D4).
- [ ] Publisher cấu hình thông tin tài khoản ngân hàng nhận thanh toán trên Publisher Portal (không duyệt thanh toán VietQR; hệ thống tự động xác nhận hoặc Admin đối soát).
- [ ] Rà `PublisherController` + `Features/Publisher/*`: thêm command phát hành ấn bản / lên lịch phát hành (`PublishEdition`, `ScheduleEdition`); chặn/loại bỏ lệnh trả về; giữ query đọc gói bàn giao.
- [ ] **Một Publisher duy nhất (Q12):** giữ `SystemRole.Publisher` thấy mọi Series (đúng spec, không cần liên kết Series ↔ Publisher). Chặn tạo/gán tài khoản Publisher thứ hai: `AssignUserRoleCommand`, `CreateUserByAdminCommand`, `UpdateUserByAdminCommand` trả 409 khi đã có một Publisher đang hoạt động; seed đúng một Publisher; test.
- [ ] FE `roles/publisher/*`: hiển thị gói bàn giao, cấu hình tài khoản ngân hàng, mục "Quy định thương mại" (giá VNĐ & preview, RDR-07), nút Phát hành ngay / Lên lịch phát hành theo từng ấn bản; không có nút từ chối / trả về bàn giao; RBAC matrix, i18n, docs.

#### REL-05 · Bước HandedOff & gói bàn giao — BE + FE · 🟡 · cũ P4-04
- [ ] Xác minh export Webtoon vertical slice + JSON provenance; bổ sung nếu thiếu.
- [ ] `HandOffChapterCommand`: Producer kích hoạt bàn giao gói export (snapshot hash) + publisher name/external ref sang Publisher sau khi chương `ChapterApproved` → `HandedOff`, audit (Quyết định 2026-11-15).
- [ ] Export chọn ngôn ngữ (một gói cho mỗi ngôn ngữ trong `release_languages`) — sau REL-08.
- [ ] **Gắn Snapshot vào `ExportJob`** (còn mở từ `PanelForge_FA26SE251/docs/implementation/CF4_Version_Provenance.md` §7): thêm `ChapterSnapshotId` (sau REL-09: `EditionSnapshotId`) vào `ExportJob` khi tạo job; thay `OpenJsonExport.SnapshotOfAsync` (dò Snapshot theo `VersionVector`) bằng id đã gắn, để gói xuất luôn đúng bản đã nghiệm thu.
- [ ] Tab Bàn giao trong `ChapterReleaseModal`.

#### REL-06 · Xác minh bảo vệ xem thử — BE · ✅ 🔍
- [ ] Validator PreviewLink trần 72h; signed URL ảnh 10 phút; có test.

#### REL-07 · UI xuất bản & xem thử — FE · ❌ · UI checklist C1, C2 (phần watermark)
- [ ] `ExportView`: theo dõi tiến độ export thật (polling), chọn định dạng, lịch sử có link tải.
- [ ] Bảng PreviewLink: số lượt truy cập, trạng thái thu hồi, triage feedback (`Noted` / `NeedsChange`).
- [ ] `PublicPreviewView`: watermark chéo không che điều hướng RTL/LTR/Vertical và ngăn feedback.

#### REL-09 · Ấn bản ngôn ngữ `ChapterEdition`: nghiệm thu, phát hành, mở lại theo ngôn ngữ — DB + BE + FE + MO · ❌ · mới (Q10)
- ✅ **Q28 (2026-11-14, thay câu hỏi VERSION_REVIEW mục 6):** đa ngôn ngữ làm **trong hệ thống tại công đoạn Lettering** ([ART-14](04_ARTWORK_PLAN.md)); không tải ảnh trang đã dịch. **Gỡ `PageTranslation`:** bỏ endpoint tải/xoá ảnh dịch của Publisher (`PublisherMonetizationController`, `SetPageTranslationCommand`); reader (`PublicReaderQueries`, `ChapterReadAccess`, `PublicCatalogQueries`) chuyển sang ảnh trong Snapshot của ấn bản đã phát hành (REL-08). Trong lúc REL-08 chưa xong, reader vẫn đọc dữ liệu `PageTranslation` có sẵn (chỉ đọc, không cho tải mới); khi đủ ấn bản thì xoá bảng + object R2 `page-translations/…` (migration có `Down`). VERSION_REVIEW mục 6 (ghi đè/xoá cứng) tự hết.
- **Phụ thuộc:** [ART-14](04_ARTWORK_PLAN.md) (ngôn ngữ Series), REL-01 (máy trạng thái chương). Là nền cho REL-08, [RDR-07](07_READER_PLAN.md), [RDR-10](07_READER_PLAN.md), [RDR-11](07_READER_PLAN.md).
- [ ] Entity + bảng `chapter_editions` theo spec §6.1.5 (`Draft → InReview → Reviewed → Approved → Published`, unique `(chapter_id, language_code)`, `version` cho BR-11); tự tạo/huỷ ấn bản `Draft` khi Producer đổi `release_languages` (không xoá ấn bản đã phát hành). Lưu con trỏ `current_published_snapshot_id` (D1).
- [ ] `Approve Chapter` (Gate 3) đồng thời chuyển ấn bản gốc từ `Draft → Approved` ngay lập tức (Quyết định 2026-11-15 (D5)).
- [ ] Trạng thái ấn bản: `Draft → InReview → Reviewed → Approved → Published` (Quyết định 2026-11-15 (D5)).
- [ ] `SubmitEditionTranslationCommand(chapterId, lang)` — Artist/Letterer phụ trách chữ: cần chương `Approved`, đủ bản dịch, không còn cảnh báo BR-20 mức chặn của `lang` (query ART-15); thiếu → 409 kèm danh sách → `InReview`.
- [ ] **Editor duyệt bản dịch (Q14, D5):** `ReviewEditionCommand` — Editor (Producer dự phòng): duyệt → `Reviewed` (đổi tên từ `EditorApproved`, lưu `reviewed_by` + `reviewer_role`, D5), hoặc trả về `Draft` kèm `ChangeRequest` lớp Lettering có `language_code` (dùng lại REV-01/REV-02). Luật 4 mắt: Editor không được là người đã nhập bản dịch của ấn bản → 403.
- [ ] `ApproveEditionCommand(chapterId, lang)` = **Producer cho phép phát hành**: chỉ từ `Reviewed` → `Approved`, tạo Snapshot (REL-08); audit.
- [ ] Quyết định 2026-11-15: `PublishEditionCommand`, `ScheduleEditionCommand` do Publisher thực hiện trên Publisher Portal sau khi Producer bàn giao (`Approved` → `Published`, D1). Producer độc quyền cho phép phát hành (`ApproveEditionCommand`) và mở lại (`ReopenEditionCommand` / `ReopenChapter` về `Draft`/`InProduction`).
- [ ] FE `ChapterReleaseModal` tab "Ấn bản ngôn ngữ": bảng ngôn ngữ × (tiến độ dịch, trạng thái, giá do Publisher đặt — chỉ đọc), nút Cho phép phát hành / Bàn giao / Mở lại (chỉ Producer). Nút Phát hành / Lên lịch nằm ở Publisher Portal.
- [ ] FE Editor: hàng đợi "Duyệt bản dịch" trong `ReviewView` / `EditorDeskView` (bản ghép theo ngôn ngữ, khoanh lỗi, duyệt).
- [ ] Mobile/FE catalog: chỉ liệt kê ấn bản `Published`.
- [ ] Test: nộp `en` khi chương chưa Approved → 409; thiếu bản dịch → 409; Producer cho phép phát hành khi chưa `EditorApproved` → 409; Editor duyệt bản mình dịch → 403; Reopen `en` không đổi `vi`; Publisher gọi Review/Approve → 403; Publisher gọi PublishEdition/ScheduleEdition trước khi Producer bàn giao → 409.

#### REL-08 · Snapshot & ảnh trang theo ấn bản (BR-34.5) — BE · ❌ · mới (Q9, Q10)
- **Phụ thuộc:** REL-09, [ART-14](04_ARTWORK_PLAN.md), [ART-08](04_ARTWORK_PLAN.md) (composite nền).
- [ ] Mỗi lần `Approve Edition` ghép ảnh trang (lớp tranh + lớp chữ `lang`) và tạo `edition_snapshots` append-only; ấn bản gốc dùng `ChapterSnapshot`.
- [ ] Ảnh reader/preview lấy từ `current_snapshot_id` của ấn bản ([RDR-11](07_READER_PLAN.md)); PreviewLink chọn ấn bản để xem.

#### REL-10 · Kiểm thử trình duyệt luồng phiên bản & xuất bản — QA · ❌ · từ CF4 §8 (chưa từng chạy)
- **Agent:** `qa-tester` (chỉ chạy khi user yêu cầu chạy test). Nguồn: bảng mục F trong `PanelForge_FA26SE251/docs/implementation/CF4_Version_Provenance.md` §8.
- [ ] Producer duyệt chương → Snapshot mới ở tab "Bản duyệt" (modal Lịch sử & nguồn gốc), hash khớp.
- [ ] Hai tab cùng sửa một Panel/Scene → tab sau nhận 409, nạp lại, không ghi đè.
- [ ] Writer so sánh rồi khôi phục script → revision mới, nội dung về bản cũ.
- [ ] Tab Provenance đủ chuỗi Run → Step → Suggestion → Decision → Revision → Snapshot.
- [ ] Writer/Artist mở report → tab ẩn; gọi thẳng API → 403.
- [ ] "Lịch sử trang": Artist so sánh rồi khôi phục → thêm event, canvas về bản cũ, lịch sử cũ còn.
- [ ] Màn Xuất "JSON kèm nguồn gốc" → SHA-256 file và `manifestHash` khớp.
- [ ] Writer sửa thoại đã đặt chữ (Lettering đã duyệt) → việc Lettering của Panel đó cần làm lại, Letterer nhận thông báo.
- [ ] 🔍 Xác minh thêm từ CF5 §5: ảnh trang của Reader (`GetPublicPageImage`) lấy từ ảnh theo Panel thay vì ảnh trang hoàn chỉnh; trang chỉ có ảnh theo Panel có export được không.

#### REL-11 · Xóa cứng PreProduction rỗng vs Lưu trữ (Archive) Chapter (D3) — DB + BE + FE · ❌
- [ ] [DB + BE] Thêm `Archived = 5` vào `ChapterStatus`, bổ sung cột `archived_at TIMESTAMPTZ NULL`, `archived_by UUID NULL` trong `chapters` (Quyết định 2026-11-15 (D3)).
- [ ] [BE] `DeleteChapterCommand`: kiểm tra điều kiện xóa cứng — chỉ cho phép xóa vĩnh viễn khi chương ở `PreProduction` và chưa có bất kỳ trang, kịch bản hoặc tài sản nào gắn kết. Nếu đã có dữ liệu hoặc đã bước vào `InProduction` trở đi, từ chối xóa và yêu cầu chuyển sang `ArchiveChapterCommand`.
- [ ] [BE] `ArchiveChapterCommand`: chuyển `Status = Archived`, ẩn khỏi danh sách làm việc thường ngày, giữ nguyên toàn bộ lịch sử revision, audit log và provenance. `RestoreChapterCommand`: khôi phục chương về trạng thái trước khi lưu trữ. Chặn xóa/archive nếu chương đã có ấn bản `Published`.
- [ ] [FE] Modal Quản lý chương: hiển thị nút Delete (thùng rác gõ DELETE) cho chương rỗng `PreProduction`; hiển thị nút Lưu trữ (Archive) cho chương có dữ liệu; hỗ trợ xem danh sách chương đã lưu trữ và khôi phục.

## 4. Changelog

| Ngày | Task | Trạng thái | Nhánh / Commit | Ghi chú |
|---|---|---|---|---|
| 2026-11-15 | REL-01, REL-03, REL-04, REL-05, REL-09 | Cập nhật | — (chỉ tài liệu) | Quyết định 2026-11-15: Producer duyệt & bàn giao; Publisher phát hành / hẹn giờ theo ấn bản (-> HandedOffAndPublished); không có lệnh trả về bàn giao; mở lại InProduction giữ độc quyền Producer; Publisher cấu hình tài khoản ngân hàng (không duyệt VietQR), giữ định giá & preview |
| 2026-11-14 | REL-09 | Bổ sung | — (chỉ tài liệu) | Q28: bản dịch trong hệ thống tại Lettering; gỡ luồng Publisher tải ảnh dịch (`PageTranslation`) |
| 2026-11-14 | REL-02, REL-09 | Bổ sung | — (chỉ tài liệu) | Q26/Q27: ảnh cuối = bản đã duyệt, snapshot ghi bản kịch bản đã chốt; câu hỏi `PageTranslation` |
| 2026-11-12 | Gate 3 (`IMPACT_FLAGS`, `PAGES_WITHOUT_WORK`) | ✅ một phần | BE `01f5f9f` (merge `f0ebc7c`) | P0-02 |
| 2026-11-12 | — | Lập kế hoạch | — | Gom từ plan tổng P1-01, P4-03, P4-04 |
| 2026-11-12 | REL-03, REL-04, REL-05 sửa; REL-08 thêm | Đối chiếu spec Q7, Q9, Q10 | — (chỉ tài liệu) | Publisher đặt giá; ấn bản ngôn ngữ (REL-09) nghiệm thu/phát hành riêng; Snapshot theo ấn bản |
| 2026-11-12 | REL-04, REL-09 sửa | Đối chiếu spec Q12, Q14 | — (chỉ tài liệu) | Một Publisher duy nhất (bỏ việc gắn Publisher với Series); ấn bản dịch: Editor duyệt, Producer cho phép phát hành |
| 2026-11-12 | REL-05 sửa; REL-10 thêm | Rà tài liệu repo | — (chỉ tài liệu) | Chuyển 2 việc còn mở từ `docs/implementation/CF4`, `CF5` của backend vào plan |
