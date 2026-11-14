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

## 3. Task

#### REL-01 · Chuẩn hoá máy trạng thái Chương — DB + BE + FE + MO · 🟡 · cũ P1-01 · **làm cùng [SCR-08](01_SCRIPT_PLAN.md)**
- [ ] Enum: thêm `PreProduction = 0` (mặc định khi tạo), `HandedOffAndPublished`; chuẩn hoá `ChapterApproved`; xoá `Locked = 3` (gộp vào `ChapterApproved`, Q1).
- [ ] Migration: `UPDATE chapters SET status = 2 WHERE status = 3`; chương chưa freeze → `PreProduction`.
- [ ] Domain `Chapter`: `StartProduction()`, `MarkHandedOffAndPublished()`; `Reopen()` chỉ `ChapterApproved → InProduction` kèm lý do.
- [ ] Rà mọi điều kiện `Status == InProduction` (~24 file).
- [ ] (Rà soát 2026-11-13) `PreProduction` đã có (D12); enum vẫn còn `Approved = 2, Locked = 3, Published = 4` → còn việc gộp `Locked`, thêm `HandedOffAndPublished`.
- [ ] FE/Mobile: type enum, badge, i18n.
- **DoD:** `PreProduction → InProduction → ChapterApproved → HandedOffAndPublished` chạy end-to-end; Reopen có audit.

#### REL-02 · Gate 3 hoàn chỉnh — BE · 🟡 · phần còn lại P0-02
- [ ] Sau [ASG-01](03_ASSIGNMENT_PLAN.md): `PAGES_WITHOUT_WORK` chuyển từ cảnh báo thành **chặn**; cập nhật test `LockGate_PageWithoutProductionWork_IsWarningOnly`.
- [ ] Item gate trả kèm danh sách `PageId/PageNumber` vướng (thêm trường tuỳ chọn, không phá DTO).
- [ ] **(Rà soát 2026-11-13, xác nhận lỗi)** `ChapterLockGate` không kiểm "100% Trang `Approved`" (BR-12): chỉ đếm `ASSIGNMENTS_NOT_APPROVED`. Chương **không có việc nào** → 0 việc chưa duyệt, `PAGES_WITHOUT_WORK` chỉ cảnh báo → `ApproveChapter` thành công và tạo Snapshot từ trang chưa vẽ. Không chờ ASG-01: chặn ngay khi chương không có việc Artist/Letterer nào; sau ASG-01 chặn theo từng trang.
- [ ] Tính điều kiện theo trang: mọi Page phải có lượt duyệt Gate 2 `Approved` (StageProgress/Assignment Review của trang), không suy ra từ tổng số việc.
- [ ] `SCRIPT_NOT_FROZEN` (`ChapterLockGate.cs:59`) chuyển từ cảnh báo thành **chặn**: hiện Producer mở lại kịch bản rồi vẫn duyệt chương được trong lúc Writer đang sửa → tranh lệch kịch bản.
- [ ] **Ảnh cuối = bản đã duyệt (Q27):** `FinalArtwork.cs` (khoảng dòng 43–55) đang lấy `AssetReference` mới nhất theo `StageOrder`/`VersionNumber`, kể cả bản upload chưa duyệt. Đổi thành bản ảnh của **lần duyệt Gate 2 gần nhất** của từng trang; chương cũ chưa có lần duyệt nào giữ cách cũ làm dự phòng để Preview không trống.
- [ ] Snapshot ghi `frozen_script_version_id` (Q26, [SCR-41](01_SCRIPT_PLAN.md), [BIB-14](02_BIBLE_PLAN.md)).
- [ ] Test: chương 0 việc → 409; kịch bản đang `Draft` sau Unfreeze → 409; ảnh upload sau khi trang được duyệt không vào Snapshot.

#### REL-03 · `ChapterReleaseModal.tsx` — FE · ❌ · cũ M1-12
- [ ] Khung modal Producer một chỗ với các tab: Gate 1 (ASG-01), Chuyển phạm vi, Gate 3 (danh sách item lock gate + nút Approve), Bàn giao (REL-05), Phát hành (nút Publish + **cấu hình giá do Publisher đặt, chỉ đọc** — [RDR-07](07_READER_PLAN.md)).
- [ ] Gate 3 hiển thị checklist điều kiện từng nấc (ý tưởng Lucian #189), số liệu thật từ `GET /lock-gate`.
- [ ] Bước "Editor xác nhận biên tập" trước cổng phát hành của Producer (checklist BR-28) — việc còn lại của `editor-review-screens.md`; chốt có cần trạng thái riêng hay chỉ là item trong lock gate.

#### REL-04 · Publisher Portal: chỉ đọc nội dung + một tài khoản Publisher duy nhất — BE + FE · 🟡 · cũ P4-03
- [ ] `POST /api/chapters/{id}/publish` và `/reopen` chỉ cho Producer (hiện Publish chỉ cho Publisher, Reopen cho Producer + Publisher — `ChaptersController.cs:445,456`, xác nhận lại 2026-11-13); cập nhật test `ChapterPublishFlowTests`.
- [ ] Đồng bộ comment và thông báo: `Chapter.Publish` ghi "Publisher duyệt xuất bản"; `ApproveChapterCommand` gửi Publisher thông báo "Có chương chờ duyệt xuất bản" → đổi thành thông báo bàn giao (Publisher không duyệt), Producer là người phát hành.
- [ ] Rà `PublisherController` + `Features/Publisher/*`: giữ query đọc, bỏ/chặn command duyệt/từ chối/lên lịch.
- [ ] **Một Publisher duy nhất (Q12):** giữ `SystemRole.Publisher` thấy mọi Series (đúng spec, không cần liên kết Series ↔ Publisher). Chặn tạo/gán tài khoản Publisher thứ hai: `AssignUserRoleCommand`, `CreateUserByAdminCommand`, `UpdateUserByAdminCommand` trả 409 khi đã có một Publisher đang hoạt động; seed đúng một Publisher; test.
- [ ] FE `roles/publisher/*`: ẩn nút hành động sản xuất; thêm mục "Quy định thương mại" (RDR-07); RBAC matrix, i18n, docs.

#### REL-05 · Bước HandedOff & gói bàn giao — BE + FE · 🟡 · cũ P4-04
- [ ] Xác minh export Webtoon vertical slice + JSON provenance; bổ sung nếu thiếu.
- [ ] `HandOffChapterCommand`: gói export (snapshot hash) + publisher name/external ref → `HandedOff`, audit.
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
- ⏳ **Cần chốt (VERSION_REVIEW mục 6):** code có `PageTranslation` — Publisher tải **ảnh trang đã dịch** theo ngôn ngữ, ghi đè (`Replace`) / xoá cứng (`ChapterManage.cs:291`), không qua `Asset`/quota. Spec BR-34 (Q9/Q10/Q14) thì bản dịch là **chữ theo bóng thoại** do Artist/Letterer nhập, Editor duyệt, Producer cho phép phát hành, Publisher chỉ đặt giá. Chốt giữ `PageTranslation` (và lưu theo `Asset` + version) hay gỡ để theo REL-09.
- **Phụ thuộc:** [ART-14](04_ARTWORK_PLAN.md) (ngôn ngữ Series), REL-01 (máy trạng thái chương). Là nền cho REL-08, [RDR-07](07_READER_PLAN.md), [RDR-10](07_READER_PLAN.md), [RDR-11](07_READER_PLAN.md).
- [ ] Entity + bảng `chapter_editions` theo spec §6.1.5 (`Draft → Approved → Published`, unique `(chapter_id, language_code)`, `version` cho BR-11); tự tạo/huỷ ấn bản `Draft` khi Producer đổi `release_languages` (không xoá ấn bản đã phát hành).
- [ ] `Approve Chapter` (đã có) đồng thời chuyển ấn bản gốc `Approved`.
- [ ] Trạng thái ấn bản: `Draft → InReview → EditorApproved → Approved → Published` (spec §5.2 máy 5).
- [ ] `SubmitEditionTranslationCommand(chapterId, lang)` — Artist/Letterer phụ trách chữ: cần chương `Approved`, đủ bản dịch, không còn cảnh báo BR-20 mức chặn của `lang` (query ART-15); thiếu → 409 kèm danh sách → `InReview`.
- [ ] **Editor duyệt bản dịch (Q14):** `ReviewEditionCommand` — Editor (Producer dự phòng): duyệt → `EditorApproved`, hoặc trả về `Draft` kèm `ChangeRequest` lớp Lettering có `language_code` (dùng lại REV-01/REV-02). Luật 4 mắt: Editor không được là người đã nhập bản dịch của ấn bản → 403.
- [ ] `ApproveEditionCommand(chapterId, lang)` = **Producer cho phép phát hành**: chỉ từ `EditorApproved` → `Approved`, tạo Snapshot (REL-08); audit.
- [ ] `PublishEditionCommand`, `ReopenEditionCommand(lang, reason)` — chỉ Producer; `Publish` chương hiện tại chuyển thành publish ấn bản gốc. `Reopen` chương → mọi ấn bản chưa phát hành về `Draft`, ấn bản đã phát hành giữ Snapshot cũ.
- [ ] FE `ChapterReleaseModal` tab "Ấn bản ngôn ngữ": bảng ngôn ngữ × (tiến độ dịch, trạng thái, giá do Publisher đặt — chỉ đọc), nút Cho phép phát hành / Phát hành / Mở lại.
- [ ] FE Editor: hàng đợi "Duyệt bản dịch" trong `ReviewView` / `EditorDeskView` (bản ghép theo ngôn ngữ, khoanh lỗi, duyệt).
- [ ] Mobile/FE catalog: chỉ liệt kê ấn bản `Published`.
- [ ] Test: nộp `en` khi chương chưa Approved → 409; thiếu bản dịch → 409; Producer cho phép phát hành khi chưa `EditorApproved` → 409; Editor duyệt bản mình dịch → 403; Reopen `en` không đổi `vi`; Publisher gọi Review/Approve/Publish → 403.

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
## 4. Changelog

| Ngày | Task | Trạng thái | Nhánh / Commit | Ghi chú |
|---|---|---|---|---|
| 2026-11-14 | REL-02, REL-09 | Bổ sung | — (chỉ tài liệu) | Q26/Q27: ảnh cuối = bản đã duyệt, snapshot ghi bản kịch bản đã chốt; câu hỏi `PageTranslation` |
| 2026-11-12 | Gate 3 (`IMPACT_FLAGS`, `PAGES_WITHOUT_WORK`) | ✅ một phần | BE `01f5f9f` (merge `f0ebc7c`) | P0-02 |
| 2026-11-12 | — | Lập kế hoạch | — | Gom từ plan tổng P1-01, P4-03, P4-04 |
| 2026-11-12 | REL-03, REL-04, REL-05 sửa; REL-08 thêm | Đối chiếu spec Q7, Q9, Q10 | — (chỉ tài liệu) | Publisher đặt giá; ấn bản ngôn ngữ (REL-09) nghiệm thu/phát hành riêng; Snapshot theo ấn bản |
| 2026-11-12 | REL-04, REL-09 sửa | Đối chiếu spec Q12, Q14 | — (chỉ tài liệu) | Một Publisher duy nhất (bỏ việc gắn Publisher với Series); ấn bản dịch: Editor duyệt, Producer cho phép phát hành |
| 2026-11-12 | REL-05 sửa; REL-10 thêm | Rà tài liệu repo | — (chỉ tài liệu) | Chuyển 2 việc còn mở từ `docs/implementation/CF4`, `CF5` của backend vào plan |
