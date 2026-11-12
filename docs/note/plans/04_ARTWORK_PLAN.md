# 04 · BÀN VẼ & ĐẶT CHỮ: LAYOUT, PENCIL, INK, LETTERING (`ART`)

> **Spec:** Module 2, §1.3 (thuật toán thứ tự đọc), §6.1 mục 3 (composite nền), §6.1 mục 6 (ngôn ngữ bóng thoại), §6.2 (Ghost Pencil, Snapping, Web Worker + Presigned PUT), BR-04/13, BR-05, BR-19, BR-20, BR-27, BR-31, BR-34.
> **Thay cho:** plan tổng P1-04..P1-07, P2-06, P4-02, P5-02..P5-04; UI GĐ6 + nợ ArtistDesk của `ANTI_SLOP_REFACTOR_PLAN.md`; `UI_REFACTOR_CHECKLIST` B2/B3. Các plan UI Artist/Visual Panel Uploader cũ đã xong.
> **Repo:** `PanelForge_FA26SE251`, `panelforge-fe`.

---

## 1. Đã xong

| Hạng mục | Bằng chứng |
|---|---|
| Frame Template + áp vào Page (có Row-Banding RTL/LTR) | `Features/FrameTemplates/*`, `ApplyFrameTemplateCommand.cs:~80-100`, FE `FrameTemplatePicker.tsx` |
| Ánh xạ dòng kịch bản vào Panel | `AssignPanelScriptLinesCommand`, `AutoAssignScriptLinesCommand` |
| Upload artwork kèm SHA-256 (server tính lại, lệch → 400) + kiểm người giữ việc | `UploadArtworkCommand.cs:54-134` |
| Bóng thoại 1-1 `ScriptLineId`, vị trí độc lập (BR-05) | `AddElementCommand`, `ElementState` |
| Geometry Guard BR-20 (`TEXT_OVERFLOW`, `READING_ORDER_MISMATCH`, `OVERLAPS_KEY_ARTWORK_REGION`) | `CanvasElements/Common/LetteringWarningRules.cs` |
| **BR-31: Artist có `letter:write`** | P0-01: `ElementsController.cs` (commit `7dc2c4f`), FE `lib/permissions.ts` (`d5521da`) |
| Tách ArtistDeskView đợt 1 (2857 → 1622 dòng), hook `useLetteringBalloons` | FE `5b97617` |

## 2. Task

### Nghiệp vụ

#### ART-01 · Thuật toán thứ tự đọc Panel đầy đủ — BE + FE · 🟡 · cũ P1-04
- [ ] Hàm Domain thuần `PanelReadingOrder.Compute(panels, direction)`: tâm `cx, cy`; cùng hàng khi `|cyA−cyB| < min(hA,hB)/2`; RTL giảm dần `cx`, LTR tăng dần, `Vertical` bỏ phân hàng, sort theo `cy` (hiện RTL sort theo `X+W`, chưa có Vertical).
- [ ] Gọi lại khi `ApplyFrameTemplate`, `CreatePanel`, `UpdatePanelCoordinates`, `DeletePanel`, trừ khi Artist đã sửa tay (cờ `Panel.IsReadingOrderManual`).
- [ ] Endpoint `PUT /panels/{id}/reading-order` cho Artist giữ trang; UI đổi số trên `ArtistDeskView`.
- [ ] Unit test 3 hướng đọc.

#### ART-02 · Self-Rollback Ink → Pencil (BR-27.1) — BE + FE · ❌ · cũ P1-05
- [ ] `RollbackToPencilCommand(ChapterId, PageId, UserId, Reason)`: chỉ Artist giữ Page, chỉ khi chưa `UnderReview`; Pencil → `InProgress`, Ink chờ; audit.
- [ ] Nếu trang đã có bóng thoại → bật cờ Check Balloon (ART-06).
- [ ] FE nút `[↺ Quay lại sửa Pencil]` + lý do.
- [ ] Test: trang `UnderReview` → 409.

#### ART-03 · Script Coverage Counter trên bàn vẽ — FE · 🟡 🔍 · cũ P1-06
- [ ] Xác minh `ArtistDeskView` có thanh coverage; nếu chưa, tái dùng logic từ màn Writer.
- [ ] Chặn `Submit Pencil` khi < 100% dòng thoại của trang được gắn Panel (đồng bộ rule BE nếu có).

#### ART-04 · Letterer bị khoá Layout/Graphic (BR-31.2) — BE + FE · 🟡 🔍 · cũ P1-07
- [ ] Xác minh `PanelsController` (create/update/delete/coordinates), `FrameTemplatesController.Apply`, `AssetsController.UploadArtwork` trả 403 cho Letterer.
- [ ] FE `LetteringWorkspace`: lớp tranh read-only, ẩn công cụ khung.
- [ ] Test role-gate.

#### ART-05 · Thứ tự Page bằng LexoRank ở Backend — DB + BE · 🟡 · cũ P4-02
- [ ] `Page.Rank` (string), migration sinh rank từ `PageNumber`; chèn/sắp xếp chỉ cập nhật 1 dòng; `PageNumber` thành giá trị hiển thị.
- [ ] Đồng bộ với FE `db/schema.ts` (đã dùng `lexorank`).

#### ART-06 · Cờ ⚠️ Check Balloon Fit — BE + FE · ❌ · cũ P2-03 (dùng chung REV-03)
- [ ] Bật `IsArtworkUpdatedAlert` trên bóng thoại thuộc Panel X khi: upload Ink mới cho Panel X, Self-Rollback, hoặc CR lớp Artwork cho Panel X.
- [ ] Endpoint xác nhận "đã kiểm tra" (Artist/Letterer của trang) → gỡ cờ.
- [ ] FE viền cam trên balloon ở `LetteringWorkspace` + `ArtistDeskView`; i18n.

#### ART-07 · Upload: hash trong Web Worker + Presigned PUT — FE + BE · ❌ · cũ P5-04
- [ ] FE `sha256.worker.ts` dùng `crypto.subtle.digest`.
- [ ] BE cấp presigned PUT R2 + endpoint finalize (server đọc object, tính lại hash — giữ BR-04).
- [ ] Giữ đường upload cũ làm fallback khi dev không có R2.

#### ART-08 · Composite 1200×1800 chạy nền — BE · 🟡 · cũ P2-06
- [ ] Đọc `IPageLetteringCompositor` + implementation; chuyển sang `Channel<T>` + `BackgroundService`, kích hoạt khi cả Ink & Lettering submitted (ASG-02).
- [ ] Lưu composite qua CAS, gắn với Submission để Editor xem.

### Trải nghiệm bàn vẽ

#### ART-09 · Ghost Pencil Overlay — FE · ❌ · cũ P5-02
- [ ] Slider opacity Pencil ↔ Ink trên `LetteringWorkspace` và `ReviewView` (cần API trả artwork Pencil + Ink của Page).

#### ART-10 · Magnetic Snapping & Safe Margin — FE · ❌ · cũ P5-03
- [ ] Konva: hút cạnh Panel vào margin 3% và cạnh Panel lân cận khi < 8px; hiện guide line.

### Tách file & dọn UI (theo checklist [UIQ §5](08_UI_QUALITY_PLAN.md))

#### ART-11 · Tách `LetteringWorkspace.tsx` (~4.760 dòng) — FE · ❌ · cũ UI GĐ6
- [ ] Tái dùng `useLetteringBalloons`; nếu dùng chung hai role thì chuyển vào `shared/features/lettering/` (không import chéo role).
- [ ] Tách `useLetteringWorkspaceData`, `LetteringToolbar` (SPEECH/THOUGHT/NARRATION/SFX), `LetteringCanvas`, `BalloonInspector`, `ScriptLinePanel` (badge `isStale`, 3 cảnh báo BR-20), `AiDialogueShortenPanel`.
- [ ] Dọn ~93 class màu lệch bảng, chữ nhỏ; xác minh `OfflineStatusBanner`, `ElementConflictModal` (409).
- [ ] Đổi tên wrapper `LettererWorkspace.tsx` → `LettererDeskView.tsx` cho đối xứng (UI checklist B3).
- **DoD:** view < 600 dòng, component < 400, giữ `data-testid`.

#### ART-12 · Trả nợ `ArtistDeskView` (1.622 dòng) & `ArtistCanvaSidebar` (~2.900 dòng) — FE · ❌ · cũ UI GĐ9.4–9.5
- [ ] `ArtistDeskView`: tách `useArtistDeskData`, `useFrameTemplates`; mở rộng viewport canvas.
- [ ] `ArtistCanvaSidebar`: tách theo tab Script, Bible, Templates, Lettering, Change Requests, History.
- [ ] Xác minh chú thích đánh số (`#1, #2`) trên thumbnail và zoom, `ChangeRequestPanel` ghim đầu khi `ReworkRequired` (UI checklist B2).
- [ ] Xoá `SpreadWorkbenchModal.tsx` và các workspace cũ (`ArtistWorkspace.tsx`, `EditorWorkspace.tsx`, `WriterWorkspace.tsx`) nếu grep xác nhận không còn dùng.

### Hạ tầng

#### ART-13 · Hoàn tất chuyển tách panel sang .NET native — BE · 🟡 · từ `PanelForge_FA26SE251/docs/superpowers/plans/2026-10-31-native-dotnet-panel-splitter.md`
- **Đã có:** `Infrastructure/ExternalServices/OpenCvPanelSplitter.cs` (OpenCvSharp4 4.13, runtime win + linux-x64 slim), `SplitArtworkQuery`, `PanelSplitterClient.cs` đã gỡ. Checkbox của plan cũ chưa được đánh dấu.
- [ ] Kiểm chứng trong Docker Linux: `docker build` rồi gọi `POST /api/pages/{pageId}/split-artwork` với ảnh mẫu; nếu `DllNotFoundException` cho `OpenCvSharpExtern`: `ldd libOpenCvSharpExtern.so`, thêm gói thiếu vào stage `runtime` của `Dockerfile`.
- [ ] Test parity với `app.py` (cùng số panel, thứ tự đọc, bbox, bong bóng) và unit test `SplitArtworkQuery` (Page không tồn tại → NotFound; ảnh hỏng → Validation 400).
- [ ] `HANDOFF.md`: ảnh không giải mã được → 400; bỏ 503 `PANEL_SPLITTER_UNAVAILABLE`; FE bỏ thông báo "service tách panel chưa chạy" nếu có.
- [ ] `src/PanelForge.PanelSplitter/README.md`: ghi đã chuyển sang native, giữ `app.py` làm nguồn đối chiếu parity.
- **Ngoài phạm vi:** downscale ảnh lớn (chỉ làm khi có số đo thực tế và parity vẫn đạt); phát hiện panel không viền (cần model kiểu Magi).

### Ngôn ngữ bóng thoại (BR-34, quyết định Q9)

> Hiện trạng code: **chưa có gì** — không có `LanguageCode`/`Languages` ở Series, `ElementState` hay DTO (grep 2026-11-12).

#### ART-14 · Ngôn ngữ Series & bản dịch bóng thoại — DB + BE + FE · ❌ · mới
- [ ] Series: `OriginalLanguage` (mặc định `vi`) + `ReleaseLanguages` (mảng, luôn chứa ngôn ngữ gốc); chỉ Producer sửa (`UpdateSeriesCommand` hoặc command riêng); migration; FE form Series + i18n.
- [ ] `ElementState`: nội dung chữ thành từ điển `Texts[languageCode]`; bản gốc vẫn gắn `ScriptLineId` + `IsStale`. Đọc sự kiện cũ (chỉ có một chuỗi chữ) như `Texts[original_language]` khi apply Marten.
- [ ] Sự kiện + command `UpdateElementTranslation(pageId, elementId, languageCode, text, expectedVersion)`: quyền như sửa chữ (Artist/Letterer trong phạm vi việc — `WorkScopeGuard`, BR-31); từ chối `languageCode` ngoài `ReleaseLanguages`; append-only, BR-11.
- [ ] `GetPageSnapshotQuery` trả chữ theo `?lang=` + danh sách ngôn ngữ còn thiếu của mỗi bóng thoại.
- [ ] FE `ArtistDeskView` / `LetteringWorkspace`: bộ chọn "ngôn ngữ đang soạn", hiện cờ bóng thoại thiếu bản dịch; đổi ngôn ngữ không đổi vị trí/kiểu chữ.
- [ ] Đề xuất dịch bằng AI (tuỳ chọn, sau cùng): đi qua `AiSuggestion` + quyết định của người (BR-02).
- [ ] Test: dịch ngoài phạm vi trang → 403; ngôn ngữ không thuộc Series → 400; sửa bản dịch không đổi `Position`.

#### ART-15 · Kiểm tra theo ngôn ngữ & tiến độ bản dịch — BE + FE · ❌ · mới
- **Phụ thuộc:** ART-14; nối với [ASG-02](03_ASSIGNMENT_PLAN.md) (Ink ∥ Lettering, BR-19) và [REL-09](06_RELEASE_PLAN.md) (nghiệm thu ấn bản).
- [ ] `LetteringWarningRules` (BR-20) chạy cho từng ngôn ngữ; cảnh báo kèm `languageCode`.
- [ ] Nộp việc Lettering vào Gate 2 chỉ yêu cầu đủ chữ **ngôn ngữ gốc** (BR-34.4); không chặn vì thiếu bản dịch.
- [ ] Query tiến độ dịch theo ấn bản: số bóng thoại đã dịch / tổng, danh sách thiếu, cảnh báo BR-20 mức chặn — dùng cho bước nộp bản dịch `SubmitEditionTranslation` (REL-09) và bàn vẽ.
- [ ] Bản dịch được nhập cả sau khi chương `ChapterApproved` (lớp tranh khoá, lớp chữ ngôn ngữ chưa nghiệm thu vẫn sửa được); chặn sửa bản dịch của ấn bản đang `InReview`/`EditorApproved`/`Approved`/`Published` trừ khi bị Editor trả về hoặc `Reopen Edition`.

## 3. Changelog

| Ngày | Task | Trạng thái | Nhánh / Commit | Ghi chú |
|---|---|---|---|---|
| 2026-11-12 | BR-31 | ✅ | BE `7dc2c4f`, FE `d5521da` (merge `f0ebc7c` / `4cc89c7`) | P0-01 |
| 2026-11-12 | — | Lập kế hoạch | — | Gom từ plan tổng + anti-slop GĐ6/GĐ9 |
| 2026-11-12 | ART-14, ART-15 | Thêm | — (chỉ tài liệu) | Ngôn ngữ bóng thoại theo spec BR-34 / Q9 |
