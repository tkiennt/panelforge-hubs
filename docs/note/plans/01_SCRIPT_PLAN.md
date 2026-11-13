# 01 · KỊCH BẢN — SOẠN → DUYỆT → KHOÁ → SỬA MUỘN (`SCR`)

> **Spec:** Module 1 (soạn kịch bản, Gate 1), Module 4 (mở lại / sửa muộn), §1.2 (Trang → Panel → Nội dung), §5.2.
> **Thay cho:** `note/SCRIPT_FLOW_REFACTOR_PLAN.md` (ID `S0-01..S6-02`), plan tổng P4-01; liên quan P1-01/P1-02. Bỏ hẳn `SCRIPT_END_TO_END_REFACTOR_MASTER_PLAN.md`, `PAGE_BASED_SCRIPT_EDITOR_AND_DYNAMIC_ENTITY_LINKING_PLAN.md`.
> **Repo:** `PanelForge_FA26SE251` (chính), `panelforge-fe` (chính). Mobile không ảnh hưởng.
> **Phụ thuộc:** SCR-08 làm cùng [REL-01](06_RELEASE_PLAN.md) (ChapterStatus). Phần giao Page của Gate 1 ở [ASG-01](03_ASSIGNMENT_PLAN.md).

---

## 1. Hiện trạng đã có (không làm lại)

| Hạng mục | Bằng chứng |
|---|---|
| Writer soạn kịch bản, lưu theo Scene, revision append-only | `Features/ScriptLines/*` (`BatchSaveScriptLinesCommand`, `RestoreScriptRevisionCommand`), `ContentRevision` |
| `@Tên` → liên kết Bible / tạo Stub | `LinkBibleEntriesCommand`, `BibleEntry.CreateStub`, FE `@tiptap/extension-mention` |
| Đóng băng kịch bản + Bible Gate (chỉ `@Tag` phải CanonLocked) | `Chapters/Commands/FreezeScript/FreezeScriptCommands.cs`, `CheckChapterBibleGateQuery` |
| Mở lại: Writer yêu cầu → Producer duyệt/từ chối; Producer mở trực tiếp **bắt buộc lý do** + audit `UNFREEZE_SCRIPT` | `RequestScriptReopenCommand`, `ApproveScriptReopenCommand`, `UnfreezeChapterScriptCommand` (P0-03, commit `c8dc9c2`) |
| Sửa dòng đã gắn Panel → cờ ⚑ + bóng thoại `isStale` + Keep/Rework | `Assignment.FlagScriptImpact`, `GetPageSnapshotQueryHandler`, `ResolveImpactReviewCommand` |
| Lưu cấu trúc Page/Panel từ kịch bản trong một transaction | `SyncScriptStructureCommand` (commit `f95369e`) |

## 2. Vấn đề còn lại

| # | Vấn đề | Bằng chứng | Hậu quả |
|---|---|---|---|
| V1 | Không có trạng thái kịch bản (chỉ `IsScriptFrozen` + `ScriptReopenStatus`) | `Chapter.cs` | UI tự suy luận; không chặn sửa khi đang duyệt |
| V2 | Duyệt kịch bản đi nhờ pipeline Assignment, stage Script tự duyệt | `CreateSeriesCommand.cs:142` (`isApprovalGate: false`), `SubmitAssignmentCommand.cs:70` | Màn Editor duyệt kịch bản gần như vô dụng; trái spec ("Script ngoài Assignment") |
| V3 | Freeze không yêu cầu kịch bản đã duyệt / hết ChangeRequest | `FreezeScriptCommands.cs:43-73` | Khoá được kịch bản đang bị trả về |
| V4 | **Bug:** Unfreeze trực tiếp không chạy phân tích ảnh hưởng khi đóng băng lại | `FreezeScriptCommands.cs:76` chỉ chạy khi `ScriptReopenStatus == Approved` | Panel vẽ theo thoại cũ không bị ⚑ |
| V5 | Phân tích ảnh hưởng dựa trên timestamp | `FreezeScriptCommands.cs:80` | Sửa rồi hoàn tác vẫn bị tính; dòng xoá mềm không bị tính |
| V6 | Loại dòng không lưu trong DB; Trang/Panel/SFX mã hoá bằng chữ, FE đoán bằng regex | `scriptFlowAdapter.ts:561-680` | Dễ vỡ; BE không kiểm được BR-05 |
| V7 | Speaker nhúng trong chuỗi `Tên: "..."`, không có nhãn quần chúng | `composeSpeakerLine` (`scriptFlowAdapter.ts:336`) | Lettering phải tách chuỗi |
| V8 | Hai cơ chế khoá trùng: `Chapter.IsScriptFrozen` và `ChapterScript.IsLocked` | `ChapterScript.cs` | Nguồn sự thật mập mờ |
| V9 | Revision theo Scene, không có "bản đã khoá" cấp chương | `ContentRevision.SceneId` | Không so được bản khoá với bản sửa |
| V10 | Lưu nhiều request rời theo Scene | `ScriptEditorView.tsx` (~25 lời gọi service) | Lưu dở dang khi lỗi giữa chừng |
| V11 | Code FE chết | `comic-editor/ComicScriptEditor` + `versioning/*`, `script/storyboard/*`, `machines/chapterScriptMachine.ts` | Agent dễ sửa nhầm |
| V12 | `ScriptEditorView.tsx` > 3.200 dòng | — | Khó sửa an toàn |

## 3. Thiết kế đích

### 3.1 Máy trạng thái kịch bản (tách khỏi `ChapterStatus`)

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Draft: Tạo chương
    Draft --> InReview: Writer gửi duyệt (snapshot revision)
    InReview --> Draft: Writer rút lại
    InReview --> ChangesRequested: Editor/Producer yêu cầu sửa (CR gắn dòng)
    ChangesRequested --> InReview: Writer sửa & gửi lại
    InReview --> Frozen: GATE 1 — Producer Approve Script & Start Production
    Draft --> Frozen: GATE 1 (bỏ qua review, D3)
    Frozen --> Amending: Reopen (lý do bắt buộc)
    Amending --> Frozen: Đóng băng lại → diff với bản đã khoá → ⚑ Panel bị ảnh hưởng
```

| Trạng thái | Writer sửa? | Ghi chú |
|---|---|---|
| `Draft` | ✅ | Auto-save |
| `InReview` | ❌ | Bản đang duyệt bất biến; CR gắn `ScriptLineId` |
| `ChangesRequested` | ✅ | Writer xử lý CR rồi gửi lại |
| `Frozen` | ❌ | Mọi vai trò chỉ đọc; Artist bắt đầu vẽ |
| `Amending` | ✅ (chỉ Writer) | Sản xuất hình vẫn chạy |

`Chapter.Status = PreProduction` khi kịch bản lần đầu ở `Draft/InReview/ChangesRequested`; Gate 1 chuyển `PreProduction → InProduction` cùng lúc `→ Frozen`. `Amending` không đưa chương về `PreProduction`.

### 3.2 Cấu trúc dữ liệu

```
Chapter
 ├─ Page ─ Panel (+ Direction: ghi chú góc máy, MỚI)
 │          └─ ScriptLine (PanelId = neo chính)
 │               • Kind: Action | Dialogue | Thought | Narration | Sfx   (MỚI)
 │               • Text (gộp DialogueText/StageDirection)
 │               • SpeakerCharacterId? (@Tag)  • SpeakerLabel? ("Lính gác 1", MỚI)
 └─ Scene (giữ, 1 Scene mặc định ẩn mỗi chương — D2)
```

`Kind` → loại bóng (BR-05): Dialogue→SPEECH, Thought→THOUGHT, Narration→NARRATION_BOX, Sfx→SOUND_EFFECT, Action→không bóng.

### 3.3 Phiên bản & khoá

- Revision cấp chương: `ContentRevision` với `Kind = ChapterScript`, `SceneId` = scene ẩn; payload cả cây Page→Panel→Line; bỏ qua nếu hash không đổi.
- `Chapter.FrozenScriptRevisionId` + `ScriptContentHash` trỏ đúng bản đã khoá.
- `ScriptReopen` append-only (Id, ChapterId, Reason, RequestedById/At, DecidedById/At, Decision, BaselineRevisionId) thay 4 cột `ScriptReopen*`.
- Đóng băng lại: diff baseline ↔ hiện tại theo `ScriptLineId` → `FlagImpactedWorkAsync` (sửa V4, V5).
- Bỏ `ChapterScript.IsLocked/Lock/Unlock` (V8).

### 3.4 API đích (`/api/chapters/{chapterId}/script`)

| Method | Route | Vai trò | Use case |
|---|---|---|---|
| GET | `/script` | Thành viên | Cây kịch bản + `scriptStatus`, `revisionId`, `frozenRevisionId`, CR mở |
| PUT | `/script` | Writer (Producer nếu chưa có Writer) | Lưu cả cây trong 1 transaction, `expectedRevisionId` (BR-11) |
| POST | `/script/submit` · `/withdraw` | Writer | Draft/ChangesRequested ↔ InReview |
| POST | `/script/request-changes` | Editor, Producer | InReview → ChangesRequested |
| POST | `/script/approve` | Producer | Gate 1 → Frozen (+ giao Page, ASG-01) |
| POST | `/script/reopen-requests`, `/{id}/decision`, `/reopen`, `/refreeze` | Writer / Producer | Mở lại & đóng băng lại |
| GET | `/script/revisions`, `/{id}`, `/diff?from&to` | Thành viên | Lịch sử & so sánh |

Endpoint cũ (`freeze-script`, `unfreeze-script`, `*-script-reopen`, `scenes/*`, `script-lines/*`, `pages/sync-script-structure`) chạy song song, `[Obsolete]`, gỡ ở SCR-23.

### 3.5 Quyết định

| ID | Câu hỏi | Khuyến nghị / Kết quả |
|---|---|---|
| D1 ✅ | Bỏ stage "Script" khỏi pipeline? | **Bỏ.** Duyệt bằng `ScriptStatus` trên Chương; người viết chính = `Chapter.WriterUserId?` |
| D2 ✅ | Scene nullable hay Scene ẩn? | **Đã chốt 2026-11-12: Scene mặc định ẩn**, `scene_id` giữ NOT NULL (`SceneId` dùng ở ~140 file, cả AI workflow) |
| D3 ✅ | Gate 1 bắt buộc qua `InReview`? | **Không**, nhưng chặn khi còn CR kịch bản mở |
| D4 ✅ | Writer sửa khi `InReview`? | **Không** (phải Withdraw về Draft) |
| D5 ✅ | Giữ `ChapterScript` (RawText)? | **Bỏ** entity và bảng (backend chỉ ghi `RawText` trong `BatchSaveScriptLinesCommand`, không chỗ nào đọc) |
| D6 ✅ | Dữ liệu cũ (tiêu đề Trang/Panel dạng chữ, speaker nhúng trong thoại) | **Không chuyển đổi.** Bám luồng mới; dữ liệu demo/seed định dạng mới nạp sau. Không giữ code đọc định dạng cũ; migration chỉ cần đúng schema |
| D7 ✅ | Suy nghĩ (Thought) chọn thế nào khi gõ? | **Đã chốt 2026-11-13:** hậu tố `(nghĩ)` ở ô người nói đổi `kind` → `Thought`; thêm `Ctrl+3`. Không tạo ô nhập riêng |
| D8 ✅ | Giữ cú pháp gõ tắt `@Tên: "..."`, `SFX:`, `Caption:`, ký tự mồi `#`/`-` + Tab? | **Đã chốt 2026-11-13: bỏ** trong editor (thay bằng H.1 + phím tắt + menu `/`); cú pháp chữ chỉ còn ở luồng dán/chuyển đổi `AiScriptConvertModal` |
| D9 ✅ | Ngưỡng cảnh báo mật độ | **Đã chốt 2026-11-13 (Warning, không chặn):** > 7 panel/trang · > 3 bóng thoại/panel · > 25 chữ/bóng thoại · panel không có Action |
| D10 ✅ | Kéo thả sắp xếp Page/Panel trong Board view khi nào? | **Đã chốt 2026-11-13:** chỉ khi `Draft`/`ChangesRequested`/`Amending`; Panel đã có artwork thì hỏi xác nhận và gắn ⚑ như sửa muộn |

---

## 4. Task

### Phase A — Sửa lỗi & dọn dẹp, không đổi hợp đồng (làm ngay)

#### SCR-01 · Unfreeze trực tiếp phải kích hoạt phân tích ảnh hưởng (V4) — BE · ❌ · cũ S0-01
- [ ] `Chapter.UnfreezeScript(userId, reason)`: đặt `ScriptReopenStatus = Approved`, `ScriptReopenRequestedAt = now`, `ScriptReopenReason = reason`.
- [ ] `UnfreezeChapterScriptCommandHandler` truyền lý do vào domain (lý do đã bắt buộc từ P0-03).
- [ ] Test: Unfreeze → sửa dòng đã neo Panel có Assignment Approved → Freeze → `HasScriptImpact = true`.
- **DoD:** cả hai đường mở lại đều gắn ⚑ khi đóng băng lại.

#### SCR-02 · Freeze chặn khi còn ChangeRequest kịch bản mở (V3) — BE · ❌ · cũ S0-02
- [ ] Đếm `ChangeRequests` của chương có `ScriptLineId != null` và `Status ∈ {Open, Resolved}` → 409 kèm số lượng.
- [ ] Test 409.

#### SCR-03 · Xoá code FE chết (V11) — FE · ❌ · cũ S0-03
- [ ] Grep xác nhận không còn import rồi xoá: `roles/writer/components/script/flow/comic-editor/{ComicScriptEditor.tsx, sampleScript.ts, versioning/, nodes/, extensions/, index.ts}` (**giữ** `comicCounting.ts`), `roles/writer/components/script/storyboard/`, `roles/writer/machines/chapterScriptMachine.ts` + file `.test.*` tương ứng.
- [ ] `thumbnail-studio/` chỉ giữ phần `ScriptEditorView` dùng.
- [ ] `typecheck`, `i18n:check` (gỡ key không còn dùng).

### Phase B — Mô hình dữ liệu (V6, V7, D2, D6)

#### SCR-04 · `ScriptLineKind`, `Text`, `SpeakerLabel` — DB + BE · ✅ · cũ S1-01
- [x] Enum `ScriptLineKind`: `Action = 1, Dialogue = 2, Thought = 3, Narration = 4, Sfx = 5`.
- [x] `ScriptLine`: thêm `Kind` (bắt buộc, không suy từ dữ liệu cũ — D6), `SpeakerLabel` (≤100), `Text`. `DialogueText/StageDirection` chỉ giữ để code cũ biên dịch tới khi chuyển xong, xoá ở SCR-23.
- [x] Luật domain: `Action` không có speaker; `Dialogue/Thought` cho phép `SpeakerCharacterId`, `SpeakerLabel` hoặc trống (đám đông).
- [x] Migration `AddScriptLineKindAndPanelDirection`, `db/check_db_sync.ps1`; DTO thêm `kind`, `speakerLabel`.

#### SCR-05 · Scene mặc định ẩn mỗi chương (D2) — BE · ✅ · cũ S1-02
- [x] `Scene.CreateDefault(chapterId)`; `CreateChapterCommand` tạo kèm.
- [x] `EnsureDefaultAsync(db, chapterId)` để mọi command kịch bản lấy Scene mặc định (không nhận SceneId từ client).
- [x] UI không hiển thị Scene; không hỗ trợ chương nhiều Scene (D6).

#### ~~SCR-06 · Backfill dữ liệu cũ~~ — ⛔ Huỷ theo D6 · cũ S1-03
- Không chuyển đổi dữ liệu cũ. Dữ liệu demo/seed định dạng mới nạp bằng task riêng (xem cuối Phase G).

<!-- Nội dung cũ giữ để tra cứu, không làm:
- [ ] `BackfillScriptStructureCommand(ChapterId?)`, idempotent: dòng `^(TRANG|PAGE)\s*\d+` → đảm bảo `Page`, xoá mềm dòng; `^PANEL\s*\d+\.\d+` → đảm bảo `Panel`, phần sau `:` vào `Panel.Direction`; dòng còn lại suy `Kind`, tách `Tên: "..."`; neo `PanelId` theo thứ tự.
- [ ] Ghi một `ContentRevision` "Backfill V2.6", không sửa revision cũ; log dòng không nhận diện được.
-->

#### SCR-07 · `Panel.Direction` — DB + BE · ✅ · cũ S1-04
- [x] Cột nullable ≤1000 ký tự, `PanelDto.direction`.
- [x] `PUT /api/panels/{panelId}/direction` (UpdatePanelDirectionCommand).

### Phase C — Vòng đời kịch bản (V1, V2, V3, D1, D3, D4)

#### SCR-08 · `ScriptStatus` + domain methods — BE · ❌ · cũ S2-01 · **làm cùng REL-01**
- [ ] Enum `ScriptStatus`: `Draft = 1, InReview = 2, ChangesRequested = 3, Frozen = 4, Amending = 5`.
- [ ] `Chapter`: `ScriptStatus`, `ScriptSubmittedRevisionId?`, `FrozenScriptRevisionId?`, `WriterUserId?`; methods `SubmitScript`, `WithdrawScript`, `RequestScriptChanges`, `ApproveScript`, `ReopenScript`, `RefreezeScript` (sai trạng thái → `InvalidOperationException` → 409).
- [ ] `IsScriptFrozen` thành thuộc tính tính toán; migration chỉ thêm cột mặc định `Draft` (D6: không map trạng thái dữ liệu cũ).
- [ ] Unit test mọi chuyển trạng thái.

#### SCR-09 · `ScriptReopen` append-only — DB + BE · ❌ · cũ S2-02
- [ ] Entity + bảng `script_reopens`. Không chuyển dữ liệu 4 cột `ScriptReopen*` (D6); xoá cột cũ ở SCR-23.

#### SCR-10 · Commands vòng đời (`Features/Scripts/Commands/*`) — BE · ❌ · cũ S2-03
- [ ] `SubmitScriptCommand` (chụp revision, thông báo Editor + Producer), `WithdrawScriptCommand`.
- [ ] `RequestScriptChangesCommand` (≥1 CR mở hoặc comment; BR-06: người yêu cầu ≠ Writer).
- [ ] `ApproveScriptCommand` = **Gate 1 phần kịch bản**: Bible Gate, ≥1 Page & ≥1 dòng, 0 CR kịch bản mở → `Frozen` + hash; gọi logic giao Page của ASG-01 nếu đã có.
- [ ] `RequestScriptReopenCommand`, `DecideScriptReopenCommand`, `ReopenScriptCommand` → `Amending`, baseline = bản khoá.
- [ ] `RefreezeScriptCommand`: diff theo `ScriptLineId` → `FlagImpactedWorkAsync` → `Frozen`; xác minh có Notification cho Artist/Letterer bị ảnh hưởng (plan tổng M4-04 🔍).
- [ ] Mỗi command có test (thành công + 403 + 409).

#### SCR-11 · Luật quyền sửa kịch bản — BE · ❌ · cũ S2-04
- [ ] Viết lại `ScriptLineRules.AuthorizeAsync` theo `ScriptStatus` + `Chapter.WriterUserId`.
- [ ] Producer chỉ sửa khi chưa có Writer (BR-07/23); xác minh 403 khi Producer sửa thoại (plan tổng M1-04 🔍).
- [ ] Test ma trận vai trò × trạng thái.

#### SCR-12 · Gỡ stage Script khỏi pipeline (D1) — BE + DB · ❌ · cũ S2-05
- [ ] `CreateSeriesCommand` / `MasterDataSeeder` / `PipelineTemplate`: bỏ stage `script` cho Series mới.
- [ ] Không migrate Assignment stage Script cũ (D6). Code không còn tạo/đọc Assignment Script; Producer chỉ định Writer qua `Chapter.WriterUserId` (thêm vào form tạo/sửa chương).
- [ ] Rà `SubmitAssignmentCommand`, `GetEditorReviewQueueQuery:217`, `StageProgressRules` bỏ nhánh script; query mới `GetScriptReviewQueueQuery`.

### Phase D — Lưu cả tài liệu & lịch sử cấp chương (V9, V10)

#### SCR-13 · `GetChapterScriptQuery` — BE · ❌ · cũ S3-01
- [ ] Trả `pages[].panels[].lines[]`, `scriptStatus`, `revisionId`, `frozenRevisionId`, `openChangeRequests[]`.

#### SCR-14 · `SaveChapterScriptCommand` (PUT cả cây) — BE · ❌ · cũ S3-02
- [ ] Một transaction: upsert Page/Panel (không xoá Page/Panel có artwork, trả cảnh báo), upsert/xoá mềm dòng theo Id client, Bible links, @stub.
- [ ] `expectedRevisionId` lệch → 409; hash không đổi → không tạo revision.
- [ ] Tái dùng `ScriptLineRules.ValidateContent/ValidateSpeakerAsync/ValidateBibleEntriesAsync/SetBibleLinksAsync`, `ReworkApprovedLetteringAsync`, logic tạo Page/Panel của `SyncScriptStructureCommand`.
- [ ] Test: lưu 2 lần cùng nội dung → 1 revision; xung đột → 409; Amending sửa dòng có bóng → Lettering Approved → ReworkRequired.

#### SCR-15 · Lịch sử & so sánh — BE · ❌ · cũ S3-03
- [ ] `GetScriptRevisionsQuery`, `GetScriptRevisionQuery`, `DiffScriptRevisionsQuery` (added/changed/removed theo `ScriptLineId`), `RestoreScriptRevisionCommand` cấp chương → n+1 (BR-08).

#### SCR-16 · Bỏ `ChapterScript` (D5) — BE + DB · ❌ · cũ S3-04
- [ ] Xác minh chỉ `BatchSaveScriptLinesCommand:172` còn ghi; bỏ ghi, xoá entity + migration.

### Phase E — API

#### SCR-17 · `ScriptsController` — BE · ❌ · cũ S4-01
- [ ] Route bảng 3.4, `[RequireWorkspaceRole]` theo spec §5.1, đủ 400/403/404/409.
- [ ] `[Obsolete]` endpoint cũ, chuyển sang command mới nếu cùng nghĩa.
- [ ] Bàn giao hợp đồng (AGENTS.md §3.7): ví dụ JSON cho FE.

### Phase F — Frontend

#### SCR-18 · Service & types — FE · ✅ · cũ S5-01
- [x] `types/pipeline.ts`, `services/scriptLine.service.ts`, `services/panel.service.ts`: types `ScriptLineKind`, `ScriptLineDto`, `PanelDto.direction`, `UpdatePanelDirectionRequest` khớp DTO BE.

#### SCR-19 · Adapter tường minh — FE · ✅ · cũ S5-02
- [x] `scriptFlowAdapter.ts`: `scenesToTipTapDoc` / `extractScriptLinesFromDoc` theo schema `kind`, `speakerLabel`, `text`, `direction`.
- [x] Test round-trip pass 18/18 tests.

#### SCR-20 · Tách `ScriptEditorView` — FE · ❌ · cũ S5-03 + UI GĐ7
- [ ] `hooks/useScriptDocument.ts` (tải, debounce PUT, xử lý 409: hiện so sánh/tải lại — tham khảo ý tưởng "conflict merge" Lucian #149), `hooks/useScriptLifecycle.ts` (`availableActions` theo trạng thái + vai trò), `components/script/ScriptStatusBar.tsx` (dùng `ReasonForm` cho reopen).
- [ ] `ScriptEditorView.tsx` chỉ còn bố cục, < 800 dòng (mục tiêu chung UIQ: < 600).
- [ ] Bố cục 3 cột: bối cảnh (Story Arc, Outline) / soạn thảo / ngăn Consistency (Blocking, Warning) — bấm finding cuộn tới dòng và viền cam (từ `UI_REFACTOR_CHECKLIST` B1).
- [ ] Rà copy `AiScriptConvertModal` (29 chỗ chữ nhỏ) theo UIQ.
- [ ] Mọi chuỗi mới vào `locales/{vi,en}`; tuân `DESIGN_RULES.md`.

#### SCR-21 · Màn Editor duyệt kịch bản — FE · ❌ · cũ S5-04
- [ ] `ScriptReviewView.tsx` đọc `GET /script`, CR gắn dòng, nút "Yêu cầu sửa" → `request-changes`; Producer thấy nút Gate 1. Bỏ `openReview/approveAssignment` cho kịch bản.
- [ ] Hàng đợi Editor dùng `GetScriptReviewQueueQuery`.

#### SCR-22 · Diff & lịch sử — FE · ❌ · cũ S5-05
- [ ] `ScriptHistoryModal.tsx` dùng `/script/revisions` + `/script/diff`; hiển thị "khác bản đã khoá" khi `Amending`.

### Phase G — Gỡ phần cũ & tài liệu

#### SCR-23 · Gỡ endpoint/cột cũ — BE + FE + DB · ❌ · cũ S6-01
- [ ] Khi FE không còn gọi: xoá endpoint/command cũ (`FreezeChapterScriptCommand`, `UnfreezeChapterScriptCommand`, `*ScriptReopenCommand`, `BatchSaveScriptLinesCommand`, `SyncScriptStructureCommand`), cột `ScriptReopen*`, `DialogueText/StageDirection`.

#### SCR-24 · Tài liệu — Docs · ❌ · cũ S6-02
- [ ] Viết lại `PanelForge_FA26SE251/docs/domain/CHAPTER_AND_SCRIPT_SPECIFICATION.md` §2.1–2.3; cập nhật `.agents/CODEBASE_MAP.md` dòng "Script & Lời thoại".

> **Ngoài phạm vi (D6):** dữ liệu demo/seed định dạng mới (Page/Panel thật, `Kind`, `SpeakerLabel`, `ScriptStatus`) nạp sau bằng task riêng. Dữ liệu kịch bản cũ trong DB dev có thể hiển thị sai — chấp nhận được.

### Phase H — Trải nghiệm gõ kịch bản Graphic Novel (UI/UX + logic soạn thảo)

> **Nguồn:** walkthrough template Graphic Novel của WriterSolo (2026-11-13) đối chiếu với editor hiện tại `ScreenplayFlowEditor.tsx` (1.390 dòng) + `nodes/ScriptLineBlockNode.ts` (821 dòng).
> **Nguyên tắc:** học luồng gõ bằng bàn phím của WriterSolo, tránh các lỗi đã thấy ở đó, không chép giao diện. Phase H chỉ làm **sau SCR-04, SCR-07, SCR-19** (cần `Kind`, `Panel.Direction`, adapter tường minh); SCR-25 (luật gõ dạng hàm thuần) làm trước được trên mock.

#### H.0 Đối chiếu

| Hạng mục | WriterSolo (quan sát) | PanelForge hiện tại | Hướng đích |
|---|---|---|---|
| Chuyển loại dòng | Page→Enter→Panel→Enter→Action; Action→Enter→Action; **Tab**→Character→Enter→Dialogue | Enter trên dòng nội dung luôn ra Action; Tab xoay vòng Action→Dialogue→Caption→SFX; Page/Panel tạo bằng `#`/`!`/`-`/`"` + Tab (khó nhớ) | Bảng chuyển trạng thái tường minh (H.1), không phụ thuộc ký tự mồi |
| Thoại | Tên và thoại **cùng dòng**, 2 cột | Đã có lưới 2 cột (`script-line grid`), nhưng speaker chỉ gán được bằng regex `@Tên: "..."` lúc Enter (`ScriptLineBlockNode.ts:730`) | Ô người nói riêng, gợi ý từ Bible ngay khi gõ, Enter sang ô thoại |
| Đánh số | PAGE n / PANEL n tự đánh số, header tự đếm `PANELS: n` | Tự đánh số `1.1, 1.2` nhưng số nằm **trong text** (`" Panel 1.2: [Toàn cảnh]`) | Số là nhãn không sửa được; text của dòng Panel là `Panel.Direction` |
| Tiêu đề panel | Lỗi dính chữ `PANEL 1WIDE SHOT…` | Nhãn và mô tả lẫn trong một chuỗi | Nhãn và mô tả là 2 vùng tách biệt |
| Toolbar loại dòng | Bấm nút làm **mất focus** editor, không có tooltip phím tắt | Palette nổi + dock dưới | Nút giữ focus (`onMouseDown` preventDefault), tooltip ghi phím tắt |
| Caption / SFX | Nhãn `CAPTION:` / `SFX:` tự sinh | Nhãn `Dẫn truyện` / `SFX` tự sinh; SFX bị bọc `* … *` vào text | Nhãn tự sinh, text sạch (không chèn ký tự trang trí vào dữ liệu) |
| Thống kê | Có, nhưng tính `CAPTION`, `SFX:KRAKOOM` là "nhân vật nói" | Chưa có thống kê kịch bản | Thống kê theo `Kind` + cảnh báo mật độ chữ cho truyện tranh (H.4) |
| Chế độ xem | Page / Cards / Mind Map, Filter theo loại dòng | Dải trang thu nhỏ ở dock; `storyboard/`, `thumbnail-studio/` dùng một phần | Kịch bản + Bảng trang (thẻ Page→Panel, kéo sắp xếp) + Lọc |
| Xuất | PDF, DOCX, Fountain, Final Draft, CSV… | Chưa có xuất kịch bản | PDF/DOCX kịch bản + CSV lời thoại cho Letterer |
| Lưu | Lưu file thủ công, cảnh báo đỏ | Auto-save debounce + bản nháp `localStorage` | Giữ; thêm trạng thái lưu rõ ràng + xử lý 409 (SCR-20) |
| Bỏ qua | ReadAloud, Gender/Bechdel, Ruler, 17 template screenplay | — | Không làm (không phục vụ sản xuất truyện tranh) |

#### H.1 Luật gõ đích

| Đang ở | Enter | Tab | Shift+Tab | Enter trên dòng trống |
|---|---|---|---|---|
| Page | Panel mới (số kế tiếp) | — | — | — |
| Panel (ô mô tả) | Action | — | — | Action |
| Action | Action | Ô người nói (Dialogue) | — | Panel mới |
| Ô người nói | Ô thoại cùng dòng | Ô thoại | Đổi về Action | Đổi về Action |
| Dialogue / Thought | Ô người nói mới (gợi ý người nói trước đó luân phiên) | Narration | Ô người nói | Action |
| Narration | Narration | SFX | Dialogue | Action |
| SFX | SFX | Action | Narration | Action |

Phím tắt: `Ctrl+Enter` Panel mới · `Ctrl+Shift+Enter` Trang mới · `Ctrl+1..5` Action/Dialogue/Thought/Narration/SFX · `/` mở menu loại dòng ở đầu dòng trống · `Alt+↑/↓` di chuyển dòng/panel · `@` gợi ý Bible (giữ hiện có). Dán văn bản tự do vẫn đi qua `AiScriptConvertModal`.

#### SCR-25 · Luật gõ dạng hàm thuần (`scriptGrammar.ts`) — FE · ✅
- [x] [FE] `flow/grammar/scriptGrammar.ts`: `nextKindOnEnter(kind, isEmpty)`, `nextKindOnTab(kind, dir)`, `slotOf(kind)`; bảng H.1 là dữ liệu, không rải `if` trong keymap.
- [x] [FE] Test bảng chuyển (viết, chạy khi user yêu cầu).
- **Phụ thuộc:** không (dùng `ScriptLineKind` tạm ở FE, khớp lại sau SCR-18).

#### SCR-26 · Viết lại keymap theo `scriptGrammar` — FE · ✅
- [x] [FE] `ScriptLineBlockNode.addKeyboardShortcuts` chỉ còn gọi `scriptGrammar` + lệnh chèn; xoá nhánh regex `@Tên: "..."`, `SFX:`/`*…*`, `Caption:` và ký tự mồi `#`/`!`/`-`/`"` — D8.
- [x] [FE] Thêm phím tắt H.1: `Ctrl+Enter` (Panel mới), `Ctrl+Shift+Enter` (Trang mới), `Ctrl+1..5` (đổi loại dòng); `Backspace` ở đầu dòng rỗng lùi một bậc theo bảng.
- **Phụ thuộc:** SCR-25, SCR-19.

#### SCR-27 · Ô người nói (speaker slot) cùng dòng thoại — FE · ✅
- [x] [FE] Dòng Dialogue/Thought có ô người nói cùng dòng, gợi ý từ Bible; luân phiên người nói A→B→A (`getRecentSpeakers`).
- [x] [FE] `(nghĩ)` / menu sắc thái đổi `kind` → `Thought` (D7).
- **Phụ thuộc:** SCR-26, SCR-04 (`SpeakerLabel`).

#### SCR-28 · Tiêu đề Trang/Panel: nhãn tự sinh + mô tả riêng — FE · ❌
- [ ] [FE] `PanelHeading` hiển thị nhãn `PANEL 2.3` không sửa được + vùng nhập `Panel.Direction` (góc máy/khung hình, placeholder "Toàn cảnh, góc thấp…"). Không còn text `" Panel 1.2: [Toàn cảnh]`.
- [ ] [FE] `PageHeading`: `TRANG 3 · 4 panel · 62 chữ thoại`; cảnh báo khi vượt ngưỡng D9 (vd > 7 panel/trang).
- [ ] [FE] Đánh số lại khi chèn/xoá/di chuyển (giữ `renumberEditorState`, chuyển sang đọc attr thay vì parse chuỗi).
- **Phụ thuộc:** SCR-07, SCR-26.

#### SCR-29 · Thanh loại dòng giữ focus + gợi ý phím tắt — FE · ❌
- [ ] [FE] Hợp nhất palette nổi và dock dưới thành một thanh loại dòng: Trang · Panel · Hành động · Thoại · Suy nghĩ · Dẫn truyện · SFX. Nút hiện trạng thái loại dòng đang đứng, `onMouseDown={e => e.preventDefault()}` để không mất focus, `title`/tooltip ghi phím tắt.
- [ ] [FE] Menu `/` ở đầu dòng trống (cùng danh sách, lọc theo gõ).
- [ ] [FE] Theo `DESIGN_RULES.md` + checklist UIQ §5; chuỗi vào `locales/{vi,en}`.
- **Phụ thuộc:** SCR-26.

#### SCR-30 · Bảng trang (Board view) — FE · ❌
- [ ] [FE] Chế độ xem thứ hai cạnh "Kịch bản": mỗi Page là một cột thẻ Panel (Direction, số dòng thoại, người nói, thumbnail nếu có — tái dùng `thumbnail-studio/ThumbnailCard`). Kéo thả đổi thứ tự Panel trong/giữa trang, Page giữa các trang (LexoRank) — chỉ khi `Draft`/`ChangesRequested`/`Amending` (D10).
- [ ] [FE] Bấm thẻ → cuộn editor tới Panel. Thay dải trang ở dock bằng mục lục trang có số panel (giữ ý tưởng hiện có).
- [ ] [FE] Gỡ phần `storyboard/` không còn dùng sau khi Board view thay thế (gộp với SCR-03).
- **Phụ thuộc:** SCR-28, SCR-14 (lưu cả cây).

#### SCR-31 · Lọc & tìm — FE · ❌
- [ ] [FE] Lọc theo `kind` (chỉ thoại / chỉ SFX / chỉ dẫn truyện) và theo nhân vật (dòng của @Tên); dòng bị lọc thu gọn, không xoá.
- [ ] [FE] Tìm & thay thế trong chương (không thay trong `@mention` đã liên kết, báo số chỗ bỏ qua).
- **Phụ thuộc:** SCR-26.

#### SCR-32 · Thống kê & cảnh báo mật độ — FE (+ BE nếu cần) · ❌
- [ ] [FE] Ngăn "Thống kê": số trang, panel/trang, dòng theo `kind`, số chữ thoại theo nhân vật, nhân vật xuất hiện theo trang. **Chỉ Dialogue/Thought tính là nhân vật nói** (tránh lỗi WriterSolo).
- [ ] [FE] Cảnh báo truyện tranh (ngưỡng D9): chữ/bóng thoại, bóng thoại/panel, panel/trang, panel không có Action. Đưa vào ngăn Consistency hiện có (`ConsistencyFindingsDrawer.tsx`) mức Warning; bấm → cuộn tới dòng (SCR-20).
- **Phụ thuộc:** SCR-26, SCR-28.

#### SCR-33 · Xuất kịch bản — BE + FE · ❌
- [ ] [BE] `GET /api/chapters/{chapterId}/script/export?format=pdf|docx|csv` từ `GetChapterScriptQuery`; PDF/DOCX theo định dạng comic script (TRANG / PANEL + Direction / TÊN ⇥ thoại / DẪN TRUYỆN: / SFX:); CSV lời thoại cho Letterer: `page,panel,order,kind,speaker,text,lineId`.
- [ ] [FE] Nút "Xuất" trong thanh trạng thái kịch bản; mọi vai trò thành viên được xuất.
- **Hợp đồng API:** BE ghi trước khi FE làm (README §2.2).
- **Phụ thuộc:** SCR-13, SCR-17.

#### SCR-34 · Ảnh tham chiếu theo Panel — FE · ❌
- [ ] [FE] Nút "Ảnh tham chiếu" trên `PanelHeading`: dán/kéo ảnh hoặc mở `QuickSketchModal` hiện có; hiển thị thumbnail nhỏ cạnh nhãn Panel và trong Board view. Không tạo loại dòng "Image" riêng (khác WriterSolo).
- [ ] 🔍 Xác minh API lưu thumbnail Panel hiện có trước khi làm; thiếu thì thêm sub-task [BE] vào task này.
- **Phụ thuộc:** SCR-28.

#### SCR-35 · Ghi chú Writer không in — FE · ⏸️
- [ ] [FE] Ghi chú bên lề theo dòng (không vào bản xuất, không vào Lettering), khác ChangeRequest. Hoãn tới khi SCR-25..32 xong; cân nhắc dùng chung comment của REV.

#### SCR-36 · Dọn prototype `flow/writesolo/` — FE · ❌
- [ ] [FE] `flow/writesolo/{ScriptEditorWorkspace.tsx, writeSoloExtensions.ts, SeriesBibleContextSidebar.tsx, sampleScript.ts, index.ts}` không được import ở đâu (grep 2026-11-13). Lấy ý tưởng còn dùng được cho SCR-26/29 rồi xoá cùng đợt SCR-03.

---

## 5. Thứ tự, rủi ro, BR

```
Phase A (độc lập) ─► B ─► C ─► D ─► E ─► F ─► G   (tất cả D1–D6 đã chốt, sẵn sàng làm)
                          ▲
           REL-01 (ChapterStatus.PreProduction) làm cùng SCR-08
```
C và D song song được sau B nếu không cùng sửa `ScriptLineRules.cs` (SCR-11 làm trước). FE (F) bắt đầu sau E; SCR-18/19 có thể làm trên mock DTO.

Phase H: `SCR-25` (làm ngay, mock) ─► `SCR-26` (cần SCR-19) ─► `SCR-27`, `SCR-28`, `SCR-29`, `SCR-31` ─► `SCR-30`, `SCR-32`, `SCR-34`; `SCR-33` sau SCR-13/17; `SCR-36` cùng đợt SCR-03. D7–D10 đã chốt (2026-11-13).

| Rủi ro | Giảm thiểu |
|---|---|
| Dữ liệu kịch bản cũ hiển thị sai (D6 không chuyển đổi) | Chấp nhận; nạp seed mới sau, không viết code tương thích định dạng cũ |
| Vỡ AI workflow (theo Scene) | Scene ẩn (D2) |
| FE/BE lệch lúc chuyển | Endpoint cũ chạy song song tới SCR-23 |
| Mất dữ liệu khi gỡ cột | Chỉ gỡ ở SCR-23; migration có `Down` |

**BR:** BR-01/08 · BR-05 · BR-06 · BR-07/23 · BR-11 · BR-18 · BR-21/30.

## 6. Changelog

| Ngày | Task | Trạng thái | Nhánh / Commit | Ghi chú |
|---|---|---|---|---|
| 2026-11-12 | — | Lập kế hoạch | — | Từ `SCRIPT_FLOW_REFACTOR_PLAN.md` |
| 2026-11-12 | D2 | ✅ Chốt | — (tài liệu) | Scene mặc định ẩn; thay P4-01 của plan tổng |
| 2026-11-12 | D1, D3–D6 | ✅ Chốt | — (tài liệu) | Bỏ stage Script · Gate 1 không bắt buộc qua duyệt · không sửa khi InReview · bỏ `ChapterScript` · không chuyển dữ liệu cũ → huỷ SCR-06 |
| 2026-11-12 | — | Chuyển sang bộ plan module | — | Đánh lại ID `S*` → `SCR-*` |
| 2026-11-13 | SCR-25..SCR-36 | Lập kế hoạch | — (tài liệu) | Phase H: trải nghiệm gõ Graphic Novel, đối chiếu walkthrough WriterSolo; chờ chốt D7–D10 |
| 2026-11-13 | D7–D10 | ✅ Chốt | — (tài liệu) | Theo khuyến nghị: `(nghĩ)` → Thought · bỏ cú pháp gõ tắt trong editor · ngưỡng 7 panel/trang, 3 bóng/panel, 25 chữ/bóng (Warning) · kéo thả chỉ khi Draft/ChangesRequested/Amending. Phase H sẵn sàng |
