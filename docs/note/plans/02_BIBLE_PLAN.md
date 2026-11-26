# 02 · SERIES BIBLE (`BIB`)

> **Spec:** Module 1 mục 2–4 (Danh sách thực thể chương, duyệt Series Bible, biến thể tạo hình, bản theo chương & theo Panel, chốt Bible ở Gate 1), §5.1, §5.2 máy trạng thái 1, BR-01 (không unlock, supersede theo biến thể), BR-06, BR-15, BR-21/30, **BR-35** (Danh sách & Bản đồ thực thể chương). Quyết định **Q16–Q24** (2026-11-14).
> **Thay cho:** `note/SERIES_BIBLE_REDESIGN_PLAN.md`; `archive/implement-plan/completed/SERIES_BIBLE_REWORK_AND_ERA_VERSIONING_PLAN.md` (đã xong).
> **Repo:** `PanelForge_FA26SE251` (BE + DB), `panelforge-fe` (chính).

---

## 0. Tóm tắt quyết định đang áp dụng

| Mã | Nội dung | Task |
|---|---|---|
| Q16 | Người nói chỉ khớp **tên mục** sau chuẩn hoá và bỏ `(nghĩ)`, không có bí danh; không khớp thì tự tạo mục nháp. Tên mục bất biến, duy nhất trong Series; riêng tên stub được Writer đặt lại đúng một lần khi viết định nghĩa. Lời dẫn/mô tả bôi đen để tham chiếu; biến thể tạo hình thay mốc chương; `chapter_bible_bindings` khoá ở Gate 1 | BIB-09, BIB-11..BIB-17 |
| **BIB-01 / A** | Thông tin cấp mục lấy mô tả/ảnh từ bản `CanonLocked` mới nhất chưa `Superseded` của biến thể mặc định, fallback bản mới nhất khi chưa có Canon. Cache chỉ cập nhật lúc khoá Canon; bản nháp không ghi đè; FE báo `Có bản nháp vN` | BIB-01, BIB-16 |
| Q18 | Chỉ Writer đổi biến thể tạo hình cho chương | BIB-13, BIB-16 |
| **Q19** | Writer quản lý Danh sách thực thể chương: bôi đen, cờ Quần chúng, viết định nghĩa, đổi biến thể. Producer chỉ đọc | BIB-12, BIB-13, BIB-16 |
| **Q21** | **Chốt Bible hai mốc:** *Gửi duyệt* chặn khi còn mục nháp chưa định nghĩa (không Quần chúng); biến thể chọn theo nhãn, **kể cả biến thể chưa khoá**; *Bắt đầu sản xuất* chặn khi biến thể chương dùng chưa có bản `CanonLocked` | BIB-11, BIB-13, BIB-14, BIB-16 |
| **Q22** | Producer được **yêu cầu vẽ lại** concept; **giai đoạn mặc định** do hệ thống đề xuất, Writer chỉ đổi khi cần, không có bước xác nhận | BIB-10, BIB-11, BIB-13, BIB-14, BIB-16 |
| **Q23** | Chương gắn **bản cụ thể** (có thể chưa khoá); **kế thừa về phía sau** từ chương gần nhất phía trước, tính lại tới khi chốt; **bản theo Panel** cho giai đoạn khác trong cùng chương (không kế thừa); Gate 1 kiểm mọi bản chương dùng; cảnh báo chương sau đã chốt lệch bản; huỷ bản thay thế chưa duyệt | BIB-09, BIB-11, BIB-13, BIB-14, BIB-15, BIB-16 |
| **Q24** | (D1) Kế thừa theo chuỗi thay thế tới bản thay thế đã khoá mới nhất; (D2) giai đoạn theo Panel đi trong payload `syncScriptStructure`, không phải lệnh rời; (D3) lựa chọn bản của Writer (chương + Panel) thuộc `ScriptVersion` và mã băm, bản kế thừa thì không | BIB-11, BIB-12, BIB-13, BIB-14 |
| **Q20** | **Editor xác nhận = khoá Canon** (bỏ `WriterEndorsed`); Writer + Editor góp ý và yêu cầu vẽ lại; Artist trả lời; mỗi lần nộp concept là một **phiên bản**; Producer chỉ đọc Bible, chỉ chốt / mở lại kịch bản | BIB-10 |
| 1A | Chỉ bôi đen trên dòng Action, Caption (Lời dẫn), SFX; không trên tiêu đề Panel (`Panel.Direction`) và lời thoại | BIB-12, BIB-16 |
| 2A | Tham chiếu đi trong payload `BatchSaveScriptLines` (`refs[]`), không có lệnh bôi/gỡ rời | BIB-12, BIB-16 |
| 3A | Tính lại Danh sách thực thể chương trong transaction của `CommitScriptVersion` (3B — gộp 4 request lưu thành một endpoint — để sau, xem 01_SCRIPT_PLAN) | BIB-12 |
| 4A | `CreateStub` mô tả rỗng; `DefineBibleEntryCommand` được đặt tên stub đúng một lần, ghi đè revision v1; sau khi định nghĩa, tên bất biến; chặn nộp concept khi mục còn nháp | BIB-13, BIB-10 |
| 5A | Giữ unique `(script_line_id, bible_entry_id)`; mọi chỗ cùng `surface_text` trong dòng đều gạch chân | BIB-11, BIB-16 |
| 6A | `ScriptVersionRow.Refs`; băm chỉ nối `|refs:` khi dòng có tham chiếu (tương thích ngược) | BIB-12 |
| 7A | `is_crowd` bật/tắt bất kỳ lúc nào; `chapter_bible_bindings.is_crowd_at_bind` đóng băng theo chương lúc Gate 1 | BIB-11, BIB-13, BIB-14 |
| 8A → Q23 | Supersede: chương gắn bản cũ giữ bản cũ; chương gắn hoặc kế thừa bản mới chờ bản mới được khoá — **không tự chuyển** | BIB-09, BIB-13 |
| 9A | Bỏ `aliases` và bảng `bible_entry_names`; thêm `bible_entries.normalized_name` với unique `(series_bible_id, normalized_name)` để chống trùng tên và race khi tự tạo mục | BIB-09, BIB-12 |

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
| **BIB-03: FE đồng bộ hợp đồng backend** | FE merge `cf77e39`, `2b335f7`, `a6cb774` |
| **BIB-09: Cơ chế tên/bí danh cũ và biến thể tạo hình** | BE merge `ed02171` (commit `8909e52`, migration `20261114051740_AddSeriesBibleBindingsAndVariants`); phần bí danh/bảng tên đã bị quyết định 2026-11-14 thay bằng tên bất biến + `bible_entries.normalized_name` |
| **BIB-10: Duyệt concept theo phiên bản, Editor xác nhận = khoá Canon, góp ý toạ độ `bible_concept_comments`** | BE merge `e78858b` (`ff5b8d8`), FE merge `cf77e39` (`357cee5`), migration `20261114054042_AddBibleConceptVersionsAndComments` |
| **BIB-11: Bản đồ thực thể chương `chapter_bible_bindings`, biến thể theo Panel `panel_bible_variants`, cờ Quần chúng** | BE merge `ed02171` (`8909e52`) |
| **BIB-12: Tham chiếu `refs[]` trong payload lưu, tính lại Danh sách thực thể & kế thừa ở commit** | BE merge `37abe0f` (`109d6fa`), tích hợp lưu cả cây `0571fa7` (`7d3012e`) |
| **BIB-13: Lệnh Danh sách thực thể: Crowd, ChapterCastRevision, Define, CancelReplacement** | BE merge `f979fa9` (`0fc4bb3`, `316cdaf`) |
| **BIB-14: `ChapterCastGate` hai mốc Submit & Gate 1, đóng băng kịch bản, gỡ `bible-gate`** | BE merge `9c24b93` (`2cd50e9`, migration `20261114063622_AddChapterFrozenScriptVersionId`) |
| **BIB-15: Đọc Model Sheet theo Panel & binding (`GetPanelBible`); Model Sheet block bàn vẽ Artist Desk** | BE merge `a5a6d55` (`e1c2c9a`), FE merge `db5a007` (`4dae604`) |
| **BIB-16: Giao diện kịch bản nối Series Bible: mark `bibleRef`, bôi đen tham chiếu, Chapter Cast drawer, blockers list** | FE merge `215c516` (`4e68972`), `0740a2a` (`80ea7a6`), `016b307` (`b3025ba`) |
| **BIB-17: Gỡ bỏ cơ chế cũ không tương thích ngược (xoá `@mention`, era, link-bible-entries, `SpeakerCharacterId`, `/endorse`, `/lock`); test QA** | BE merge `95c98b9` (`2051754`), `50c2eb5` (`c9e4b4c`), `5a0f9a2` (`ec2c5e1`), `c65f9cf` (`b71095a`); FE merge `2b335f7` (`a55a012`), migration `20261114115859_RemoveLegacyBibleMechanisms` |
| **BIB-18: Tinh giản Schema `BibleEntry` & chuẩn hóa `BibleDetails` (Age & ArtistNotes)** | BE `SimplifyBibleEntrySchema`: bỏ `code`, `subtitle`, `priority`, `strict_check`, `is_active`, `aliases`; gộp `subtitle` vào `description`; chuẩn hóa `DetailsJson` qua `BibleDetailsParser`; bỏ lệnh `UpdateBibleEntryAliasesCommand`. Migration `20261126095525_SimplifyBibleEntrySchema` |
| **BIB-19: Cơ chế bảo vệ & quy trình duyệt Series Bible nâng cao** | BE commit `fe942cc`, FE commit `808dd3f9`: Soft endorsement cho Writer (`POST .../revisions/{revisionId}/endorse`), Cancel replacement (`POST .../revisions/{revisionId}/cancel-replacement`), ưu tiên `ReworkRequired` trong design queue, cấu hình `AllowSoloCreatorReview` trên Series cho studio 1 người. Migration `20261126035101_AddBibleWorkflowSafeguards` |

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
| **Thay bản đã khoá** | Writer | Bản `CanonLocked` cần sửa | `/supersede`: revision mới cùng biến thể; tạo từ màn kịch bản chương N thì chương N gắn luôn bản mới; bản cũ chỉ `Superseded` khi bản mới được khoá, chương đang gắn bản cũ không tự chuyển (Q23) |
| **Biến thể mới** | Writer | Nhân vật đổi tạo hình (lớn lên, đổi giáp, hồi tưởng) | Revision mới với `variant_label` khác, không gắn số chương |
| **Đổi bản cho chương / Panel** | Writer | Kịch bản chưa `Frozen` | Chọn bản bất kỳ của mục (kể cả chưa khoá) cho cả chương hoặc riêng các Panel; chương sau kế thừa bản của chương, không kế thừa bản theo Panel (Q23) |
| **Huỷ bản thay thế** | Writer | Bản thay thế chưa có sự kiện duyệt | Xoá bản; chương đang chờ quay về bản kế thừa (Q23) |

Ma trận chuyển trạng thái **sau BIB-10**: `SubmitConceptVersion: Draft | ReworkRequired | ConceptSubmitted` (mục `!IsStub`) · `RequestRework: ConceptSubmitted` · `ConfirmCanon: ConceptSubmitted`.

## 4. Task

### Backend còn lại

#### BIB-01 · Bản nháp không ghi đè thông tin Canon đang hiệu lực — BE + FE · ✅ · BE merge `66b80be`, `b90bde5`; FE merge `3a76596` · cũ B2/L1
- **Bối cảnh:** commit `2b43cc3` cố ý cho phép tạo revision mới trên giai đoạn đã khoá (bản mới đi lại luồng duyệt). Nhưng `GetCurrentRevision` lấy VersionNumber lớn nhất → `entry.Name/Description/ReferenceImageUrl` bị bản nháp ghi đè trong khi Canon vẫn là bản cũ.
- [x] **User chốt A (2026-11-14):** thông tin cấp mục dùng mô tả và ảnh của bản `CanonLocked` mới nhất, chưa `Superseded`, thuộc **biến thể mặc định**; fallback bản mới nhất khi mục chưa có Canon.
- [x] [BE] Chỉ cập nhật cache thông tin cấp mục khi một bản được khoá Canon. Tạo/sửa bản `Draft`, `ConceptSubmitted` hoặc `ReworkRequired` không được ghi đè tên, mô tả hay ảnh đang hiển thị của mục.
- [x] [FE] Khi có bản mới hơn Canon nhưng chưa khoá, giữ mô tả/ảnh Canon và hiện nhãn **`Có bản nháp vN`** qua `BibleEntryDto.latestDraftVersionNumber`.
- [x] Test: chưa có Canon dùng bản mới nhất; có Canon thì draft mới không đổi cache; khoá Canon cập nhật cache; bản `Superseded` không được chọn.

#### BIB-02 · Validate biến thể mới — BE · ✅ · merge `4e8fd57` · cũ B6/L6 · đổi theo Q16
- [x] `variant_label` (cột `StageName` hiện có) bắt buộc khi tạo biến thể mới, không trùng nhãn biến thể khác còn hiệu lực của cùng mục → 409. Bỏ kiểm "`from` không trùng chương bắt đầu".
- [x] Đổi `variant_label` trong bản sửa nội dung không được tách biến thể (xác minh chặn đổi).
- [x] Test.

### Frontend (làm theo thứ tự)

#### BIB-03 · Theo kịp hợp đồng backend — FE · ✅ · cũ bước 2 (merge `cf77e39`, `2b335f7`, `a6cb774`)
- [x] `services/bible.service.ts` + types theo DTO hiện tại; bỏ 8 chỗ `(item as any).status` và so sánh số (backend dùng `JsonStringEnumConverter`).
- [x] Nộp concept từ hàng đợi gửi `revisionId`; key danh sách hàng đợi theo `revisionId`.
- [x] Quyền nút theo Q20: **Xác nhận (= khoá Canon) chỉ Editor**, cho cả Nhân vật/Địa điểm/Đạo cụ; Yêu cầu vẽ lại cho Writer + Editor + Producer (Q22); Producer không thấy nút xác nhận/khoá.
- [x] `typecheck`.

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

#### BIB-10 · Editor xác nhận = khoá Canon; phiên bản concept & góp ý có trả lời — DB + BE + FE · ✅ · Q20 (BE merge `e78858b`, FE merge `cf77e39`, migration `20261114054042_AddBibleConceptVersionsAndComments`)
- **Bối cảnh code:** mỗi lần nộp concept hiện đã ghi một `BibleRevisionEvent` loại `ConceptSubmitted` kèm ảnh (`BibleEntryRevision.SubmitConcept`), `ConceptImageUrl` là ảnh của sự kiện mới nhất. Enum `BibleRevisionStatus` còn `WriterEndorsed = 4`; `/endorse` cho Writer + Editor, `/lock` cho Producer.
- [x] [DB + BE] **Phiên bản concept = sự kiện `ConceptSubmitted`** (đã bất biến): thêm `concept_version_number INT NULL` (tăng dần theo revision) và `asset_sha256 VARCHAR(64) NULL` vào `bible_revision_events`; `bible_entry_revisions.current_concept_event_id UUID NULL` trỏ phiên bản đang nộp. Migration điền số phiên bản cho sự kiện cũ theo thứ tự thời gian.
- [x] [DB + BE] Góp ý có trả lời — bảng mới:
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
- [x] [BE] **Bỏ `WriterEndorsed`** (Q20): `Endorse` + `Lock` gộp thành `ConfirmCanon(editorId, conceptEventId)`: chỉ từ `ConceptSubmitted`, `conceptEventId` phải là phiên bản đang nộp (409 nếu Artist vừa nộp bản mới), Editor khác Artist đã nộp phiên bản đó (BR-06 → 403) → `CanonLocked` + sự kiện `Locked`. Migration dữ liệu: revision đang `WriterEndorsed` → `ConceptSubmitted` (Editor xác nhận lại); xoá giá trị enum, gỡ luật "người đã xác nhận không tự khoá".
- [x] [BE] Endpoint: `/endorse` + `/lock` → `POST .../revisions/{revisionId}/confirm` (chỉ **Editor**). `/request-rework` cho **Writer + Editor + Producer** (Q22), bắt buộc nhận xét; ghi thêm một góp ý gốc gắn phiên bản đang nộp để hiện trong luồng hội thoại.
- [x] [BE] Nộp concept (4A): `409` khi `entry.IsStub` hoặc mô tả revision rỗng ("Thực thể chưa được Writer viết định nghĩa"). Nộp từ `ConceptSubmitted` (Artist tự thay ảnh trước khi được xác nhận) = phiên bản mới.
- [x] [BE] Quyền tạo mục, tạo revision chữ, `/supersede`: chỉ **Writer** (bỏ Producer, Q19/Q20).
- [x] [FE] Màn duyệt concept: ảnh phiên bản đang nộp + chọn phiên bản cũ để so sánh cạnh nhau; luồng góp ý theo phiên bản (khoanh vùng trên ảnh, trả lời, đánh dấu đã xử lý). Editor: nút "Xác nhận & khoá Canon" + "Yêu cầu vẽ lại"; Writer: góp ý + "Yêu cầu vẽ lại"; Artist: trả lời + nộp phiên bản mới; Producer: xem + "Yêu cầu vẽ lại" (Q22).
- [x] [Docs] Đã sửa spec §5.1, §5.2 máy 1, glossary §3.3, chuẩn đặt tên §5.3 (2026-11-14).
- [x] Test: Writer gọi `/confirm` → 403; Producer gọi `/confirm`, `/supersede`, góp ý gốc → 403, `/request-rework` → thành công (Q22); Editor xác nhận phiên bản cũ → 409; Editor là Artist nộp → 403; Editor xác nhận → `CanonLocked`; trả lời góp ý không đổi trạng thái; nộp concept khi `IsStub` → 409; migration `WriterEndorsed` → `ConceptSubmitted`.

### Nối Bible với luồng sản xuất (Q16, Q19)

> **Bối cảnh (rà soát 2026-11-13):** D11 bỏ `@mention` và người nói từ Bible → `CheckChapterBibleGateQuery` luôn trả `IsPassed = true`, `FreezeChapterScriptCommand` không gọi gate; BR-21 không được thực thi, `GetPanelBible` không còn dữ liệu (và chưa màn FE nào gọi). **Thứ tự:** xem [Luồng triển khai BE → FE](#luồng-triển-khai-be--fe) cuối mục 4. **Điều kiện trước:** [SCR-11](01_SCRIPT_PLAN.md) (chặn Producer sửa kịch bản) xong trước BIB-12.
>
> **Luồng lưu kịch bản hiện tại (FE `ScriptEditorView.handleSaveScript`)** gồm 4 request rời: `batchSave` (dòng) → `syncScriptStructure` (Trang/Panel, ghép Panel theo **số thứ tự**, xoá mềm Panel thừa) → `updatePanelDirection` × N → `commitScriptVersion`. Vì vậy tham chiếu đi cùng `batchSave` (2A), giai đoạn theo Panel đi cùng `syncScriptStructure` (Q24), và **tính lại Danh sách thực thể chương trong `ScriptSnapshotBuilder.CommitAsync`** — hàm dùng chung cho Lưu (`CommitScriptVersionCommand`) và Gửi duyệt (`SubmitScriptCommand`) — khi đã đủ dòng, Trang, Panel (3A).

#### BIB-09 · Tên bất biến, unique tên chuẩn hoá & biến thể tạo hình — DB + BE · 🟡 · Q16, Q23, 9A (phần cũ merge `ed02171`, quyết định không bí danh đang triển khai)
- [ ] [DB] Xoá `bible_entries.aliases` và bảng `bible_entry_names`; thêm `bible_entries.normalized_name VARCHAR(200) NOT NULL` cùng unique `(series_bible_id, normalized_name)`.
- [ ] [DB] Mô hình đích (9A):
  ```sql
  ALTER TABLE bible_entries
    ADD COLUMN normalized_name VARCHAR(200) NOT NULL,
    ADD CONSTRAINT uq_bible_entries_series_normalized_name
      UNIQUE (series_bible_id, normalized_name);
  ```
  `normalized_name` được ghi cùng transaction khi tạo mục hoặc khi Writer đặt tên stub lúc định nghĩa. Không giữ dữ liệu hay hợp đồng bí danh cũ.
- [x] [BE] `BibleNameNormalizer.Normalize(s)`: trim → gộp khoảng trắng → Unicode NFC → `ToLowerInvariant()`. Dùng chung cho `bible_entries.normalized_name` và `SpeakerResolver` (BIB-12).
- [ ] [BE] Tên mục bất biến sau khi tạo. Ngoại lệ duy nhất: Writer được đặt lại tên stub đúng một lần trong `DefineBibleEntryCommand`; sau đó tên bất biến. Create/Update/Define không nhận `aliases`.
- [ ] [BE] Tạo mục trùng `normalized_name` trong cùng Series → 409 kèm tên mục bị trùng. Tự tạo mục nháp khi lưu (BIB-12) gặp vi phạm unique (`23505`) → nạp lại mục vừa được giao dịch kia tạo và dùng mục đó, không báo lỗi.
- [x] [BE] Dùng `StageName` hiện có làm `variant_label` (DTO đổi tên trường thành `variantLabel`, giữ tên cột); biến thể mặc định = bản đầu tiên của mục (`IsDefaultVariant` tính toán). `EffectiveFrom/ToChapterNumber` không còn dùng để chọn bản (gỡ cột ở BIB-17).
- [x] [BE] `/supersede` chỉ thay bản **cùng biến thể** (Q23): **sửa `AddBibleEntryRevisionCommand`** — hiện gọi `MarkSuperseded` ngay khi tạo bản thay thế; đổi thành ghi `supersedes_revision_id` trên bản mới, bản cũ vẫn `CanonLocked` dùng được. Nhận thêm `chapterId` (tuỳ chọn): tạo từ màn kịch bản chương N thì gắn luôn bản mới cho chương N (`chosen_by_writer = true`). Khi bản thay thế được Editor khoá (BIB-10 `ConfirmCanon`) chỉ ghi sự kiện `Superseded` cho bản cũ — **không** chuyển binding của chương nào. Lệnh `CancelReplacementRevision` (Writer): xoá bản thay thế chưa có sự kiện ngoài `Created`; binding đang trỏ bản đó về bản kế thừa. Tạo biến thể mới = `AddBibleEntryRevision` với nhãn khác, không supersede.
- [ ] Test: trùng tên chuẩn hoá trả 409, hai giao dịch cùng tự tạo "Hắc Long" chỉ ra một mục, tên chỉ đổi được một lần khi định nghĩa stub, tên mục đã định nghĩa không đổi được; giữ các test supersede, huỷ bản thay thế và nhiều biến thể cùng `CanonLocked`.

#### BIB-11 · Bản đồ thực thể chương, bảng tham chiếu & cờ Quần chúng — DB + BE · ✅ · Q16, 5A, 7A (BE merge `ed02171`, commit `8909e52`, migration `20261114051740_AddSeriesBibleBindingsAndVariants`)
- [x] [DB] Bản đồ thực thể chương:
  ```sql
  CREATE TABLE chapter_bible_bindings (
    chapter_id               UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    bible_entry_id           UUID NOT NULL REFERENCES bible_entries(id) ON DELETE RESTRICT,
    bound_revision_id        UUID NULL REFERENCES bible_entry_revisions(id) ON DELETE RESTRICT,
    source                   VARCHAR(16) NOT NULL CHECK (source IN ('Speaker','Highlight')),
    chosen_by_writer         BOOLEAN NOT NULL DEFAULT false,  -- true = Writer tự chọn bound_revision_id; false = bản kế thừa (Q23)
    -- (bound_revision_id là bản cụ thể, có thể chưa khoá — Q23)
    is_crowd_at_bind         BOOLEAN NOT NULL DEFAULT false,
    bound_by                 UUID NULL,
    bound_at                 TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (chapter_id, bible_entry_id)
  );
  CREATE INDEX ix_chapter_bible_bindings_entry ON chapter_bible_bindings(bible_entry_id);
  CREATE INDEX ix_chapter_bible_bindings_revision ON chapter_bible_bindings(bound_revision_id);
  ```
  - `source`: `Speaker` (người nói tự khớp hoặc tự tạo) | `Highlight` (Writer bôi đen). Một mục có cả hai nguồn thì giữ `Speaker`.
  - **Bản kế thừa (Q23, Q24):** khi `chosen_by_writer = false`, `bound_revision_id` = bản mà **chương gần nhất phía trước cùng Series** (theo `ChapterNumber`, kiểu decimal) có thực thể đó đang gắn; nếu bản đó đã bị thay bằng một bản `CanonLocked` thì đi theo chuỗi `supersedes_revision_id` tới bản thay thế đã khoá mới nhất (bản thay thế đang duyệt không tính). Chưa có chương nào thì bản `CanonLocked` mới nhất (chưa `Superseded`) của biến thể mặc định, chưa có bản khoá thì bản mới nhất của biến thể mặc định. Tính lại mỗi lần commit, mỗi khi chương phía trước đổi bản và mỗi khi một bản thay thế được khoá, **cho tới khi chương `Frozen`**; chương đã chốt (kể cả khi được mở lại) không tự kế thừa lại. Chiều ngược lại không bao giờ đổi.
  - `bound_revision_id` có thể là bản chưa khoá (giai đoạn mới, bản thay thế v2) → chương chờ; Gate 1 bắt buộc mọi bản chương dùng `CanonLocked` cho mục `is_crowd_at_bind = false`. Không có luật "khoá bản mới thì tự chuyển".
  - `is_crowd_at_bind` (7A): chương chưa `Frozen` luôn đồng bộ theo `bible_entries.is_crowd`; Gate 1 đóng băng giá trị.
  - Binding được **tính lại từ kịch bản** mỗi lần commit (BIB-12): thêm dòng cho mục mới xuất hiện, xoá dòng cho mục không còn được nhắc; giữ `bound_revision_id` của dòng `chosen_by_writer = true`, tính lại bản kế thừa cho dòng còn lại.
- [x] [DB] Bản theo Panel (Q23) — giai đoạn khác trong cùng chương (hồi tưởng):
  ```sql
  CREATE TABLE panel_bible_variants (
    panel_id        UUID NOT NULL REFERENCES panels(id) ON DELETE CASCADE,
    bible_entry_id  UUID NOT NULL REFERENCES bible_entries(id) ON DELETE RESTRICT,
    revision_id     UUID NOT NULL REFERENCES bible_entry_revisions(id) ON DELETE RESTRICT,
    set_by          UUID NOT NULL,
    set_at          TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (panel_id, bible_entry_id)
  );
  ```
  **Ghi từ payload lưu (Q24):** `syncScriptStructure` nhận `panels[].castRevisions[{ bibleEntryId, revisionId }]`; trong cùng transaction ghi lại toàn bộ dòng của các Panel được giữ và **xoá dòng của Panel bị xoá mềm** (FK cascade không chạy với xoá mềm). Vì FE gửi theo nội dung Panel nên chèn/đổi thứ tự Panel không làm lệch. Panel không có dòng dùng `bound_revision_id` của chương. Không kế thừa sang chương sau. Khoá cùng kịch bản ở Gate 1. Chỉ Writer (payload của Producer có `castRevisions` → 403); thực thể phải có trong chương, bản phải thuộc mục và chưa `Superseded`.
- [x] [DB] Bảng tham chiếu (5A): **giữ** `script_line_bible_links` và unique `(script_line_id, bible_entry_id) WHERE is_deleted = false` — mỗi dòng tham chiếu một mục tối đa một lần. Đổi `raw_mention_text varchar(100)` → `surface_text varchar(200) NOT NULL` (migration điền từ tên mục khi null). `resolved_revision_id` gỡ ở BIB-17.
- [x] [DB] `bible_entries.is_crowd BOOLEAN NOT NULL DEFAULT false`.
- [x] [BE] Dùng lại `BibleEntry.CreateStub/IsStub` cho mục tự tạo; **sửa `CreateStub`**: `Description = ""` (bỏ câu "Thực thể tạm thời… '@Tên'"), `snapshotJson` của revision v1 bỏ `EffectiveFromChapterNumber`.
- [x] [BE] Entity + configuration + migration (có `Down`); `DeleteBibleEntry` trả 409 khi mục đang được chương nào gắn hoặc còn tham chiếu.
- [x] [BE] Bản đồ chỉ đổi được khi `chapter.ScriptStatus != Frozen` và chương `IsContentEditable` (409 ngược lại), trừ cột `is_crowd_at_bind` của chương chưa chốt (đồng bộ tự động).

#### BIB-12 · Tham chiếu trong payload lưu & tính lại Danh sách thực thể ở commit — BE · ✅ · 1A, 2A, 3A, 6A (BE merge `37abe0f`, tích hợp lưu cả cây `0571fa7`)
- [x] [BE] **Payload `BatchSaveScriptLines` / `SaveChapterScript`** (2A): mỗi dòng có `refs: [{ surfaceText, bibleEntryId?, newDraft?: { name, category } }]`, thay trường `BibleEntryIds` cũ.
  - Chỉ chấp nhận trên dòng `Action`, `Narration` (Caption), `Sfx` (1A); dòng khác có `refs` → 400.
  - `surfaceText` phải có trong chữ của dòng (so sau chuẩn hoá) → ngược lại bỏ tham chiếu và trả cảnh báo.
  - `bibleEntryId`: mục Nhân vật/Địa điểm/Đạo cụ cùng Series, đang hoạt động. `newDraft`: tạo mục `Draft` (`CreateStub`, `IsStub = true`, mô tả rỗng) qua unique `(series_bible_id, normalized_name)` trên `bible_entries` (tên đã có → dùng mục có sẵn) rồi gắn.
  - Hai `refs` cùng mục trong một dòng → gộp một (5A).
  - Chỉ **Writer** (Producer 403, BR-07/Q19; khớp SCR-11).
- [x] [BE] Chữ của dòng đổi mà không gửi lại `refs`: giữ tham chiếu cũ nếu `surface_text` còn trong chữ mới, không còn → gỡ và trả cảnh báo trong kết quả lưu để FE báo Writer.
- [x] [BE] **Payload `syncScriptStructure` / `SaveChapterScript`** (Q24): mỗi Panel thêm `castRevisions[]` (xem BIB-11); `ScriptStructurePanel` thêm trường, FE gửi theo Panel trong tài liệu.
- [x] [BE] **`ChapterCastService.RecomputeAsync` chạy trong `ScriptSnapshotBuilder.CommitAsync`** (3A; dùng chung cho Lưu và Gửi duyệt, cùng transaction), theo thứ tự — chạy cả khi nội dung trùng bản trước (không tạo phiên bản mới nhưng vẫn tính lại):
  1. `SpeakerResolver` (hàm thuần): bỏ hậu tố `(nghĩ)` rồi chuẩn hoá `SpeakerLabel` của dòng `Dialogue` **và `Thought`** bằng `BibleNameNormalizer`; chỉ khớp **nguyên chuỗi** với `bible_entries.normalized_name` của mục **Nhân vật**. Không khớp tên mục thì luôn tạo mục Nhân vật `Draft` mới (`CreateStub`, tên = nhãn đã bỏ `(nghĩ)`, xử lý `23505` theo 9A); trùng nhãn trong cùng lần commit chỉ tạo một mục. Audit "tự tạo từ người nói, chương N". Không quét chữ trong mô tả/lời dẫn/SFX.
  2. Tổng hợp người nói + `script_line_bible_links` + `panel_bible_variants` → đồng bộ `chapter_bible_bindings` (bản kế thừa theo BIB-11, cập nhật `is_crowd_at_bind`), rồi tính lại dây chuyền bản kế thừa cho các chương phía sau chưa `Frozen`.
  3. Dọn mục thừa: `IsStub`, hệ thống tạo, không còn binding và tham chiếu nào, chỉ có sự kiện `Created` → xoá.
  4. Chụp `ScriptVersion` và tính mã băm.
- [x] [BE] Commit chỉ **Writer** (hiện cho cả Producer ở `ScriptVersionFeatures.cs:218`) vì commit giờ có thể tạo mục Bible.
- [x] [BE] **Phiên bản & mã băm (6A, Q24):** `ScriptVersionRow` thêm `Refs: [{ EntryId, SurfaceText }]` cho dòng và `CastRevisions: [{ EntryId, RevisionId }]` cho hàng `panel`; snapshot thêm khối `castChoices` = các dòng `chosen_by_writer = true` của chương. Chuỗi băm giữ nguyên `Type|Page|Panel|Label|Text`, **chỉ nối thêm** `|refs:…` / `|cast:…` (sort theo GUID) khi có, và một dòng `chapter-cast|…` khi chương có lựa chọn của Writer → chương không có các thứ này giữ nguyên mã băm cũ. Bản kế thừa không vào mã băm. Diff giữa hai lần gửi hiện thêm/gỡ tham chiếu và đổi bản.
- [x] [BE] `GET /api/chapters/{id}/cast`: mỗi thực thể kèm nguồn (Người nói/Bôi đen), trạng thái Bible (chờ định nghĩa / chờ Artist / chờ xác nhận / `CanonLocked`), `isCrowd`, `boundRevision` (bản, biến thể, trạng thái), `chosenByWriter` / `inheritedFromChapter`, các bản theo Panel (`panelRevisions[]`), mọi bản của mục để chọn, danh sách dòng/Panel nhắc tới; và `submitGate { canSubmit, blockers[] }` (chờ định nghĩa) + `gate { canStart, blockers[] }` (bản chưa khoá, kèm nguồn kế thừa).
- [ ] Test: chỉ khớp tên mục, `Minh (nghĩ)`, dòng `Thought`, tên có dấu viết hoa khác nhau, nhãn khác tên tạo draft mới, tự tạo một lần cho nhiều dòng cùng tên, dọn mục thừa, `refs` trên dòng thoại → 400, tham chiếu bị gỡ khi sửa chữ, chèn Panel giữa chừng giữ đúng giai đoạn theo Panel, hash chương không có tham chiếu/lựa chọn không đổi so với trước, đổi bản Writer chọn sau khi gửi → bản hiện tại ≠ bản đã gửi.
- [x] *(3B đã hoàn thành ở SCR-14)* Gộp 4 request lưu thành một endpoint `SaveScript` / `SubmitScript` một transaction.

#### BIB-13 · Lệnh Danh sách thực thể & kế thừa bản — BE · ✅ · Q18, Q19, Q23, Q24, 4A, 7A (BE merge `f979fa9`)
- [x] [BE] `SetBibleEntryCrowdCommand(entryId, bool)` — **chỉ Writer**, bất kỳ lúc nào (7A); cập nhật `is_crowd_at_bind` cho mọi chương chưa `Frozen` có mục đó. Chương đã chốt không đổi.
- [x] [BE] `SetChapterCastRevisionCommand(chapterId, entryId, revisionId | null)` — **chỉ Writer**, kịch bản chưa `Frozen`; bản phải thuộc mục, chưa `Superseded` (**không bắt buộc đã khoá**) → `bound_revision_id`, `chosen_by_writer = true`; `null` → về bản kế thừa. Kết quả trả: các chương phía sau chưa chốt sẽ kế thừa theo, và **cảnh báo** các chương phía sau đã chốt với bản khác (không chặn). Tính lại bản kế thừa của các chương sau; Audit.
- [x] ~~`SetPanelCastRevisionCommand`~~ — bỏ theo Q24: giai đoạn theo Panel đi trong payload `syncScriptStructure` / `SaveChapterScript` (BIB-11, BIB-12).
- [ ] [BE] `DefineBibleEntryCommand(entryId, name, description, details…)` chỉ Writer (Q19), mục `IsStub = true`: mô tả bắt buộc; Writer được đặt tên stub đúng một lần, phải qua unique `normalized_name`; sinh mã chuẩn thay `STUB_xxxx`; `PromoteFromStub()`; **ghi đè revision v1 `Draft`** hiện có (không tạo v2). Sau đó tên bất biến và mục vào hàng đợi Artist.
- [x] Bốn lệnh `SetBibleEntryCrowd`, `SetChapterCastRevision`, `DefineBibleEntry`, `CancelReplacementRevision` (BIB-09): Producer và vai trò khác → 403. Không có lệnh bôi/gỡ tham chiếu rời (2A), không có lệnh gắn tay (gắn là tự động). `SetChapterCastRevision` làm đổi mã băm (Q24) → nếu kịch bản đang `InReview`, Writer phải gửi duyệt lại trước khi Producer chốt.
- [x] **`ChapterCastService.ResolveInheritedAsync`** (Q23, Q24; dùng chung cho commit, đổi bản, khoá bản thay thế): dòng `chosen_by_writer = false` lấy bản của chương gần nhất phía trước cùng Series có thực thể, đi theo chuỗi thay thế tới bản đã khoá mới nhất; tính lại dây chuyền cho các chương sau chưa `Frozen`. Không cần Writer xác nhận (Q22).
- [x] Khi Editor khoá Canon một bản (BIB-10) → binding Writer đã chọn **không đổi**; các chương đang gắn bản đó hết vướng Gate 1. Nếu bản vừa khoá là bản thay thế → bản cũ thành `Superseded`; chạy lại `ResolveInheritedAsync` cho các chương chưa `Frozen` **đang kế thừa** (D1/Q24) — chương Writer tự chọn bản cũ và chương đã chốt giữ nguyên.
- [x] Hàng đợi thiết kế (`GetBibleDesignQueueQuery`): chỉ mục `IsVisualDesign`, không `IsStub`, không `is_crowd`; kèm các chương đang chờ mục đó để Artist ưu tiên.
- [x] Test mỗi lệnh: thành công, 403 (Producer), 409 (Frozen, bản không thuộc mục, bản `Superseded`, sai Series, Define trên mục đã định nghĩa); chọn bản chưa khoá → chương chờ, khoá xong hết vướng; bật Quần chúng không đổi chương đã chốt; khoá bản thay thế → chương đang kế thừa chuyển sang bản mới, chương Writer tự chọn bản cũ giữ nguyên; huỷ bản thay thế → chương đang chờ về bản kế thừa.

#### BIB-14 · Chốt Bible khi Gửi duyệt & tại Gate 1 — BE · ✅ · Q16, Q21, 7A · thay `CheckChapterBibleGateQuery` (BE merge `9c24b93`, migration `20261114063622_AddChapterFrozenScriptVersionId`)
> *Ghi chú:* endpoint `bible-gate` và các legacy endpoints đã bị gỡ bỏ hoàn toàn (quy tắc không tương thích ngược, 2026-11-14).
- [x] [BE] `ChapterCastGate` — một nguồn luật cho `GET /cast`, Gửi duyệt và Gate 1, hai mức (Q21):
  - `EvaluateSubmitAsync` (**Gửi duyệt / Gửi duyệt lại**, `SubmitScriptCommand` / `SubmitChapterScriptCommand`): chặn khi còn mục `is_crowd_at_bind = false` mà `IsStub` (chờ định nghĩa) hoặc chưa có `bound_revision_id` (mục chưa có bản nào). Không đòi xác nhận bản (Q22), không đòi ảnh `CanonLocked` ở mốc này. Vi phạm → 409 kèm danh sách.
  - `EvaluateStartAsync` (**Gate 1**): toàn bộ điều kiện Gửi duyệt + **mọi bản chương dùng** — `bound_revision_id` của chương và `revision_id` trong `panel_bible_variants` của các Panel chương — đã `CanonLocked` (bỏ qua mục `is_crowd_at_bind`). Bản chưa khoá thì chặn, kèm nguồn ("chờ Naruto Mặc định v2, kế thừa từ chương 2"), không rơi về bản cũ. Tính lại bản đồ từ **bản đã gửi** ngay lúc chốt.
- [x] [BE] `FreezeChapterScriptCommand` gọi gate trước khi `StartProduction`; vi phạm → 409 kèm danh sách (tên, biến thể, lý do: chờ định nghĩa / biến thể chờ Artist vẽ / chờ Editor xác nhận). Thành công → đóng băng `is_crowd_at_bind` và `bound_revision_id`.
- [x] [BE] Chốt lại sau khi Producer mở lại: binding đổi `bound_revision_id`, giai đoạn theo Panel đổi, hoặc thêm/bớt thực thể → gắn ⚑ các Panel có dòng nhắc tới thực thể đó (hoặc Panel có giai đoạn bị đổi), dùng chung cơ chế với [SCR-01](01_SCRIPT_PLAN.md).
- [x] [BE] `ChapterSnapshotBuilder` (Gate 3) ghi bản đồ thực thể vào manifest (mục, bản, mã băm Model Sheet) kèm giai đoạn theo Panel; phần kịch bản ghi `frozen_script_version_id` thay `ContentRevision` mới nhất từng Scene (Q25/Q26, [SCR-41](01_SCRIPT_PLAN.md)); bỏ đoạn đọc Bible theo era (`EffectiveFromChapterNumber`, khoảng dòng 74). Cùng đợt: đổi `pages.GetAsync(...).Version` (replay toàn bộ event) sang đọc version stream nhiều trang một query, giữ nghĩa `-1` cho trang chưa có event (VERSION_REVIEW mục 5).
- [x] Xoá `CheckChapterBibleGateQuery` + endpoint `bible-gate`; FE `ScriptReviewView` và `roles/editor/views/script-review/ChecksTab.tsx` (đang đọc `ChapterBibleGateResultDto`) chuyển sang `GET /cast`.
- [x] Test: Gửi duyệt khi còn mục nháp → 409, gắn cờ Quần chúng → qua; Writer không đổi bản → Gửi duyệt qua với bản kế thừa; Ch1 chốt với v1 → Writer tạo v2 từ Ch2 → Ch2 Gate 1 409 tới khi Editor khoá v2, Ch3 kế thừa v2, Ch1 giữ v1; Panel hồi tưởng đặt "Lúc nhỏ" v1 chưa khoá → Gate 1 409; đủ điều kiện → Frozen + binding khoá; sửa binding khi Frozen → 409; mở lại Ch1 không tự kế thừa v2; gỡ cờ Quần chúng sau Gate 1 không mở lại vướng của chương đã chốt.

#### BIB-15 · Bàn vẽ, AI và kiểm tra nhất quán đọc theo binding — BE + FE · ✅ · Q16 (BE merge `a5a6d55`, FE merge `db5a007`)
- [x] [BE] `GetPanelBible`: lấy bản của từng thực thể trong Panel — `panel_bible_variants` nếu Panel có bản riêng, ngược lại `chapter_bible_bindings.bound_revision_id` — lọc theo thực thể có dòng nhắc tới trong Panel (người nói hoặc bôi đen), trả Model Sheet của bản đó; mục `is_crowd_at_bind` không hiện.
- [x] [BE] `ConsistencyChecker`, context AI (`AiWorkflowFacts`, Writer/Artist Agent), `GetBibleEntriesAtChapterQuery`: thay `EffectiveRevisionAt(N)` bằng binding của chương; chương chưa qua Gate 1 dùng bản tự gắn hiện tại.
- [x] [FE] Bàn vẽ: thêm khối Model Sheet theo Panel đang chọn ở `ArtistDeskView` / `workspace/ScriptReaderColumn.tsx` (ảnh, tên, biến thể, bản; nhãn "Hồi tưởng · Lúc nhỏ v1" khi Panel có giai đoạn riêng).
- [x] Test: chương 5 giữ bản cũ sau khi bản thay thế được khoá; Panel hồi tưởng hiện Model Sheet "Lúc nhỏ", Panel khác hiện "Mặc định" trong cùng chương.

#### BIB-16 · Giao diện Danh sách thực thể chương & bôi đen — FE · 🟡 · cập nhật quyết định tên/BIB-01 đang triển khai · Q16, Q19, 1A, 2A, 5A (nền cũ merge `215c516`, `0740a2a`, `016b307`)
- [ ] [FE] Editor kịch bản (chỉ Writer): node `scriptLine` (`flow/nodes/ScriptLineBlockNode.ts`) thêm mark `bibleRef` (attrs `entryId`, `surfaceText`) và chỉ cho phép trên dòng `el = action | caption | sfx`. Bôi đen → menu nổi "Tham chiếu Series Bible" (ô tìm theo tên mục) + "Tạo bản nháp" khi chưa có (tên điền sẵn, chọn loại, một bước, không bắt nhập mô tả).
- [x] [FE] Lưu tham chiếu qua `scriptFlowAdapter`: mark → `refs[{ surfaceText, bibleEntryId | newDraft }]` trong payload lưu. Mọi chỗ cùng `surfaceText` trong dòng đều gạch chân (5A); hover hiện tên mục, có nút gỡ. Báo khi kết quả lưu trả cảnh báo mất tham chiếu.
- [ ] [FE] Ô người nói: gợi ý đúng tên mục Bible khi gõ (không bắt buộc chọn); sau khi bỏ `(nghĩ)` và chuẩn hoá, nhãn không bằng tên mục nào thì hiện chip "Sẽ tạo bản nháp".
- [x] [FE] Ngăn phải `ScriptEditorView` / Chapter Cast drawer: danh sách thực thể (nguồn, trạng thái Bible, bản đang gắn kèm nhãn "Kế thừa từ chương N" hoặc "Writer chọn"; ô chọn bản gồm mọi biến thể/bản của mục, kể cả chưa khoá, có nút "Về bản kế thừa"; khi đổi hiện danh sách chương phía sau sẽ kế thừa và cảnh báo chương đã chốt lệch bản; nút **Quần chúng**; nút "Viết định nghĩa" với mục nháp; nút "Tạo bản thay thế" / "Huỷ bản thay thế") — **thao tác chỉ hiện với Writer**, vai trò khác chỉ xem; bấm thực thể → nhảy tới dòng/Panel.
- [x] [FE] **Giai đoạn theo Panel** (Q24): chọn một hoặc nhiều Panel → "Đặt giai đoạn cho Panel" (chọn thực thể + bản); lưu như thuộc tính của dòng `panel` trong tài liệu editor, `scriptFlowAdapter` đưa vào `panels[].castRevisions` của payload lưu; Panel có giai đoạn riêng hiện nhãn nhỏ cạnh tiêu đề (ví dụ "Naruto · Lúc nhỏ v1"). Đổi giai đoạn = có thay đổi chưa lưu, như sửa chữ.
- [x] [FE] Nút **Gửi duyệt** của Writer hiện danh sách việc còn thiếu từ `submitGate.blockers` (viết định nghĩa / gắn Quần chúng), khoá nút khi `canSubmit = false`. Nút **Bắt đầu sản xuất** (và tab Gate 1 của [ASG-01](03_ASSIGNMENT_PLAN.md)) hiện `gate.blockers` (biến thể chưa khoá), khoá nút khi `canStart = false`.
- [ ] [FE] Form mục Bible: bỏ ô bí danh; tên chỉ cho nhập khi tạo, hoặc đặt đúng một lần khi Writer định nghĩa stub, sau đó chỉ đọc. Nhãn biến thể thay cho "chương bắt đầu/kết thúc", có cờ Quần chúng; hàng đợi thiết kế hiện "Chương đang chờ". Chi tiết mục giữ mô tả/ảnh Canon và hiện **`Có bản nháp vN`** khi có bản mới hơn chưa khoá.
- [x] [FE] Bỏ UI era (chương hiệu lực), `@mention`. i18n vi/en; test.

#### BIB-17 · Gỡ cơ chế cũ — BE + FE + DB + QA · ✅ · sau BIB-14/15/16 (BE merge `95c98b9`, `50c2eb5`, `5a0f9a2`, `c65f9cf`; FE merge `2b335f7`, migration `20261114115859_RemoveLegacyBibleMechanisms`)
- [x] [BE] Gỡ `ScriptLine.SpeakerCharacterId` + `ValidateSpeakerAsync`, `LinkBibleEntriesCommand` + endpoint, trường `BibleEntryIds` của payload lưu (thay bằng `refs`), `EffectiveRevisionAt`, `DeleteBibleEntryEraCommand` + endpoint `eras`, cột `EffectiveFrom/ToChapterNumber`, cột `script_line_bible_links.resolved_revision_id`, endpoint `/endorse` + `/lock` cũ (sau BIB-10). Migration có `Down`. **Giữ** `script_line_bible_links` (mở rộng ở BIB-11) và `CreateStub/IsStub/PromoteFromStub`.
- [x] [FE] Gỡ `@tiptap/extension-mention` và code gọi các endpoint trên.
- [x] [QA] Viết bộ test case Series Bible mới theo Q16–Q24: người nói tự khớp/tự tạo (thoại + suy nghĩ), bôi đen (đúng loại dòng), Quần chúng, định nghĩa mục nháp, phiên bản concept + góp ý/trả lời, Editor xác nhận = khoá, Producer yêu cầu vẽ lại, bản kế thừa Ch1–Ch3, giai đoạn theo Panel, supersede/huỷ bản thay thế, Gửi duyệt và Gate 1.
- [x] Mục "ép `ChapterNumber` decimal về int" ở rà soát 2026-11-13 tự hết khi gỡ `EffectiveRevisionAt`.

#### BIB-18 · Đóng băng SubmittedScriptManifest khi nộp kịch bản & kiểm tra Gate 1 (D2) — DB + BE + FE · ❌
- [ ] [DB] Tạo bảng `submitted_script_manifests` (`id UUID PRIMARY KEY`, `chapter_id UUID NOT NULL`, `script_version_id UUID NOT NULL`, `script_content_hash VARCHAR(64) NOT NULL`, `submitted_at TIMESTAMPTZ NOT NULL`, `submitted_by UUID NOT NULL`, `bible_manifest_json JSONB NOT NULL`). Trong đó `bible_manifest_json` lưu mảng `[{ entry_id, entry_name, variant_label, canon_version_id, content_hash }]` (Quyết định 2026-11-15 (D2)).
- [ ] [BE] Trong lệnh `SubmitChapterScriptCommand`: tạo bản ghi `SubmittedScriptManifest` đóng băng SHA-256 của `ScriptVersion` cùng danh sách các mục Bible và mã băm tương ứng tại thời điểm Writer bấm Nộp.
- [ ] [BE] Trong lệnh `FreezeChapterScriptCommand` (Gate 1): so sánh trạng thái hiện tại của các mục Bible với bản ghi `SubmittedScriptManifest`. Nếu có mục Bible bị thay đổi bản ghi Canon hoặc thay đổi nội dung sau thời điểm nộp kịch bản → trả về `409 Conflict` (yêu cầu nộp lại kịch bản để cập nhật manifest).
- [ ] [FE] Màn Gate 1: hiển thị thông báo chi tiết khi gặp lỗi 409 Bible manifest conflict; chỉ rõ mục Bible nào bị thay đổi sau khi nộp kịch bản.

### Luồng triển khai BE → FE

**Luồng chạy khi xong:**
1. Writer **Lưu**: `batchSave` (dòng + `refs[]`) → `syncScriptStructure` (Trang/Panel + `castRevisions[]`) → `updatePanelDirection` → `commit`. `CommitAsync` chạy `ChapterCastService.RecomputeAsync` (khớp người nói / tự tạo nháp → đồng bộ bản đồ → bản kế thừa + dây chuyền chương sau → dọn mục thừa) rồi chụp `ScriptVersion`.
2. Ngăn phải gọi `GET /cast`: Writer định nghĩa mục nháp, gắn Quần chúng, đổi bản cho chương, tạo/huỷ bản thay thế.
3. Artist nhận mục ở hàng đợi thiết kế (đã định nghĩa, không Quần chúng) → nộp phiên bản concept; Writer/Editor góp ý; Writer/Editor/Producer yêu cầu vẽ lại; Editor xác nhận = `CanonLocked` → chương đang kế thừa được tính lại.
4. Writer **Gửi duyệt**: `EvaluateSubmitAsync` (mục nháp chưa định nghĩa và không Quần chúng → 409).
5. Producer **Bắt đầu sản xuất**: bản hiện tại = bản đã gửi (gồm lựa chọn của Writer) + `EvaluateStartAsync` (mọi bản chương dùng — của chương và theo Panel — `CanonLocked`) → khoá bản đồ.
6. Artist mở Panel → `GET /panels/{id}/bible` → Model Sheet đúng bản của Panel.

**Thứ tự làm:**

| Pha | Repo | Task | Nội dung | Kiểm tra / Bằng chứng |
|---|---|---|---|---|
| 0 | BE | [SCR-11](01_SCRIPT_PLAN.md) | Producer không sửa kịch bản; commit chỉ Writer | ✅ BE merge `fa90712` |
| 1a | BE + DB | BIB-09, BIB-11 | Bỏ `aliases` và `bible_entry_names`, chuyển sang `bible_entries.normalized_name` unique, tên bất biến và stub chỉ đổi tên một lần. Giữ `is_crowd`, `chapter_bible_bindings`, `panel_bible_variants`, `surface_text`, `supersedes_revision_id`; giữ luật supersede và `CancelReplacementRevision` | ✅ BE merge `b90bde5` (migration `20261114161005_RemoveBibleEntryAliases`); FE merge `3a76596` |
| 1b | BE + DB | BIB-10 (song song 1a, sandbox riêng; merge sau 1a) | Bỏ `WriterEndorsed` + chuyển dữ liệu; `/confirm`; `request-rework` cho Writer/Editor/Producer; phiên bản concept; `bible_concept_comments`; chặn nộp concept khi mục nháp | ✅ BE merge `e78858b`, FE merge `cf77e39` (migration `20261114054042_AddBibleConceptVersionsAndComments`) |
| 2 | BE | BIB-12, BIB-13 | `refs` trong `batchSave`; `castRevisions` trong `syncScriptStructure`; `ChapterCastService` (resolve người nói, kế thừa, recompute) trong `CommitAsync`; mã băm 6A + Q24; lệnh Crowd / ChapterCastRevision / Define; `GET /cast` | ✅ BE merge `37abe0f`, `f979fa9`, `0571fa7` |
| 3 | BE | BIB-14 | `ChapterCastGate` hai mốc vào Submit/Freeze; khoá bản đồ; ⚑ khi chốt lại; Snapshot; xoá `bible-gate` | ✅ BE merge `9c24b93` (migration `20261114063622_AddChapterFrozenScriptVersionId`) |
| 4 | BE | BIB-15 (BE) | `GetPanelBible` theo Panel; `ConsistencyChecker` + AI theo binding | ✅ BE merge `a5a6d55` |
| 5 | FE | BIB-03 → BIB-16 → BIB-15 (FE) → BIB-10 (FE) | Service/types; mark `bibleRef` + menu bôi đen; gợi ý người nói; ngăn Danh sách thực thể; giai đoạn theo Panel; vướng ở Gửi duyệt / Bắt đầu sản xuất; `ChecksTab` → `/cast`; Model Sheet ở bàn vẽ; màn duyệt concept | ✅ FE merge `cf77e39`, `db5a007`, `215c516`, `0740a2a`, `016b307` |
| 6 | BE + FE | BIB-17 + QA | Gỡ `@mention`, era, `/endorse`, `/lock`, `LinkBibleEntries`, `BibleEntryIds`, `resolved_revision_id`; bộ test case Q16–Q24 | ✅ BE merge `95c98b9`, `50c2eb5`, `5a0f9a2`, `c65f9cf`; FE merge `2b335f7`, gỡ era UI merge `8c43b10`; migration `20261114115859_RemoveLegacyBibleMechanisms` |

BIB-04..BIB-08 (tách và làm lại giao diện màn Series Bible) vẫn mở và được theo dõi độc lập; không nằm trong phần P1-08 đã hoàn thành.

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
| 11 | Chốt Bible khi nào | ✅ Q21–Q23: Gửi duyệt chốt Danh sách thực thể (định nghĩa hoặc Quần chúng; bản kế thừa, Writer đổi khi cần); Gate 1 chốt mọi bản chương dùng (của chương + theo Panel) đã `CanonLocked` (BIB-14) |
| 10 | Duyệt concept | ✅ Q20, Q22: phiên bản concept bất biến, góp ý theo phiên bản có trả lời, Writer + Editor + Producer yêu cầu vẽ lại (BIB-10) |
| 4 | Detail modal: sheet hay full-screen | ⏳ Đề xuất sheet bên phải (BIB-06) |
| 5 | Thông tin hiện hành khi có bản nháp trên biến thể đã khoá | ✅ BIB-01/A (2026-11-14): lấy bản `CanonLocked` mới nhất chưa `Superseded` của biến thể mặc định, fallback bản mới nhất khi chưa có Canon; cache chỉ đổi lúc khoá Canon; FE báo `Có bản nháp vN`. BE merge `66b80be`; FE merge `3a76596` |
| 12 | Quy tắc tên mục Bible | ✅ (2026-11-14): tên bất biến và unique theo tên chuẩn hoá, không có bí danh; Writer chỉ được đặt lại tên stub đúng một lần khi định nghĩa; người nói khác tên mục thì tự tạo draft mới |

## 6. Changelog

| Ngày | Task | Trạng thái | Nhánh / Commit | Ghi chú |
|---|---|---|---|---|
| 2026-11-26 | BIB-18, BIB-19 | ✅ Hoàn thành | BE `fe942cc`, migration `SimplifyBibleEntrySchema`; FE `808dd3f9` | Tinh giản toàn diện schema `BibleEntry`: loại bỏ `code`, `subtitle`, `priority`, `strict_check`, `is_active`, `aliases`; chuẩn hóa `DetailsJson` (Age & ArtistNotes) qua `BibleDetailsParser`; thêm đồng thuận mềm (`Soft Endorsement`), hủy bản thay thế (`cancel-replacement`), ưu tiên `ReworkRequired` trong design queue và cấu hình `AllowSoloCreatorReview` trên Series |
| 2026-11-14 | BIB-01, BIB-02, bỏ bí danh và era UI | ✅ Hoàn thành | BE `4e8fd57`, `66b80be`, `b90bde5`; FE `8c43b10`, `3a76596` | Cache mô tả/ảnh theo Canon của biến thể mặc định, draft không ghi đè và FE báo `Có bản nháp vN`; tên bất biến, unique `normalized_name`, không bí danh; migration `20261114161005_RemoveBibleEntryAliases`; gỡ era UI |
| 2026-11-14 | BIB-03, BIB-09..BIB-17 | ✅ Hoàn thành | BE `ed02171`, `e78858b`, `37abe0f`, `f979fa9`, `9c24b93`, `a5a6d55`, `95c98b9`, `50c2eb5`, `5a0f9a2`, `c65f9cf`; FE `cf77e39`, `db5a007`, `215c516`, `0740a2a`, `2b335f7`, `016b307`, `a6cb774` | Toàn bộ luồng Series Bible kết nối Script & Gate 1 đã hoàn thành và gộp vào `trungkien`. Xoá bỏ hoàn toàn các cơ chế legacy (bible-gate, endorse/lock, era, mention) theo quy tắc không tương thích ngược |
| 2026-11-12 | cũ B1, B3, B5, B6 (một phần) | ✅ | BE `1cb44ed`, merge `a092b0f` | Guard trạng thái, hàng đợi theo giai đoạn |
| 2026-11-12 | cũ B4, L7 | ✅ | BE `79b5077`, merge `df10ee3` | Địa điểm/Đạo cụ khoá được; chỉ Editor duyệt |
| 2026-11-14 | Q16, BIB-09, BIB-11..BIB-17 | Lập kế hoạch | — (chỉ tài liệu) | Bible chốt theo chương: bí danh, biến thể tạo hình, Danh sách & Bản đồ thực thể chương, chốt ở Gate 1 |
| 2026-11-14 | Q16 (chỉnh), BIB-11..BIB-17 | Lập lại kế hoạch | — (chỉ tài liệu) | Người nói tự khớp/tự tạo nháp, cờ Quần chúng, tham chiếu bằng bôi đen, dùng lại `CreateStub/IsStub` |
| 2026-11-14 | Q19, Q20, 1A–9A; BIB-09..BIB-17, BIB-10 | Lập lại kế hoạch | — (chỉ tài liệu) | Rà soát code: mô tả Panel ở `Panel.Direction` (chỉ bôi đen dòng Action/Caption/SFX), lưu 4 request rời (tính lại ở commit), `PromoteFromStub` chưa được gọi, `AddBibleEntryRevision` đánh dấu Superseded quá sớm. Thêm `bible_entry_names`, `is_crowd_at_bind`, `bible_concept_comments`; bỏ `WriterEndorsed`; Producer chỉ đọc Bible |
| 2026-11-14 | Q21; BIB-11, BIB-13, BIB-14, BIB-16 | Lập lại kế hoạch | — (chỉ tài liệu) | Biến thể chương lưu theo nhãn (kể cả chưa khoá), `variant_confirmed`; Gửi duyệt chặn khi Danh sách thực thể chưa chốt; Gate 1 chặn khi biến thể chương dùng chưa khoá |
| 2026-11-14 | Q22; BIB-10, BIB-11, BIB-13, BIB-14, BIB-16 | Lập lại kế hoạch | — (chỉ tài liệu) | Producer được yêu cầu vẽ lại; bỏ `variant_confirmed`, giai đoạn mặc định, Writer đổi khi cần (`variant_chosen_by_writer`) |
| 2026-11-14 | Q23; BIB-09, BIB-11, BIB-13, BIB-14, BIB-15, BIB-16 | Lập lại kế hoạch | — (chỉ tài liệu) | Chương gắn bản cụ thể và kế thừa về phía sau (bỏ tự chuyển khi khoá bản thay thế); thêm `panel_bible_variants`; Gate 1 kiểm mọi bản chương dùng; cảnh báo chương sau đã chốt lệch bản; huỷ bản thay thế |
| 2026-11-14 | Q24 (D1–D3); rà soát trước implement | Lập lại kế hoạch | — (chỉ tài liệu) | Kế thừa theo chuỗi thay thế; giai đoạn theo Panel trong payload `syncScriptStructure` (Panel ghép theo số thứ tự); lựa chọn của Writer vào mã băm; recompute trong `CommitAsync` dùng chung; mark `bibleRef` (node đang `marks: ''`); FE bàn vẽ chưa gọi `/panels/{id}/bible`; `ChecksTab` dùng `bible-gate`; thêm Luồng triển khai BE → FE |
| 2026-11-12 | — | Chuyển sang bộ plan module |
