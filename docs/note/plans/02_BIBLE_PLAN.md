# 02 · SERIES BIBLE (`BIB`)

> **Spec:** Module 1 mục 2–4 (Danh sách thực thể chương, Bible 2 tầng, biến thể tạo hình, chốt Bible ở Gate 1), §5.2 máy trạng thái 1, BR-01 (không unlock, supersede theo biến thể), BR-15 (bản theo binding của chương), BR-21/30, **BR-35** (Danh sách & Bản đồ thực thể chương). Quyết định **Q16** (2026-11-14) thay `@Tag` và mốc chương hiệu lực.
> **Thay cho:** `note/SERIES_BIBLE_REDESIGN_PLAN.md`; `archive/implement-plan/completed/SERIES_BIBLE_REWORK_AND_ERA_VERSIONING_PLAN.md` (đã xong).
> **Repo:** `PanelForge_FA26SE251` (logic đã xong), `panelforge-fe` (chính).
> **Test case tham khảo:** [`note/TEST_CASES_SERIES_BIBLE.md`](../TEST_CASES_SERIES_BIBLE.md).

---

## 1. Đã xong

| Hạng mục | Bằng chứng |
|---|---|
| Vòng đời `Draft → ConceptSubmitted → (ReworkRequired ↺) → WriterEndorsed → CanonLocked`, `/supersede`, không có `/unlock` | `BibleEntryRevision.SubmitConcept/Endorse/Lock/RequestRework/MarkSuperseded` |
| ~~`@Stub`, era `EffectiveFromChapterNumber`, `EffectiveRevisionAt(N, canonOnly)`~~ — **bị Q16 thay**, gỡ ở BIB-17 | `BibleEntry.CreateStub/EffectiveRevisionAt`, `GetBibleEntriesAtChapterQuery` |
| **Guard chuyển trạng thái** (cũ B1, sửa lỗi L2) | commit `1cb44ed` |
| **Hàng đợi concept theo từng giai đoạn**, nộp concept kèm `RevisionId` (cũ B3, sửa L3) | commit `1cb44ed` |
| **Không xoá cứng revision đã có event** (cũ B5, sửa L5) | commit `1cb44ed` |
| Bản sửa nội dung giữ tên giai đoạn (một phần cũ B6) | commit `1cb44ed` |
| **Địa điểm & Đạo cụ đi đủ vòng đời như Nhân vật** (`BibleEntry.IsVisualDesign`); Thuật ngữ/Quy tắc/Sự kiện có hiệu lực không cần khoá (cũ B4) | commit `79b5077` |
| **Chỉ Editor `/endorse`, Producer khoá**; `/request-rework` cho Editor + Producer; người đã duyệt không tự khoá cùng phiên bản (409) (cũ L7) | commit `79b5077`, merge `df10ee3` |
| Ảnh concept + lịch sử yêu cầu vẽ lại trên màn Editor | FE commit `2e96424` |

> Lưu ý spec §5.1 ghi Writer **và** Editor được xác nhận WriterEndorsed; code hiện chỉ cho Editor (quyết định L7 ngày 2026-11-12). Khi cập nhật spec, ghi rõ quyết định này.

## 2. Hiện trạng frontend (đo 2026-11-12)

| File | Dòng | Vấn đề |
|---|---|---|
| `shared/features/series-bible/SeriesBibleView.tsx` | 3.881 | 69 `useState`; `AddRevisionModal` (~1.050 dòng) gánh 5 chế độ bằng ternary lồng; 88 class slate/gray/zinc; 67 chỗ `text-[9–11px]`; 0 i18n |
| `BibleEntityDetailModal.tsx` | 2.071 | Full-screen, 4 gradient, History modal chồng lên |
| `AddEntityModal.tsx` | 846 | 42 class slate/gray |

Vấn đề chung: badge trạng thái viết lại ≥4 lần, trộn emoji với icon Lucide; Canon dùng `purple-*` (tím chỉ dành cho AI); gradient, `backdrop-blur` trên badge, `shadow-2xl`, hex rời (`#FCFBF8`, `#D8D2C5`, `#FAF8F5`), class không tồn tại `py-0.2`; mỗi modal tự dựng overlay với z-index khác nhau; nhãn danh mục khai báo 3 nơi và lệch key (`terminology/style` vs `item/lore`); `mapCategoryToTab` rơi về `'characters'` cho category lạ; **8 chỗ `(item as any).status`** đọc sai trường (DTO đã trả `reviewStatus`).

FE còn **chưa theo kịp backend**: chưa gửi `revisionId` khi nộp concept từ hàng đợi; hàng đợi có thể có nhiều dòng cùng `entryId` (mỗi giai đoạn một dòng) → phải key theo `revisionId`; chưa ẩn nút Duyệt với Writer/Producer; chưa hiện nút Khoá cho Địa điểm/Đạo cụ.

## 3. Mô hình hành động (giữ làm tham chiếu UI)

| Hành động | Khi nào | Dữ liệu |
|---|---|---|
| **Yêu cầu vẽ lại** | Hình sai, nội dung đúng | Cùng revision, event `ReworkRequested`; nộp lại → event `ConceptSubmitted` mới |
| **Sửa nội dung** | Mô tả/đặc tả sai, cùng biến thể | Revision mới, cùng `variant_label`, về `Draft`; bản đã khoá thì qua `/supersede` |
| **Biến thể mới** (Q16, thay "Giai đoạn mới") | Nhân vật đổi tạo hình (lớn lên, đổi giáp, hồi tưởng) | Revision mới với `variant_label` khác, không gắn số chương; chương nào dùng biến thể nào do Danh sách thực thể chương quyết định |

Ma trận chuyển trạng thái (đã ở Domain): `SubmitConcept: Draft | ReworkRequired | ConceptSubmitted | WriterEndorsed` · `RequestRework: ConceptSubmitted | WriterEndorsed` · `Endorse: ConceptSubmitted` · `Lock: WriterEndorsed`.

## 4. Task

### Backend còn lại

#### BIB-01 · Bản nháp không ghi đè thông tin Canon đang hiệu lực — BE · ❌ · cũ B2/L1
- **Bối cảnh:** commit `2b43cc3` cố ý cho phép tạo revision mới trên giai đoạn đã khoá (bản mới đi lại luồng duyệt). Nhưng `GetCurrentRevision` lấy VersionNumber lớn nhất → `entry.Name/Description/ReferenceImageUrl` bị bản nháp ghi đè trong khi Canon vẫn là bản cũ.
- [ ] **Cần user chốt:** hiển thị/AI dùng bản CanonLocked mới nhất của giai đoạn (đề xuất) hay bản mới nhất bất kể trạng thái.
- [ ] Nếu chốt theo đề xuất: thông tin hiện hành của mục lấy từ bản `CanonLocked` mới nhất của **biến thể mặc định** (Q16 bỏ `EffectiveRevisionAt`), fallback bản mới nhất khi chưa có Canon; test.

#### BIB-02 · Validate biến thể mới — BE · 🟡 · cũ B6/L6 · **đổi theo Q16**
- [ ] `variant_label` (cột `StageName` hiện có) bắt buộc khi tạo biến thể mới, không trùng nhãn biến thể khác còn hiệu lực của cùng mục → 409. Bỏ kiểm "`from` không trùng chương bắt đầu".
- [ ] Đổi `variant_label` trong bản sửa nội dung không được tách biến thể (xác minh chặn đổi).
- [ ] Test.

### Frontend (làm theo thứ tự)

#### BIB-03 · Theo kịp hợp đồng backend — FE · ❌ · cũ bước 2
- [ ] `services/bible.service.ts` + types theo DTO hiện tại; bỏ 8 chỗ `(item as any).status` và so sánh số (backend dùng `JsonStringEnumConverter`).
- [ ] Nộp concept từ hàng đợi gửi `revisionId`; key danh sách hàng đợi theo `revisionId`.
- [ ] Quyền nút: Duyệt chỉ Editor; Khoá chỉ Producer, cho cả Nhân vật/Địa điểm/Đạo cụ; Trả về vẽ lại cho Editor + Producer.
- [ ] `typecheck`.

#### BIB-04 · Tách cấu trúc `series-bible/` — FE · ❌ · cũ bước 3
```
series-bible/
  SeriesBibleView.tsx            ← layout + ghép nối (~300 dòng)
  bibleStatus.ts                 ← status → { labelKey, tone, icon } (1 nguồn)
  bibleCategories.ts             ← gộp CATEGORIES + getCategoryLabel + mapCategoryToTab (bỏ fallback 'characters')
  hooks/useBibleEntries.ts · useBibleReview.ts · useBiblePermissions.ts
  components/BibleToolbar · BibleStatusBadge · BibleEntryCard (grid) · BibleEntryRow (list) · StageRuler · ReviewInbox
  modals/BibleDialog · EditContentModal · NewStageModal · SubmitConceptModal · SupersedeModal · ReworkModal · ImageLightbox
  BibleEntityDetailModal.tsx     ← tabs Hồ sơ / Giai đoạn / Lịch sử duyệt
  AddEntityModal.tsx
```
- [ ] Tách thuần trước, không đổi giao diện; giữ nguyên `data-testid`.
- [ ] Chuẩn hoá key danh mục `characters | locations | terminology | style` ở code và locale.

#### BIB-05 · Giao diện "hồ sơ thiết kế nhân vật" — FE · ❌ · cũ bước 4
- [ ] **Thẻ:** tỉ lệ ảnh theo danh mục (Nhân vật 3:4, Địa điểm 16:9, Đạo cụ 1:1, Lore không ảnh → đoạn trích serif); mã mục `font-mono text-xs` viền mảnh; tên `font-serif`; **một** badge trạng thái từ `BibleStatusBadge`.
- [ ] **Dấu Canon:** con dấu viền `emerald-700`, chữ `CANON · v3` + icon `Lock` (bỏ badge tím + emoji).
- [ ] **Bảng màu trạng thái** (DESIGN_RULES, bỏ tím/indigo):

  | Trạng thái | Nhãn VI | Tông | Icon |
  |---|---|---|---|
  | Draft | Bản thảo | stone | `FileText` |
  | ConceptSubmitted | Chờ duyệt concept | amber | `Clock` |
  | ReworkRequired | Cần vẽ lại | rose | `RotateCcw` |
  | WriterEndorsed | Chờ khoá Canon | blue | `CheckCheck` |
  | CanonLocked | Canon | emerald | `Lock` |

- [ ] **StageRuler:** thanh ngang theo số chương, mỗi giai đoạn một đoạn có tên ("Lúc nhỏ · ch.1–19"), đã khoá tô đặc, chưa khoá viền nét đứt, vạch chỉ chương đang lọc; bản mini trên thẻ, bản đầy đủ trong Detail.
- [ ] **ReviewInbox** thay design queue, theo vai trò: Artist "Cần vẽ" (Draft/ReworkRequired + feedback) · Editor "Chờ bạn duyệt" (ConceptSubmitted) · Producer "Chờ khoá Canon" (WriterEndorsed). Dải ngang `bg-white border-stone-200/80`, số lượng thật từ API.
- [ ] Gỡ: 5 gradient, emoji, `backdrop-blur` trên badge, `shadow-2xl`, `zinc/slate/gray` → `stone`, chữ < 12px, hex rời → token `studio-tokens.css`, `py-0.2`.
- [ ] Rỗng/đang tải: skeleton đúng tỉ lệ thẻ; rỗng theo danh mục có một hành động ("Thêm nhân vật đầu tiên").

#### BIB-06 · Modal một khung — FE · ❌ · cũ bước 5
- [ ] `BibleDialog` (hoặc `shared/components/ui/Dialog.tsx` nếu dùng toàn app): overlay `bg-stone-950/50`, một z-index (`z-[1050]`, lightbox `z-[1100]`), bề mặt `bg-white border-stone-200 rounded-2xl shadow-xl`; Header / Body cuộn / Footer; size `sm | md | lg | sheet`; Esc, focus trap, khoá cuộn nền, trả focus (gom logic ở `BibleEntityDetailModal.tsx:750`); một nút chính `.btn-cta-primary`, nút phá huỷ `rose`.
- [ ] **Detail** → sheet bên phải, 3 tab (Hồ sơ / Giai đoạn / Lịch sử duyệt); bỏ History modal riêng. *(Cần user chốt: sheet hay giữ full-screen — đề xuất sheet.)*
- [ ] `AddRevisionModal` → 4 modal: `EditContent`, `NewStage` (xem trước StageRuler, báo trùng khi nhập), `SubmitConcept`, `Supersede`.
- [ ] `Rework`: 2 cột (ảnh concept bị trả | ô nhận xét bắt buộc).
- [ ] Xác nhận nộp: `LucianConfirmModal`, copy cụ thể ("Nộp concept v3 cho giai đoạn Trưởng thành?").
- [ ] `AddEntityModal` → `BibleDialog size="lg"`.

#### BIB-07 · i18n & văn phong — FE · ❌ · cũ bước 6
- [ ] Chuyển toàn bộ chuỗi vào `locales/{vi,en}/bible.json` (~250–300 key, nhóm `status.*`, `category.*`, `stage.*`, `review.*`, `modal.*`).
- [ ] Văn phong: "Gửi concept", "Trả về vẽ lại", "Duyệt thiết kế", "Khoá Canon", "Thay bản khoá" (không dùng "Mở khoá").
- [ ] `npm run i18n:check`.

#### BIB-08 · Cập nhật test & review — FE/BE · ❌ · cũ bước 7–8
- [ ] Cập nhật `SeriesBibleView.test.tsx`, `BibleEntityDetailModal.test.tsx`, `AddEntityModal.test.tsx` (chạy khi user yêu cầu).
- [ ] `architect-reviewer` rà diff trước khi merge `trungkien`.

### Nối Bible với luồng sản xuất (rà soát 2026-11-13)

> **Bối cảnh (rà soát 2026-11-13):** D11 bỏ `@mention` và người nói từ Bible → `CheckChapterBibleGateQuery` luôn trả `IsPassed = true`, `FreezeChapterScriptCommand` không gọi gate; BR-21 không được thực thi, `GetPanelBible` không còn dữ liệu. **Q16 (user chốt 2026-11-14)** thay bằng Danh sách thực thể chương + Bản đồ thực thể chương (spec Module 1 mục 2–4, BR-35). Thứ tự: BIB-09 → BIB-11 → BIB-12 → BIB-13 → BIB-14 → (BIB-15 ∥ BIB-16) → BIB-17.

#### BIB-09 · Bí danh & biến thể tạo hình — DB + BE · ❌ · Q16
- [ ] [DB] `bible_entries.aliases TEXT[] NOT NULL DEFAULT '{}'`.
- [ ] [BE] `BibleEntry.SetAliases(...)`: cắt khoảng trắng, NFC, bỏ trùng, tối đa 20 bí danh × 100 ký tự. Create/Update entry nhận `aliases`.
- [ ] [BE] Chặn trùng: tên chính hoặc bí danh (so khớp sau chuẩn hoá, không phân biệt hoa thường) trùng với tên/bí danh của mục khác trong cùng Series → 409 kèm tên mục bị trùng.
- [ ] [BE] Dùng `StageName` hiện có làm `variant_label` (DTO đổi tên trường thành `variantLabel`, giữ tên cột để khỏi migration lớn); biến thể mặc định = bản đầu tiên của mục (`IsDefaultVariant` tính toán). `EffectiveFrom/ToChapterNumber` không còn dùng để chọn bản (gỡ cột ở BIB-17).
- [ ] [BE] `/supersede` chỉ thay bản **cùng biến thể**: bản cũ `Superseded` (event `MarkSuperseded`) và không chọn được cho chương mới; tạo biến thể mới = `AddBibleEntryRevision` với nhãn khác, không supersede.
- [ ] Test: trùng bí danh 409, supersede giữ biến thể, nhiều biến thể cùng `CanonLocked`.

#### BIB-11 · Bản đồ thực thể chương, tham chiếu bôi đen & cờ Quần chúng — DB + BE · ❌ · Q16
- [ ] [DB] `chapter_bible_bindings(chapter_id FK chapters ON DELETE CASCADE, bible_entry_id FK bible_entries ON DELETE RESTRICT, bound_revision_id FK bible_entry_revisions NULL, source, bound_by, bound_at, PK(chapter_id, bible_entry_id))`.
  - `source`: `Speaker` (người nói tự khớp hoặc tự tạo) | `Highlight` (Writer bôi đen). Một mục có cả hai nguồn thì giữ `Speaker`.
  - **Khác bản DDL gốc:** `bound_revision_id` **cho phép NULL** trước Gate 1, vì mục tự tạo/bôi đen còn `Draft`, chưa có bản `CanonLocked` để gắn. Gate 1 bắt buộc NOT NULL và `CanonLocked` cho mọi mục không Quần chúng.
  - Binding được **tính lại từ kịch bản** mỗi lần lưu (người nói + tham chiếu bôi đen): thêm dòng cho mục mới xuất hiện, xoá dòng cho mục không còn được nhắc; giữ `bound_revision_id` đã chọn của dòng còn lại.
- [ ] [DB] Tham chiếu bôi đen: **mở rộng `script_line_bible_links` hiện có** thay vì bảng mới — thêm `start_offset`, `length`, `surface_text` (chữ gốc lúc bôi). Một dòng có thể có nhiều tham chiếu.
- [ ] [DB] `bible_entries.is_crowd BOOLEAN NOT NULL DEFAULT false` (cờ Quần chúng theo mục, dùng cho cả Series).
- [ ] [BE] Dùng lại `BibleEntry.CreateStub/IsStub` cho mục tự tạo: `IsStub = true` nghĩa là "chờ Writer viết định nghĩa"; Writer lưu mô tả → `PromoteFromStub` → mục vào hàng đợi Artist.
- [ ] [BE] Entity + configuration + migration; `DeleteBibleEntry` trả 409 khi mục đang được chương nào gắn.
- [ ] [BE] Bản đồ chỉ sửa được khi `chapter.ScriptStatus != Frozen` và chương `IsContentEditable` (409 ngược lại).

#### BIB-12 · Nhận diện người nói & lập Danh sách thực thể chương khi lưu — BE · ❌ · Q16
- [ ] [BE] `SpeakerResolver` hàm thuần: chuẩn hoá `SpeakerLabel` (bỏ hậu tố `(nghĩ)`, cắt khoảng trắng, NFC, không phân biệt hoa thường) và so **khớp nguyên chuỗi** với tên chính + bí danh mục **Nhân vật** của Series. Không quét chữ trong mô tả/lời dẫn/SFX.
- [ ] [BE] Gắn vào luồng lưu kịch bản (`BatchSaveScriptLines` / commit `ScriptVersion`), cùng transaction: người nói không khớp → tạo mục Nhân vật `Draft` (`CreateStub`, tên = nhãn người nói như Writer gõ); trùng nhãn chuẩn hoá trong cùng lần lưu chỉ tạo một mục. Ghi Audit "tự tạo từ người nói, chương N".
- [ ] [BE] Dọn rác: mục `IsStub` do hệ thống tạo, không còn chương nào gắn và chưa có sự kiện duyệt → xoá khi lưu (Writer gõ sai tên người nói rồi sửa không để lại mục thừa).
- [ ] [BE] Tham chiếu bôi đen khi chữ của dòng đổi: tìm lại `surface_text` trong chữ mới (gần vị trí cũ nhất); không còn → gỡ tham chiếu và trả cảnh báo trong kết quả lưu để FE báo Writer.
- [ ] [BE] Tham chiếu bôi đen đưa vào nội dung băm của `ScriptVersion` (bôi/gỡ tham chiếu = có thay đổi; Gửi duyệt lại / Bắt đầu sản xuất kiểm đúng bản).
- [ ] [BE] `GET /api/chapters/{id}/cast`: mỗi thực thể kèm nguồn (Người nói/Bôi đen), trạng thái Bible (chờ định nghĩa / chờ Artist / chờ duyệt / `CanonLocked`), `isCrowd`, `boundRevision`, **gợi ý mặc định** (bản đã gắn ở chương gần nhất trước chương này theo `ChapterNumber` có thực thể đó; chưa có thì bản `CanonLocked` mới nhất của biến thể mặc định), các biến thể `CanonLocked` chọn được, danh sách dòng/Panel nhắc tới; và `gate { canStart, blockers[] }`.
- [ ] Test: khớp bí danh, `Minh (nghĩ)`, tên có dấu viết hoa khác nhau, tự tạo một lần cho nhiều dòng cùng tên, dọn mục thừa, tham chiếu bôi đen bị mất khi sửa chữ.

#### BIB-13 · Lệnh chỉnh Danh sách thực thể chương — BE · ❌ · Q16
- [ ] [BE] Quyền: Writer và Producer (BR-35); vai trò khác 403. Kịch bản `Frozen` → 409.
- [ ] Lệnh: `AddHighlightReference(lineId, start, length, entryId)` (mục Nhân vật/Địa điểm/Đạo cụ cùng Series), `CreateEntryFromHighlight(lineId, start, length, name, category)` (tạo mục `Draft` + tham chiếu), `RemoveHighlightReference`, `SetCrowd(entryId, bool)`, `SetCastRevision(entryId, revisionId)` (chỉ bản `CanonLocked`, chưa `Superseded`, đúng mục).
- [ ] Khi mục trong chương có bản `CanonLocked` → tự điền `bound_revision_id` theo gợi ý mặc định, người dùng đổi được.
- [ ] Hàng đợi thiết kế Bible (`GetBibleDesignQueueQuery`): chỉ hiện mục đã có định nghĩa (không còn `IsStub`), không `is_crowd`; kèm các chương đang chờ mục đó để Artist ưu tiên.
- [ ] Test mỗi lệnh: thành công, 403, 409 (Frozen, bản chưa khoá, sai Series).

#### BIB-14 · Chốt Bible tại Gate 1 — BE · ❌ · Q16 · thay `CheckChapterBibleGateQuery`
- [ ] [BE] `ChapterCastGate.EvaluateAsync` (một nguồn luật cho `GET /cast` và Gate 1): chặn khi còn mục trong bản đồ chương, không `is_crowd`, mà `bound_revision_id` NULL hoặc bản không `CanonLocked` (gồm mục nháp tự tạo chưa định nghĩa). Tính lại bản đồ từ kịch bản ngay lúc chốt (không tin dữ liệu cũ).
- [ ] [BE] `FreezeChapterScriptCommand` gọi gate trước khi `StartProduction`; vi phạm → 409 kèm danh sách (tên, lý do: chờ định nghĩa / chờ Artist / chờ duyệt / chờ khoá).
- [ ] [BE] Chốt lại sau khi Producer mở lại: binding đổi `bound_revision_id` (hoặc thêm/bớt thực thể) → gắn ⚑ các Panel có dòng nhắc tới thực thể đó, dùng chung cơ chế với [SCR-01](01_SCRIPT_PLAN.md).
- [ ] [BE] `ChapterSnapshotBuilder` (Gate 3) ghi bản đồ thực thể vào manifest (mục, bản, mã băm Model Sheet).
- [ ] Xoá `CheckChapterBibleGateQuery` + endpoint `bible-gate` (FE `ScriptReviewView`/`ChecksTab` chuyển sang `GET /cast`).
- [ ] Test: còn mục nháp tự tạo → 409; gắn cờ Quần chúng → qua; đủ điều kiện → Frozen + binding khoá; sửa binding khi Frozen → 409.

#### BIB-15 · Bàn vẽ, AI và kiểm tra nhất quán đọc theo binding — BE · ❌ · Q16
- [ ] [BE] `GetPanelBible`: lấy từ `chapter_bible_bindings` của chương, lọc theo thực thể có dòng nhắc tới trong Panel đó (người nói hoặc bôi đen), trả Model Sheet của `bound_revision_id`; mục Quần chúng không hiện.
- [ ] [BE] `ConsistencyChecker`, context AI (`AiWorkflowFacts`, Writer/Artist Agent), `GetBibleEntriesAtChapterQuery`: thay `EffectiveRevisionAt(N)` bằng binding của chương; chương chưa qua Gate 1 dùng gợi ý mặc định.
- [ ] Test: chương 5 giữ bản cũ sau khi chương 6 supersede.

#### BIB-16 · Giao diện Danh sách thực thể chương & bôi đen — FE · ❌ · Q16
- [ ] [FE] Editor kịch bản: bôi đen chữ trong mô tả/lời dẫn/SFX → menu nổi "Tham chiếu Series Bible" (ô tìm theo tên/bí danh) + "Tạo mục mới" (tên điền sẵn từ đoạn bôi, chọn loại). Đoạn đã tham chiếu gạch chân, hover hiện tên mục, có nút gỡ. Lưu tham chiếu qua adapter (`scriptFlowAdapter`) dưới dạng mark → `{start, length, entryId}`.
- [ ] [FE] Ô người nói: gợi ý tên/bí danh Bible khi gõ (không bắt buộc chọn); tên mới hiện chip "Sẽ tạo bản nháp".
- [ ] [FE] Ngăn phải `ScriptEditorView`: danh sách thực thể (nguồn, trạng thái Bible, chọn biến thể, nút **Quần chúng**, nút "Viết định nghĩa" mở form mục với mục còn nháp); bấm thực thể → nhảy tới dòng/Panel. Báo khi lưu làm mất tham chiếu bôi đen.
- [ ] [FE] Nút Bắt đầu sản xuất (và tab Gate 1 của [ASG-01](03_ASSIGNMENT_PLAN.md)) hiện danh sách vướng từ `gate.blockers`, khoá nút khi `canStart = false`.
- [ ] [FE] Form mục Bible: ô bí danh (chip), nhãn biến thể thay cho "chương bắt đầu/kết thúc", cờ Quần chúng; hàng đợi thiết kế hiện "Chương đang chờ".
- [ ] [FE] Bỏ UI era (chương hiệu lực), `@mention`. i18n vi/en; test.

#### BIB-17 · Gỡ cơ chế cũ — BE + FE + DB · ❌ · Q16 · sau BIB-14/15/16
- [ ] [BE] Gỡ `ScriptLine.SpeakerCharacterId` + `ValidateSpeakerAsync`, `LinkBibleEntriesCommand` cũ (thay bằng lệnh BIB-13), `EffectiveRevisionAt`, `DeleteBibleEntryEraCommand` + endpoint `eras`, cột `EffectiveFrom/ToChapterNumber` (migration có `Down`). **Giữ** `script_line_bible_links` (mở rộng ở BIB-11) và `CreateStub/IsStub/PromoteFromStub` (dùng cho mục tự tạo).
- [ ] [FE] Gỡ `@tiptap/extension-mention` và code gọi các endpoint trên.
- [ ] Cập nhật `TEST_CASES_SERIES_BIBLE.md` theo Q16 (bỏ ca era; thêm ca người nói tự khớp/tự tạo, bôi đen, Quần chúng, Gate 1).
- [ ] Mục "ép `ChapterNumber` decimal về int" ở rà soát 2026-11-13 tự hết khi gỡ `EffectiveRevisionAt`.

## 5. Quyết định

| # | Câu hỏi | Trạng thái |
|---|---|---|
| 1 | Vòng đời theo danh mục | ✅ Nhân vật/Địa điểm/Đạo cụ đủ vòng đời; Thuật ngữ/Quy tắc/Sự kiện không cần khoá |
| 2 | Xoá revision | ✅ Chỉ xoá Draft chưa có event ngoài `Created` |
| 3 | Producer tự Endorse + Lock | ✅ Không: Editor duyệt, Producer khoá, không tự khoá bản mình duyệt |
| 4 | Detail modal: sheet hay full-screen | ⏳ Đề xuất sheet bên phải (BIB-06) |
| 5 | Thông tin hiện hành khi có bản nháp trên giai đoạn đã khoá | ⏳ Đề xuất lấy bản Canon (BIB-01) |
| 6 | Bible Gate khi kịch bản không còn `@Tag` (D11) | ✅ Q16 (2026-11-14, chỉnh cùng ngày): người nói tự khớp Bible, chưa có thì tự tạo bản nháp (Writer gắn cờ Quần chúng); lời dẫn không tự khớp, Writer bôi đen để tham chiếu; biến thể tạo hình thay mốc chương; `chapter_bible_bindings` khoá ở Gate 1 → BIB-09, BIB-11..BIB-17 |

## 6. Changelog

| Ngày | Task | Trạng thái | Nhánh / Commit | Ghi chú |
|---|---|---|---|---|
| 2026-11-12 | cũ B1, B3, B5, B6 (một phần) | ✅ | BE `1cb44ed`, merge `a092b0f` | Guard trạng thái, hàng đợi theo giai đoạn |
| 2026-11-12 | cũ B4, L7 | ✅ | BE `79b5077`, merge `df10ee3` | Địa điểm/Đạo cụ khoá được; chỉ Editor duyệt |
| 2026-11-14 | Q16, BIB-09, BIB-11..BIB-17 | Lập kế hoạch | — (chỉ tài liệu) | Bible chốt theo chương: bí danh, biến thể tạo hình, Danh sách & Bản đồ thực thể chương, chốt ở Gate 1; BIB-01/02 đổi theo biến thể |
| 2026-11-14 | Q16 (chỉnh), BIB-11..BIB-17 | Lập lại kế hoạch | — (chỉ tài liệu) | Bỏ quét chữ trong lời dẫn và nhóm phân loại tên mới: người nói tự khớp/tự tạo nháp, cờ Quần chúng trên mục Bible, tham chiếu bằng bôi đen (mở rộng `script_line_bible_links`), dùng lại `CreateStub/IsStub` |
| 2026-11-12 | — | Chuyển sang bộ plan module | — | Từ `SERIES_BIBLE_REDESIGN_PLAN.md` |
