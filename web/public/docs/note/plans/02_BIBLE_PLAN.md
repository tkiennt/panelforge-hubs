# 02 · SERIES BIBLE (`BIB`)

> **Spec:** Module 1 mục 2–4 (Danh sách thực thể chương, duyệt Series Bible, biến thể tạo hình, chốt Bible ở Gate 1), §5.1, §5.2 máy trạng thái 1, BR-01 (không unlock, supersede theo biến thể), BR-06, BR-15 (bản theo binding của chương), BR-21/30, **BR-35** (Danh sách & Bản đồ thực thể chương). Quyết định **Q16–Q22** (2026-11-14).
> **Thay cho:** `note/SERIES_BIBLE_REDESIGN_PLAN.md`; `archive/implement-plan/completed/SERIES_BIBLE_REWORK_AND_ERA_VERSIONING_PLAN.md` (đã xong).
> **Repo:** `PanelForge_FA26SE251` (BE + DB), `panelforge-fe` (chính).

---

## 0. Tóm tắt quyết định đang áp dụng

| Mã | Nội dung | Task |
|---|---|---|
| Q16 | Người nói tự khớp tên/bí danh, chưa có thì tự tạo mục nháp; lời dẫn/mô tả bôi đen để tham chiếu; biến thể tạo hình thay mốc chương; `chapter_bible_bindings` khoá ở Gate 1 | BIB-09, BIB-11..BIB-17 |
| Q18 | Chỉ Writer đổi biến thể tạo hình cho chương | BIB-13, BIB-16 |
| **Q19** | Writer quản lý Danh sách thực thể chương: bôi đen, cờ Quần chúng, viết định nghĩa, đổi biến thể. Producer chỉ đọc | BIB-12, BIB-13, BIB-16 |
| **Q21** | **Chốt Bible hai mốc:** *Gửi duyệt* chặn khi còn mục nháp chưa định nghĩa (không Quần chúng); biến thể chọn theo nhãn, **kể cả biến thể chưa khoá**; *Bắt đầu sản xuất* chặn khi biến thể chương dùng chưa có bản `CanonLocked` | BIB-11, BIB-13, BIB-14, BIB-16 |
| **Q22** | Producer được **yêu cầu vẽ lại** concept; **giai đoạn mặc định** do hệ thống đề xuất, Writer chỉ đổi khi cần, không có bước xác nhận | BIB-10, BIB-11, BIB-13, BIB-14, BIB-16 |
| **Q20** | **Editor xác nhận = khoá Canon** (bỏ `WriterEndorsed`); Writer + Editor góp ý và yêu cầu vẽ lại; Artist trả lời; mỗi lần nộp concept là một **phiên bản**; Producer chỉ đọc Bible, chỉ chốt / mở lại kịch bản | BIB-10 |
| 1A | Chỉ bôi đen trên dòng Action, Caption (Lời dẫn), SFX; không trên tiêu đề Panel (`Panel.Direction`) và lời thoại | BIB-12, BIB-16 |
| 2A | Tham chiếu đi trong payload `BatchSaveScriptLines` (`refs[]`), không có lệnh bôi/gỡ rời | BIB-12, BIB-16 |
| 3A | Tính lại Danh sách thực thể chương trong transaction của `CommitScriptVersion` (3B — gộp 4 request lưu thành một endpoint — để sau, xem 01_SCRIPT_PLAN) | BIB-12 |
| 4A | `CreateStub` mô tả rỗng; `DefineBibleEntryCommand` ghi đè revision v1; chặn nộp concept khi mục còn nháp | BIB-13, BIB-10 |
| 5A | Giữ unique `(script_line_id, bible_entry_id)`; mọi chỗ cùng `surface_text` trong dòng đều gạch chân | BIB-11, BIB-16 |
| 6A | `ScriptVersionRow.Refs`; băm chỉ nối `|refs:` khi dòng có tham chiếu (tương thích ngược) | BIB-12 |
| 7A | `is_crowd` bật/tắt bất kỳ lúc nào; `chapter_bible_bindings.is_crowd_at_bind` đóng băng theo chương lúc Gate 1 | BIB-11, BIB-13, BIB-14 |
| 8A | Supersede: chương chưa chốt giữ bản cũ tới khi bản thay thế được khoá, rồi tự chuyển | BIB-09, BIB-13 |
| 9A | Bảng `bible_entry_names` chống trùng tên/bí danh và chống race khi tự tạo mục | BIB-09, BIB-12 |

## 1. Đã xong

| Hạng mục | Bằng chứng |
|---|---|
| Vòng đời `Draft → ConceptSubmitted → (ReworkRequired ↺) → WriterEndorsed → CanonLocked`, `/supersede`, không có `/unlock` — **Q20 bỏ `WriterEndorsed`**, sửa ở BIB-10 | `BibleEntryRevision.SubmitConcept/Endorse/Lock/RequestRework/MarkSuperseded` |
| ~~`@Stub`, era `EffectiveFromChapterNumber`, `EffectiveRevisionAt(N, canonOnly)`~~ — **bị Q16 thay**, gỡ ở BIB-17 | `BibleEntry.CreateStub/EffectiveRevisionAt`, `GetBibleEntriesAtChapterQuery` |
| **Guard chuyển trạng thái** (cũ B1, sửa lỗi L2) | commit `1cb44ed` |
| **Hàng đợi concept theo từng giai đoạn**, nộp concept kèm `RevisionId` (cũ B3, sửa L3) | commit `1cb44ed` |
| **Không xoá cứng revision đã có event** (cũ B5, sửa L5) | commit `1cb44ed` |
| Bản sửa nội dung giữ tên giai đoạn (một phần cũ B6) | commit `1cb44ed` |
| **Địa điểm & Đạo cụ đi đủ vòng đời như Nhân vật** (`BibleEntry.IsVisualDesign`); Thuật ngữ/Quy tắc/Sự kiện có hiệu lực không cần khoá (cũ B4) | commit `79b5077` |
| ~~Chỉ Editor `/endorse`, Producer khoá~~ — **Q20 thay**: Editor xác nhận là khoá, Producer không khoá (BIB-10) | commit `79b5077`, merge `df10ee3` |
| Ảnh concept + lịch sử yêu cầu vẽ lại trên màn Editor | FE commit `2e96424` |

## 2. Hiện trạng frontend (đo 2026-11-12)

| File | Dòng | Vấn đề |
|---|---|---|
| `shared/features/series-bible/SeriesBibleView.tsx` | 3.881 | 69 `useState`; `AddRevisionModal` (~1.050 dòng) gánh 5 chế độ bằng ternary lồng; 88 class slate/gray/zinc; 67 chỗ `text-[9–11px]`; 0 i18n |
| `BibleEntityDetailModal.tsx` | 2.071 | Full-screen, 4 gradient, History modal chồng lên |
| `AddEntityModal.tsx` | 846 | 42 class slate/gray |

Vấn đề chung: badge trạng thái viết lại ≥4 lần, trộn emoji với icon Lucide; Canon dùng `purple-*` (tím chỉ dành cho AI); gradient, `backdrop-blur` trên badge, `shadow-2xl`, hex rời (`#FCFBF8`, `#D8D2C5`, `#FAF8F5`), class không tồn tại `py-0.2`; mỗi modal tự dựng overlay với z-index khác nhau; nhãn danh mục khai báo 3 nơi và lệch key (`terminology/style` vs `item/lore`); `mapCategoryToTab` rơi về `'characters'` cho category lạ; **8 chỗ `(item as any).status`** đọc sai trường (DTO đã trả `reviewStatus`).

FE còn **chưa theo kịp backend**: chưa gửi `revisionId` khi nộp concept từ hàng đợi; hàng đợi có thể có nhiều dòng cùng `entryId` (mỗi giai đoạn một dòng) → phải key theo `revisionId`.

## 3. Mô hình hành động (giữ làm tham chiếu UI)

| Hành động | Ai | Khi nào | Dữ liệu |
|---|---|---|---|
| **Viết định nghĩa** | Writer | Mục nháp (`IsStub`) | Ghi đè revision v1 `Draft`, gỡ `IsStub` (BIB-13) |
| **Nộp phiên bản concept** | Artist | Mục đã có định nghĩa, `Draft` / `ReworkRequired` / `ConceptSubmitted` | Phiên bản concept mới (`v1, v2…`, SHA-256), trạng thái `ConceptSubmitted` |
| **Góp ý / trả lời** | Writer, Editor (góp ý); Artist, Writer, Editor (trả lời) | Có phiên bản concept | Bình luận gắn phiên bản, có thể khoanh vùng; không đổi trạng thái |
| **Yêu cầu vẽ lại** | Writer, Editor, Producer (Q22) | `ConceptSubmitted` | `ReworkRequired`, bắt buộc nhận xét |
| **Xác nhận = khoá Canon** | Editor (khác Artist nộp) | `ConceptSubmitted`, đúng phiên bản đang nộp | `CanonLocked` |
| **Sửa nội dung** | Writer | Mô tả/đặc tả sai, cùng biến thể, chưa khoá | Revision mới cùng `variant_label`, về `Draft` |
| **Thay bản đã khoá** | Writer | Bản `CanonLocked` cần sửa | `/supersede`: revision mới cùng biến thể; bản cũ chỉ `Superseded` khi bản mới được khoá (8A) |
| **Biến thể mới** | Writer | Nhân vật đổi tạo hình (lớn lên, đổi giáp, hồi tưởng) | Revision mới với `variant_label` khác, không gắn số chương |

Ma trận chuyển trạng thái **sau BIB-10**: `SubmitConceptVersion: Draft | ReworkRequired | ConceptSubmitted` (mục `!IsStub`) · `RequestRework: ConceptSubmitted` · `ConfirmCanon: ConceptSubmitted`.

## 4. Task

### Backend còn lại

#### BIB-01 · Bản nháp không ghi đè thông tin Canon đang hiệu lực — BE · ❌ · cũ B2/L1
- **Bối cảnh:** commit `2b43cc3` cố ý cho phép tạo revision mới trên giai đoạn đã khoá (bản mới đi lại luồng duyệt). Nhưng `GetCurrentRevision` lấy VersionNumber lớn nhất → `entry.Name/Description/ReferenceImageUrl` bị bản nháp ghi đè trong khi Canon vẫn là bản cũ.
- [ ] **Cần user chốt:** hiển thị/AI dùng bản CanonLocked mới nhất của biến thể (đề xuất) hay bản mới nhất bất kể trạng thái.
- [ ] Nếu chốt theo đề xuất: thông tin hiện hành của mục lấy từ bản `CanonLocked` mới nhất (chưa `Superseded`) của **biến thể mặc định**, fallback bản mới nhất khi chưa có Canon; test.

#### BIB-02 · Validate biến thể mới — BE · 🟡 · cũ B6/L6 · đổi theo Q16
- [ ] `variant_label` (cột `StageName` hiện có) bắt buộc khi tạo biến thể mới, không trùng nhãn biến thể khác còn hiệu lực của cùng mục → 409. Bỏ kiểm "`from` không trùng chương bắt đầu".
- [ ] Đổi `variant_label` trong bản sửa nội dung không được tách biến thể (xác minh chặn đổi).
- [ ] Test.

### Frontend (làm theo thứ tự)

#### BIB-03 · Theo kịp hợp đồng backend — FE · ❌ · cũ bước 2
- [ ] `services/bible.service.ts` + types theo DTO hiện tại; bỏ 8 chỗ `(item as any).status` và so sánh số (backend dùng `JsonStringEnumConverter`).
- [ ] Nộp concept từ hàng đợi gửi `revisionId`; key danh sách hàng đợi theo `revisionId`.
- [ ] Quyền nút theo Q20: **Xác nhận (= khoá Canon) chỉ Editor**, cho cả Nhân vật/Địa điểm/Đạo cụ; Yêu cầu vẽ lại cho Writer + Editor + Producer (Q22); Producer không thấy nút xác nhận/khoá. Nếu BIB-10 chưa xong thì gọi endpoint cũ, đổi khi BIB-10 merge.
- [ ] `typecheck`.

#### BIB-04 · Tách cấu trúc `series-bible/` — FE · ❌ · cũ bước 3
```
series-bible/
  SeriesBibleView.tsx            ← layout + ghép nối (~300 dòng)
  bibleStatus.ts                 ← status → { labelKey, tone, icon } (1 nguồn)
  bibleCategories.ts             ← gộp CATEGORIES + getCategoryLabel + mapCategoryToTab (bỏ fallback 'characters')
  hooks/useBibleEntries.ts · useBibleReview.ts · useBiblePermissions.ts
  components/BibleToolbar · BibleStatusBadge · BibleEntryCard (grid) · BibleEntryRow (list) · VariantStrip · ReviewInbox
  modals/BibleDialog · EditContentModal · NewVariantModal · SubmitConceptModal · SupersedeModal · ReworkModal · ImageLightbox
  BibleEntityDetailModal.tsx     ← tabs Hồ sơ / Biến thể / Phiên bản concept & góp ý
  AddEntityModal.tsx
```
- [ ] Tách thuần trước, không đổi giao diện; giữ nguyên `data-testid`.
- [ ] Chuẩn hoá key danh mục `characters | locations | terminology | style` ở code và locale.

#### BIB-05 · Giao diện "hồ sơ thiết kế nhân vật" — FE · ❌ · cũ bước 4
- [ ] **Thẻ:** tỉ lệ ảnh theo danh mục (Nhân vật 3:4, Địa điểm 16:9, Đạo cụ 1:1, Lore không ảnh → đoạn trích serif); mã mục `font-mono text-xs` viền mảnh; tên `font-serif`; **một** badge trạng thái từ `BibleStatusBadge`.
- [ ] **Dấu Canon:** con dấu viền `emerald-700`, chữ `CANON · v3` + icon `Lock` (bỏ badge tím + emoji).
- [ ] **Bảng màu trạng thái** (DESIGN_RULES, bỏ tím/indigo; Q20 bỏ `WriterEndorsed`):

  | Trạng thái | Nhãn VI | Tông | Icon |
  |---|---|---|---|
  | Draft + `IsStub` | Chờ định nghĩa | stone (viền đứt) | `FilePen` |
  | Draft | Chờ vẽ | stone | `FileText` |
  | ConceptSubmitted | Chờ xác nhận | amber | `Clock` |
  | ReworkRequired | Cần vẽ lại | rose | `RotateCcw` |
  | CanonLocked | Canon | emerald | `Lock` |

- [ ] **VariantStrip** (thay StageRuler theo số chương — Q16 bỏ mốc chương): danh sách biến thể của mục, mỗi biến thể một ô (nhãn, trạng thái, ảnh nhỏ), kèm "đang dùng ở các chương …" lấy từ `chapter_bible_bindings`; bản mini trên thẻ, bản đầy đủ trong Detail.
- [ ] **ReviewInbox** thay design queue, theo vai trò: Writer "Chờ định nghĩa" (mục `IsStub`) + "Có concept mới" · Artist "Cần vẽ" (Draft đã định nghĩa / ReworkRequired + góp ý chưa trả lời) · Editor "Chờ bạn xác nhận" (ConceptSubmitted). Producer không có hộp này. Dải ngang `bg-white border-stone-200/80`, số lượng thật từ API.
- [ ] Gỡ: 5 gradient, emoji, `backdrop-blur` trên badge, `shadow-2xl`, `zinc/slate/gray` → `stone`, chữ < 12px, hex rời → token `studio-tokens.css`, `py-0.2`.
- [ ] Rỗng/đang tải: skeleton đúng tỉ lệ thẻ; rỗng theo danh mục có một hành động ("Thêm nhân vật đầu tiên").

#### BIB-06 · Modal một khung — FE · ❌ · cũ bước 5
- [ ] `BibleDialog` (hoặc `shared/components/ui/Dialog.tsx` nếu dùng toàn app): overlay `bg-stone-950/50`, một z-index (`z-[1050]`, lightbox `z-[1100]`), bề mặt `bg-white border-stone-200 rounded-2xl shadow-xl`; Header / Body cuộn / Footer; size `sm | md | lg | sheet`; Esc, focus trap, khoá cuộn nền, trả focus (gom logic ở `BibleEntityDetailModal.tsx:750`); một nút chính `.btn-cta-primary`, nút phá huỷ `rose`.
- [ ] **Detail** → sheet bên phải, 3 tab (Hồ sơ / Biến thể / Phiên bản concept & góp ý); bỏ History modal riêng. *(Cần user chốt: sheet hay giữ full-screen — đề xuất sheet.)*
- [ ] `AddRevisionModal` → 4 modal: `EditContent`, `NewVariant` (báo trùng nhãn khi nhập), `SubmitConcept`, `Supersede`.
- [ ] `Rework`: 2 cột (ảnh concept bị trả | ô nhận xét bắt buộc).
- [ ] Xác nhận nộp/khoá: `LucianConfirmModal`, copy cụ thể ("Xác nhận concept v3 và khoá Canon cho biến thể Trưởng thành?").
- [ ] `AddEntityModal` → `BibleDialog size="lg"`.

#### BIB-07 · i18n & văn phong — FE · ❌ · cũ bước 6
- [ ] Chuyển toàn bộ chuỗi vào `locales/{vi,en}/bible.json` (~250–300 key, nhóm `status.*`, `category.*`, `variant.*`, `review.*`, `comment.*`, `modal.*`).
- [ ] Văn phong: "Gửi concept", "Trả về vẽ lại", "Xác nhận & khoá Canon", "Thay bản khoá", "Viết định nghĩa" (không dùng "Mở khoá").
- [ ] `npm run i18n:check`.

#### BIB-08 · Cập nhật test & review — FE/BE · ❌ · cũ bước 7–8
- [ ] Cập nhật `SeriesBibleView.test.tsx`, `BibleEntityDetailModal.test.tsx`, `AddEntityModal.test.tsx` (chạy khi user yêu cầu).
- [ ] `architect-reviewer` rà diff trước khi merge `trungkien`.

### Duyệt concept theo phiên bản (Q20)

#### BIB-10 · Editor xác nhận = khoá Canon; phiên bản concept & góp ý có trả lời — DB + BE + FE · ❌ · Q20
- **Bối cảnh code:** mỗi lần nộp concept hiện đã ghi một `BibleRevisionEvent` loại `ConceptSubmitted` kèm ảnh (`BibleEntryRevision.SubmitConcept`), `ConceptImageUrl` là ảnh của sự kiện mới nhất. Enum `BibleRevisionStatus` còn `WriterEndorsed = 4`; `/endorse` cho Writer + Editor, `/lock` cho Producer.
- [ ] [DB + BE] **Phiên bản concept = sự kiện `ConceptSubmitted`** (đã bất biến): thêm `concept_version_number INT NULL` (tăng dần theo revision) và `asset_sha256 VARCHAR(64) NULL` vào `bible_revision_events`; `bible_entry_revisions.current_concept_event_id UUID NULL` trỏ phiên bản đang nộp. Migration điền số phiên bản cho sự kiện cũ theo thứ tự thời gian.
- [ ] [DB + BE] Góp ý có trả lời — bảng mới:
  ```sql
  CREATE TABLE bible_concept_comments (
    id                 UUID PRIMARY KEY,
    revision_id        UUID NOT NULL REFERENCES bible_entry_revisions(id) ON DELETE CASCADE,
    concept_event_id   UUID NOT NULL REFERENCES bible_revision_events(id),   -- phiên bản được góp ý
    parent_comment_id  UUID NULL REFERENCES bible_concept_comments(id),     -- trả lời (một cấp)
    author_id          UUID NOT NULL,
    body               TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
    region             JSONB NULL,                                          -- {x,y,w,h} chuẩn hoá 0..1 trên ảnh
    resolved_at        TIMESTAMPTZ NULL, resolved_by UUID NULL,
    created_at         TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NULL, is_deleted BOOLEAN NOT NULL DEFAULT false
  );
  CREATE INDEX ix_bible_concept_comments_revision ON bible_concept_comments(revision_id, created_at);
  ```
  Endpoint: `GET/POST .../revisions/{revisionId}/comments`, `POST .../comments/{commentId}/replies`, `POST .../comments/{commentId}/resolve`. Quyền: góp ý gốc Writer + Editor; trả lời Writer + Editor + Artist; Producer chỉ đọc. Thông báo: Artist khi có góp ý/yêu cầu vẽ lại; Writer + Editor khi có phiên bản mới; tác giả góp ý khi có trả lời.
- [ ] [BE] **Bỏ `WriterEndorsed`** (Q20): `Endorse` + `Lock` gộp thành `ConfirmCanon(editorId, conceptEventId)`: chỉ từ `ConceptSubmitted`, `conceptEventId` phải là phiên bản đang nộp (409 nếu Artist vừa nộp bản mới), Editor khác Artist đã nộp phiên bản đó (BR-06 → 403) → `CanonLocked` + sự kiện `Locked`. Migration dữ liệu: revision đang `WriterEndorsed` → `ConceptSubmitted` (Editor xác nhận lại); xoá giá trị enum, gỡ luật "người đã xác nhận không tự khoá".
- [ ] [BE] Endpoint: `/endorse` + `/lock` → `POST .../revisions/{revisionId}/confirm` (chỉ **Editor**). `/request-rework` cho **Writer + Editor + Producer** (Q22), bắt buộc nhận xét; ghi thêm một góp ý gốc gắn phiên bản đang nộp để hiện trong luồng hội thoại.
- [ ] [BE] Nộp concept (4A): `409` khi `entry.IsStub` hoặc mô tả revision rỗng ("Thực thể chưa được Writer viết định nghĩa"). Nộp từ `ConceptSubmitted` (Artist tự thay ảnh trước khi được xác nhận) = phiên bản mới.
- [ ] [BE] Quyền tạo mục, tạo revision chữ, `/supersede`: chỉ **Writer** (bỏ Producer, Q19/Q20).
- [ ] [FE] Màn duyệt concept: ảnh phiên bản đang nộp + chọn phiên bản cũ để so sánh cạnh nhau; luồng góp ý theo phiên bản (khoanh vùng trên ảnh, trả lời, đánh dấu đã xử lý). Editor: nút "Xác nhận & khoá Canon" + "Yêu cầu vẽ lại"; Writer: góp ý + "Yêu cầu vẽ lại"; Artist: trả lời + nộp phiên bản mới; Producer: xem + "Yêu cầu vẽ lại" (Q22).
- [ ] [Docs] Đã sửa spec §5.1, §5.2 máy 1, glossary §3.3, chuẩn đặt tên §5.3 (2026-11-14).
- [ ] Test: Writer gọi `/confirm` → 403; Producer gọi `/confirm`, `/supersede`, góp ý gốc → 403, `/request-rework` → thành công (Q22); Editor xác nhận phiên bản cũ → 409; Editor là Artist nộp → 403; Editor xác nhận → `CanonLocked`; trả lời góp ý không đổi trạng thái; nộp concept khi `IsStub` → 409; migration `WriterEndorsed` → `ConceptSubmitted`.

### Nối Bible với luồng sản xuất (Q16, Q19)

> **Bối cảnh (rà soát 2026-11-13):** D11 bỏ `@mention` và người nói từ Bible → `CheckChapterBibleGateQuery` luôn trả `IsPassed = true`, `FreezeChapterScriptCommand` không gọi gate; BR-21 không được thực thi, `GetPanelBible` không còn dữ liệu. **Thứ tự:** BIB-09 → BIB-11 → BIB-12 → BIB-13 → BIB-14 → (BIB-15 ∥ BIB-16) → BIB-17. BIB-10 chạy song song sau BIB-09 (cùng đụng `AddBibleEntryRevision`).
>
> **Luồng lưu kịch bản hiện tại (FE `ScriptEditorView.handleSaveScript`)** gồm 4 request rời: `batchSave` (dòng) → `syncScriptStructure` (Trang/Panel) → `updatePanelDirection` × N → `commitScriptVersion`. Vì vậy tham chiếu đi cùng `batchSave` (2A) nhưng **tính lại Danh sách thực thể chương ở `commitScriptVersion`** (3A), khi đã đủ dòng, Trang, Panel.

#### BIB-09 · Bí danh, bảng tên chuẩn hoá & biến thể tạo hình — DB + BE · ❌ · Q16, 8A, 9A
- [ ] [DB] `bible_entries.aliases TEXT[] NOT NULL DEFAULT '{}'`.
- [ ] [DB] Bảng chỉ mục tên (9A):
  ```sql
  CREATE TABLE bible_entry_names (
    series_bible_id  UUID NOT NULL REFERENCES series_bibles(id) ON DELETE CASCADE,
    normalized_name  VARCHAR(200) NOT NULL,
    bible_entry_id   UUID NOT NULL REFERENCES bible_entries(id) ON DELETE CASCADE,
    is_primary       BOOLEAN NOT NULL,
    PRIMARY KEY (series_bible_id, normalized_name)
  );
  CREATE INDEX ix_bible_entry_names_entry ON bible_entry_names(bible_entry_id);
  ```
  Ghi cả tên chính và mọi bí danh của mục **đang hoạt động**; đồng bộ trong cùng transaction với tạo/sửa/xoá mục. Migration điền từ dữ liệu hiện có (mục trùng tên sẵn có → báo cáo, không tự gộp).
- [ ] [BE] `BibleNameNormalizer.Normalize(s)`: trim → gộp khoảng trắng → Unicode NFC → `ToLowerInvariant()`. Dùng chung cho bảng tên và `SpeakerResolver` (BIB-12).
- [ ] [BE] `BibleEntry.SetAliases(...)`: chuẩn hoá, bỏ trùng, tối đa 20 bí danh × 100 ký tự. Create/Update/Define nhận `aliases`.
- [ ] [BE] Tạo/sửa thủ công trùng `normalized_name` trong cùng Series → 409 kèm tên mục bị trùng. Tự tạo mục nháp khi lưu (BIB-12) gặp vi phạm unique (`23505`) → nạp lại `bible_entry_id` mà transaction kia vừa tạo và dùng mục đó, không báo lỗi.
- [ ] [BE] Dùng `StageName` hiện có làm `variant_label` (DTO đổi tên trường thành `variantLabel`, giữ tên cột); biến thể mặc định = bản đầu tiên của mục (`IsDefaultVariant` tính toán). `EffectiveFrom/ToChapterNumber` không còn dùng để chọn bản (gỡ cột ở BIB-17).
- [ ] [BE] `/supersede` chỉ thay bản **cùng biến thể** (8A): **sửa `AddBibleEntryRevisionCommand`** — hiện gọi `MarkSuperseded` ngay khi tạo bản thay thế; đổi thành ghi `supersedes_revision_id` trên bản mới, bản cũ vẫn `CanonLocked` dùng được. Khi bản thay thế được Editor khoá (BIB-10 `ConfirmCanon`) mới ghi sự kiện `Superseded` cho bản cũ và chạy chuyển binding (BIB-13). Tạo biến thể mới = `AddBibleEntryRevision` với nhãn khác, không supersede.
- [ ] Test: trùng bí danh 409, hai giao dịch cùng tự tạo "Hắc Long" chỉ ra một mục, supersede giữ biến thể, bản cũ còn dùng được cho tới khi bản mới khoá, nhiều biến thể cùng `CanonLocked`.

#### BIB-11 · Bản đồ thực thể chương, bảng tham chiếu & cờ Quần chúng — DB + BE · ❌ · Q16, 5A, 7A
- [ ] [DB] Bản đồ thực thể chương:
  ```sql
  CREATE TABLE chapter_bible_bindings (
    chapter_id               UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    bible_entry_id           UUID NOT NULL REFERENCES bible_entries(id) ON DELETE RESTRICT,
    bound_revision_id        UUID NULL REFERENCES bible_entry_revisions(id) ON DELETE RESTRICT,
    source                   VARCHAR(16) NOT NULL CHECK (source IN ('Speaker','Highlight')),
    variant_label            VARCHAR(100) NULL,        -- biến thể (giai đoạn) chương dùng, Q21; có thể là biến thể chưa khoá
    variant_chosen_by_writer BOOLEAN NOT NULL DEFAULT false,  -- Writer đã tự đổi (không bị đề xuất ghi đè); false = đang dùng mặc định
    is_crowd_at_bind         BOOLEAN NOT NULL DEFAULT false,
    bound_by                 UUID NULL,
    bound_at                 TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (chapter_id, bible_entry_id)
  );
  CREATE INDEX ix_chapter_bible_bindings_entry ON chapter_bible_bindings(bible_entry_id);
  CREATE INDEX ix_chapter_bible_bindings_revision ON chapter_bible_bindings(bound_revision_id);
  ```
  - `source`: `Speaker` (người nói tự khớp hoặc tự tạo) | `Highlight` (Writer bôi đen). Một mục có cả hai nguồn thì giữ `Speaker`.
  - `variant_label` (Q21): tự đề xuất theo chương gần nhất phía trước có mục đó, chưa có thì biến thể mặc định; Writer đổi được sang **bất kỳ** biến thể nào của mục, kể cả biến thể chưa khoá. Không có bước xác nhận (Q22): biến thể đề xuất là mặc định; Writer đổi thì `variant_chosen_by_writer = true`.
  - `bound_revision_id` = bản `CanonLocked` mới nhất, chưa `Superseded` của `variant_label`; NULL khi biến thể đó chưa khoá. Tự cập nhật khi biến thể được khoá hoặc bản thay thế được khoá (8A) cho tới khi chương `Frozen`. Gate 1 bắt buộc NOT NULL cho mọi mục `is_crowd_at_bind = false`.
  - `is_crowd_at_bind` (7A): chương chưa `Frozen` luôn đồng bộ theo `bible_entries.is_crowd`; Gate 1 đóng băng giá trị.
  - Binding được **tính lại từ kịch bản** mỗi lần commit (BIB-12): thêm dòng cho mục mới xuất hiện, xoá dòng cho mục không còn được nhắc; giữ `variant_label`, `variant_chosen_by_writer` của dòng còn lại.
- [ ] [DB] Bảng tham chiếu (5A): **giữ** `script_line_bible_links` và unique `(script_line_id, bible_entry_id) WHERE is_deleted = false` — mỗi dòng tham chiếu một mục tối đa một lần. Đổi `raw_mention_text varchar(100)` → `surface_text varchar(200) NOT NULL` (migration điền từ tên mục khi null). `resolved_revision_id` gỡ ở BIB-17.
- [ ] [DB] `bible_entries.is_crowd BOOLEAN NOT NULL DEFAULT false`.
- [ ] [BE] Dùng lại `BibleEntry.CreateStub/IsStub` cho mục tự tạo; **sửa `CreateStub`**: `Description = ""` (bỏ câu "Thực thể tạm thời… '@Tên'"), `snapshotJson` của revision v1 bỏ `EffectiveFromChapterNumber`.
- [ ] [BE] Entity + configuration + migration (có `Down`); `DeleteBibleEntry` trả 409 khi mục đang được chương nào gắn hoặc còn tham chiếu.
- [ ] [BE] Bản đồ chỉ đổi được khi `chapter.ScriptStatus != Frozen` và chương `IsContentEditable` (409 ngược lại), trừ cột `is_crowd_at_bind` của chương chưa chốt (đồng bộ tự động).

#### BIB-12 · Tham chiếu trong payload lưu & tính lại Danh sách thực thể ở commit — BE · ❌ · 1A, 2A, 3A, 6A
- [ ] [BE] **Payload `BatchSaveScriptLines`** (2A): mỗi dòng có `refs: [{ surfaceText, bibleEntryId?, newDraft?: { name, category } }]`, thay trường `BibleEntryIds` cũ.
  - Chỉ chấp nhận trên dòng `Action`, `Narration` (Caption), `Sfx` (1A); dòng khác có `refs` → 400.
  - `surfaceText` phải có trong chữ của dòng (so sau chuẩn hoá) → ngược lại bỏ tham chiếu và trả cảnh báo.
  - `bibleEntryId`: mục Nhân vật/Địa điểm/Đạo cụ cùng Series, đang hoạt động. `newDraft`: tạo mục `Draft` (`CreateStub`, `IsStub = true`, mô tả rỗng) qua bảng `bible_entry_names` (tên đã có → dùng mục có sẵn) rồi gắn.
  - Hai `refs` cùng mục trong một dòng → gộp một (5A).
  - Chỉ **Writer** (Producer 403, BR-07/Q19; khớp SCR-11).
- [ ] [BE] Chữ của dòng đổi mà không gửi lại `refs`: giữ tham chiếu cũ nếu `surface_text` còn trong chữ mới, không còn → gỡ và trả cảnh báo trong kết quả lưu để FE báo Writer.
- [ ] [BE] **`RecomputeChapterCastAsync` chạy trong transaction của `CommitScriptVersionCommand`** (3A), theo thứ tự:
  1. `SpeakerResolver` (hàm thuần): chuẩn hoá `SpeakerLabel` (bỏ hậu tố `(nghĩ)`, `BibleNameNormalizer`) và khớp **nguyên chuỗi** với `bible_entry_names` của mục **Nhân vật**; không khớp → tạo mục Nhân vật `Draft` (`CreateStub`, tên = nhãn như Writer gõ, xử lý `23505` theo 9A); trùng nhãn trong cùng lần commit chỉ tạo một mục. Audit "tự tạo từ người nói, chương N". Không quét chữ trong mô tả/lời dẫn/SFX.
  2. Tổng hợp người nói + `script_line_bible_links` → đồng bộ `chapter_bible_bindings` (tự gắn bản theo BIB-13, cập nhật `is_crowd_at_bind`).
  3. Dọn mục thừa: `IsStub`, hệ thống tạo, không còn binding và tham chiếu nào, chỉ có sự kiện `Created` → xoá.
  4. Chụp `ScriptVersion` và tính mã băm.
- [ ] [BE] Commit chỉ **Writer** (hiện cho cả Producer ở `ScriptVersionFeatures.cs:218`) vì commit giờ có thể tạo mục Bible.
- [ ] [BE] **Phiên bản & mã băm (6A):** `ScriptVersionRow` thêm `Refs: [{ EntryId, SurfaceText }]` (lưu trong snapshot JSON). Chuỗi băm mỗi dòng giữ nguyên `Type|Page|Panel|Label|Text`, **chỉ nối thêm** `|refs:<entryId,…>` (sort theo GUID) khi `Refs.Count > 0` → chương đang `InReview` không lệch mã băm. Diff giữa hai lần gửi hiện thêm/gỡ tham chiếu.
- [ ] [BE] `GET /api/chapters/{id}/cast`: mỗi thực thể kèm nguồn (Người nói/Bôi đen), trạng thái Bible (chờ định nghĩa / chờ Artist / chờ xác nhận / `CanonLocked`), `isCrowd`, `variantLabel`, `variantChosenByWriter`, `boundRevision`, mọi biến thể của mục (kèm trạng thái), danh sách dòng/Panel nhắc tới; và `submitGate { canSubmit, blockers[] }` (Q21: chờ định nghĩa) + `gate { canStart, blockers[] }` (biến thể chưa khoá).
- [ ] Test: khớp bí danh, `Minh (nghĩ)`, tên có dấu viết hoa khác nhau, tự tạo một lần cho nhiều dòng cùng tên, dọn mục thừa, `refs` trên dòng thoại → 400, tham chiếu bị gỡ khi sửa chữ, hash chương không có tham chiếu không đổi so với trước.
- [ ] *(Sau, 3B)* Gộp 4 request lưu thành một endpoint `SaveScript` một transaction — ghi ở 01_SCRIPT_PLAN.

#### BIB-13 · Ba lệnh Danh sách thực thể & tự gắn bản — BE · ❌ · Q18, Q19, 4A, 7A, 8A
- [ ] [BE] `SetBibleEntryCrowdCommand(entryId, bool)` — **chỉ Writer**, bất kỳ lúc nào (7A); cập nhật `is_crowd_at_bind` cho mọi chương chưa `Frozen` có mục đó. Chương đã chốt không đổi.
- [ ] [BE] `SetChapterCastVariantCommand(chapterId, entryId, variantLabel)` — **chỉ Writer** (Q18, Q21), kịch bản chưa `Frozen`; nhãn phải là một biến thể của mục (**không bắt buộc đã khoá**) → `variant_label`, `variant_chosen_by_writer = true`, tính lại `bound_revision_id` (NULL nếu biến thể chưa khoá); Audit. Gọi với `variantLabel = null` → quay về mặc định.
- [ ] [BE] `DefineBibleEntryCommand(entryId, name, aliases, description, details…)` — **chỉ Writer** (Q19), mục `IsStub = true`: mô tả bắt buộc; sinh mã chuẩn thay `STUB_xxxx`; `PromoteFromStub()`; **ghi đè revision v1 `Draft`** hiện có (không tạo v2); cập nhật `bible_entry_names`. Sau đó mục vào hàng đợi Artist.
- [ ] Producer và vai trò khác gọi 3 lệnh → 403. Không có lệnh bôi/gỡ tham chiếu rời (2A), không có lệnh gắn tay (gắn là tự động).
- [ ] **Tự đề xuất biến thể** (khi mục mới vào chương): `variant_label` của chương gần nhất trước chương này (theo `ChapterNumber`) có thực thể đó; chưa có thì biến thể mặc định. Đây là giai đoạn **mặc định** (Q22), không cần xác nhận; biến thể Writer đã tự đổi (`variant_chosen_by_writer = true`) không bị đề xuất ghi đè.
- [ ] Khi Editor khoá Canon một bản (BIB-10) → tính lại `bound_revision_id` cho mọi chương chưa `Frozen` có `variant_label` của bản đó: khoá lần đầu thì điền, khoá **bản thay thế** (8A) thì chuyển sang bản mới; chương `Frozen` giữ nguyên.
- [ ] Hàng đợi thiết kế (`GetBibleDesignQueueQuery`): chỉ mục `IsVisualDesign`, không `IsStub`, không `is_crowd`; kèm các chương đang chờ mục đó để Artist ưu tiên.
- [ ] Test mỗi lệnh: thành công, 403 (Producer), 409 (Frozen, nhãn không thuộc mục, sai Series, Define trên mục đã định nghĩa); chọn biến thể chưa khoá → `bound_revision_id` NULL, khoá xong tự điền; bật Quần chúng không đổi chương đã chốt; supersede rồi khoá → chương chưa chốt chuyển bản.

#### BIB-14 · Chốt Bible khi Gửi duyệt & tại Gate 1 — BE · ❌ · Q16, Q21, 7A · thay `CheckChapterBibleGateQuery`
- [ ] [BE] `ChapterCastGate` — một nguồn luật cho `GET /cast`, Gửi duyệt và Gate 1, hai mức (Q21):
  - `EvaluateSubmitAsync` (**Gửi duyệt / Gửi duyệt lại**, `SubmitScriptCommand`): chặn khi còn mục `is_crowd_at_bind = false` mà `IsStub` (chờ định nghĩa) hoặc chưa có `variant_label` (chỉ xảy ra khi mục chưa có biến thể nào). Không đòi xác nhận giai đoạn (Q22). Không đòi ảnh `CanonLocked` ở mốc này. Vi phạm → 409 kèm danh sách.
  - `EvaluateStartAsync` (**Gate 1**): toàn bộ điều kiện Gửi duyệt + mọi mục `is_crowd_at_bind = false` có `bound_revision_id` `CanonLocked` của đúng `variant_label` (biến thể mới chưa được Editor khoá thì chặn, không rơi về biến thể cũ). Tính lại bản đồ từ **bản đã gửi** ngay lúc chốt (không tin dữ liệu cũ).
- [ ] [BE] `FreezeChapterScriptCommand` gọi gate trước khi `StartProduction`; vi phạm → 409 kèm danh sách (tên, biến thể, lý do: chờ định nghĩa / biến thể chờ Artist vẽ / chờ Editor xác nhận). Thành công → đóng băng `is_crowd_at_bind` và `bound_revision_id`.
- [ ] [BE] Chốt lại sau khi Producer mở lại: binding đổi `bound_revision_id` (hoặc thêm/bớt thực thể) → gắn ⚑ các Panel có dòng nhắc tới thực thể đó, dùng chung cơ chế với [SCR-01](01_SCRIPT_PLAN.md).
- [ ] [BE] `ChapterSnapshotBuilder` (Gate 3) ghi bản đồ thực thể vào manifest (mục, bản, mã băm Model Sheet).
- [ ] Xoá `CheckChapterBibleGateQuery` + endpoint `bible-gate` (FE `ScriptReviewView`/`ChecksTab` chuyển sang `GET /cast`).
- [ ] Test: Gửi duyệt khi còn mục nháp → 409, gắn cờ Quần chúng → qua; mục 2 biến thể Writer không đổi → Gửi duyệt qua với biến thể mặc định; chọn biến thể "Timeskip" chưa khoá → Gửi duyệt qua, Gate 1 409, Editor khoá xong → Gate 1 qua; đủ điều kiện → Frozen + binding khoá; sửa binding khi Frozen → 409; gỡ cờ Quần chúng sau Gate 1 không mở lại vướng của chương đã chốt.

#### BIB-15 · Bàn vẽ, AI và kiểm tra nhất quán đọc theo binding — BE · ❌ · Q16
- [ ] [BE] `GetPanelBible`: lấy từ `chapter_bible_bindings` của chương, lọc theo thực thể có dòng nhắc tới trong Panel đó (người nói hoặc bôi đen), trả Model Sheet của `bound_revision_id`; mục `is_crowd_at_bind` không hiện.
- [ ] [BE] `ConsistencyChecker`, context AI (`AiWorkflowFacts`, Writer/Artist Agent), `GetBibleEntriesAtChapterQuery`: thay `EffectiveRevisionAt(N)` bằng binding của chương; chương chưa qua Gate 1 dùng bản tự gắn hiện tại.
- [ ] Test: chương 5 giữ bản cũ sau khi bản thay thế ở chương 6 được khoá.

#### BIB-16 · Giao diện Danh sách thực thể chương & bôi đen — FE · ❌ · Q16, Q19, 1A, 2A, 5A
- [ ] [FE] Editor kịch bản (chỉ Writer): bôi đen chữ trên dòng **Action / Caption / SFX** (dòng Panel, Character, Dialogue không hiện menu) → menu nổi "Tham chiếu Series Bible" (ô tìm theo tên/bí danh) + "Tạo bản nháp" khi chưa có (tên điền sẵn, chọn loại, một bước, không bắt nhập mô tả).
- [ ] [FE] Lưu tham chiếu qua `scriptFlowAdapter`: mark → `refs[{ surfaceText, bibleEntryId | newDraft }]` trong payload `batchSave`. Mọi chỗ cùng `surfaceText` trong dòng đều gạch chân (5A); hover hiện tên mục, có nút gỡ. Báo khi kết quả lưu trả cảnh báo mất tham chiếu.
- [ ] [FE] Ô người nói: gợi ý tên/bí danh Bible khi gõ (không bắt buộc chọn); tên mới hiện chip "Sẽ tạo bản nháp".
- [ ] [FE] Ngăn phải `ScriptEditorView`: danh sách thực thể (nguồn, trạng thái Bible, bản đang gắn; ô chọn biến thể khi mục có ≥ 2 biến thể (hiện cả biến thể chưa khoá kèm trạng thái; nhãn "Mặc định" khi Writer chưa đổi, có nút "Về mặc định"); nút **Quần chúng**; nút "Viết định nghĩa" với mục nháp) — **thao tác chỉ hiện với Writer**, vai trò khác chỉ xem; bấm thực thể → nhảy tới dòng/Panel.
- [ ] [FE] Nút **Gửi duyệt** của Writer hiện danh sách việc còn thiếu từ `submitGate.blockers` (viết định nghĩa / gắn Quần chúng), khoá nút khi `canSubmit = false`. Nút **Bắt đầu sản xuất** (và tab Gate 1 của [ASG-01](03_ASSIGNMENT_PLAN.md)) hiện `gate.blockers` (biến thể chưa khoá), khoá nút khi `canStart = false`.
- [ ] [FE] Form mục Bible: ô bí danh (chip), nhãn biến thể thay cho "chương bắt đầu/kết thúc", cờ Quần chúng; hàng đợi thiết kế hiện "Chương đang chờ".
- [ ] [FE] Bỏ UI era (chương hiệu lực), `@mention`. i18n vi/en; test.

#### BIB-17 · Gỡ cơ chế cũ — BE + FE + DB · ❌ · sau BIB-14/15/16
- [ ] [BE] Gỡ `ScriptLine.SpeakerCharacterId` + `ValidateSpeakerAsync`, `LinkBibleEntriesCommand` + endpoint, trường `BibleEntryIds` của payload lưu (thay bằng `refs`), `EffectiveRevisionAt`, `DeleteBibleEntryEraCommand` + endpoint `eras`, cột `EffectiveFrom/ToChapterNumber`, cột `script_line_bible_links.resolved_revision_id`, endpoint `/endorse` + `/lock` cũ (sau BIB-10). Migration có `Down`. **Giữ** `script_line_bible_links` (mở rộng ở BIB-11) và `CreateStub/IsStub/PromoteFromStub`.
- [ ] [FE] Gỡ `@tiptap/extension-mention` và code gọi các endpoint trên.
- [ ] [QA] Viết bộ test case Series Bible mới theo Q16–Q20: người nói tự khớp/tự tạo, bôi đen (đúng loại dòng), Quần chúng, định nghĩa mục nháp, phiên bản concept + góp ý/trả lời, Editor xác nhận = khoá, supersede, Gate 1.
- [ ] Mục "ép `ChapterNumber` decimal về int" ở rà soát 2026-11-13 tự hết khi gỡ `EffectiveRevisionAt`.

## 5. Quyết định

| # | Câu hỏi | Trạng thái |
|---|---|---|
| 1 | Vòng đời theo danh mục | ✅ Nhân vật/Địa điểm/Đạo cụ đủ vòng đời; Thuật ngữ/Quy tắc/Sự kiện không cần khoá |
| 2 | Xoá revision | ✅ Chỉ xoá Draft chưa có event ngoài `Created` |
| 3 | Ai xác nhận / khoá Canon | ✅ Q20 (2026-11-14): **Editor xác nhận = khoá**, bỏ `WriterEndorsed`; Producer không khoá Bible (BIB-10). Thay câu trả lời cũ "Editor duyệt, Producer khoá" |
| 6 | Bible Gate khi kịch bản không còn `@Tag` (D11) | ✅ Q16: người nói tự khớp/tự tạo nháp; lời dẫn bôi đen; biến thể tạo hình; `chapter_bible_bindings` khoá ở Gate 1 → BIB-09, BIB-11..BIB-17 |
| 7 | Ai bôi đen, ai gắn cờ Quần chúng | ✅ Q19: chỉ Writer (bôi đen, cờ Quần chúng, viết định nghĩa, đổi biến thể); Producer chỉ đọc |
| 8 | Đổi biến thể tạo hình theo chương | ✅ Q18: tự động mặc định, chỉ Writer đổi (BIB-13, BIB-16) |
| 9 | Thiết kế kỹ thuật luồng Script ↔ Bible | ✅ 1A–9A (2026-11-14), xem §0 |
| 11 | Chốt Bible khi nào | ✅ Q21, Q22: Gửi duyệt chốt Danh sách thực thể (định nghĩa hoặc Quần chúng; giai đoạn mặc định, Writer đổi khi cần); Gate 1 chốt ảnh `CanonLocked` của đúng biến thể (BIB-14) |
| 10 | Duyệt concept | ✅ Q20, Q22: phiên bản concept bất biến, góp ý theo phiên bản có trả lời, Writer + Editor + Producer yêu cầu vẽ lại (BIB-10) |
| 4 | Detail modal: sheet hay full-screen | ⏳ Đề xuất sheet bên phải (BIB-06) |
| 5 | Thông tin hiện hành khi có bản nháp trên biến thể đã khoá | ⏳ Đề xuất lấy bản Canon (BIB-01) |

## 6. Changelog

| Ngày | Task | Trạng thái | Nhánh / Commit | Ghi chú |
|---|---|---|---|---|
| 2026-11-12 | cũ B1, B3, B5, B6 (một phần) | ✅ | BE `1cb44ed`, merge `a092b0f` | Guard trạng thái, hàng đợi theo giai đoạn |
| 2026-11-12 | cũ B4, L7 | ✅ | BE `79b5077`, merge `df10ee3` | Địa điểm/Đạo cụ khoá được; chỉ Editor duyệt |
| 2026-11-14 | Q16, BIB-09, BIB-11..BIB-17 | Lập kế hoạch | — (chỉ tài liệu) | Bible chốt theo chương: bí danh, biến thể tạo hình, Danh sách & Bản đồ thực thể chương, chốt ở Gate 1 |
| 2026-11-14 | Q16 (chỉnh), BIB-11..BIB-17 | Lập lại kế hoạch | — (chỉ tài liệu) | Người nói tự khớp/tự tạo nháp, cờ Quần chúng, tham chiếu bằng bôi đen, dùng lại `CreateStub/IsStub` |
| 2026-11-14 | Q19, Q20, 1A–9A; BIB-09..BIB-17, BIB-10 | Lập lại kế hoạch | — (chỉ tài liệu) | Rà soát code: mô tả Panel ở `Panel.Direction` (chỉ bôi đen dòng Action/Caption/SFX), lưu 4 request rời (tính lại ở commit), `PromoteFromStub` chưa được gọi, `AddBibleEntryRevision` đánh dấu Superseded quá sớm. Thêm `bible_entry_names`, `is_crowd_at_bind`, `bible_concept_comments`; bỏ `WriterEndorsed`; Producer chỉ đọc Bible |
| 2026-11-14 | Q21; BIB-11, BIB-13, BIB-14, BIB-16 | Lập lại kế hoạch | — (chỉ tài liệu) | Biến thể chương lưu theo nhãn (kể cả chưa khoá), `variant_confirmed`; Gửi duyệt chặn khi Danh sách thực thể chưa chốt; Gate 1 chặn khi biến thể chương dùng chưa khoá |
| 2026-11-14 | Q22; BIB-10, BIB-11, BIB-13, BIB-14, BIB-16 | Lập lại kế hoạch | — (chỉ tài liệu) | Producer được yêu cầu vẽ lại; bỏ `variant_confirmed`, giai đoạn mặc định, Writer đổi khi cần (`variant_chosen_by_writer`) |
| 2026-11-12 | — | Chuyển sang bộ plan module | — | Từ `SERIES_BIBLE_REDESIGN_PLAN.md` |
