# 02 · SERIES BIBLE (`BIB`)

> **Spec:** Module 1 mục 3 (Bible 2 tầng, đa thời kỳ), §5.2 máy trạng thái 1, BR-01 (không unlock, chỉ supersede), BR-15 (`EffectiveRevisionAt`), BR-21/30 (Gate 1 chỉ xét `@Tag`).
> **Thay cho:** `note/SERIES_BIBLE_REDESIGN_PLAN.md`; `archive/implement-plan/completed/SERIES_BIBLE_REWORK_AND_ERA_VERSIONING_PLAN.md` (đã xong).
> **Repo:** `PanelForge_FA26SE251` (logic đã xong), `panelforge-fe` (chính).
> **Test case tham khảo:** [`note/TEST_CASES_SERIES_BIBLE.md`](../TEST_CASES_SERIES_BIBLE.md).

---

## 1. Đã xong

| Hạng mục | Bằng chứng |
|---|---|
| Vòng đời `Draft → ConceptSubmitted → (ReworkRequired ↺) → WriterEndorsed → CanonLocked`, `/supersede`, không có `/unlock` | `BibleEntryRevision.SubmitConcept/Endorse/Lock/RequestRework/MarkSuperseded` |
| `@Stub`, era `EffectiveFromChapterNumber`, `EffectiveRevisionAt(N, canonOnly)` | `BibleEntry.CreateStub/EffectiveRevisionAt`, `GetBibleEntriesAtChapterQuery` |
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
| **Sửa nội dung** | Mô tả/đặc tả sai, cùng giai đoạn | Revision mới, cùng `from` + `StageName`, về `Draft` |
| **Giai đoạn mới** | Nhân vật đổi theo cốt truyện | Revision mới, `from` lớn hơn mọi giai đoạn (hoặc khoảng trống), `StageName` bắt buộc, không trùng chương bắt đầu |

Ma trận chuyển trạng thái (đã ở Domain): `SubmitConcept: Draft | ReworkRequired | ConceptSubmitted | WriterEndorsed` · `RequestRework: ConceptSubmitted | WriterEndorsed` · `Endorse: ConceptSubmitted` · `Lock: WriterEndorsed`.

## 4. Task

### Backend còn lại

#### BIB-01 · Bản nháp không ghi đè thông tin Canon đang hiệu lực — BE · ❌ · cũ B2/L1
- **Bối cảnh:** commit `2b43cc3` cố ý cho phép tạo revision mới trên giai đoạn đã khoá (bản mới đi lại luồng duyệt). Nhưng `GetCurrentRevision` lấy VersionNumber lớn nhất → `entry.Name/Description/ReferenceImageUrl` bị bản nháp ghi đè trong khi Canon vẫn là bản cũ.
- [ ] **Cần user chốt:** hiển thị/AI dùng bản CanonLocked mới nhất của giai đoạn (đề xuất) hay bản mới nhất bất kể trạng thái.
- [ ] Nếu chốt theo đề xuất: thông tin hiện hành của mục lấy từ `EffectiveRevisionAt(N, canonOnly: true)`, fallback bản mới nhất khi chưa có Canon; test.

#### BIB-02 · Validate giai đoạn mới — BE · 🟡 · cũ B6/L6
- [ ] `StageName` bắt buộc khi tạo giai đoạn mới; `from` không trùng chương bắt đầu của giai đoạn khác → 409.
- [ ] Đổi `StageName` trong bản sửa nội dung không được tách giai đoạn (đã giữ tên; xác minh chặn đổi).
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

#### BIB-09 · Bible Gate sau D11 (kịch bản chữ thuần) — BE + FE · ⏳ chờ câu hỏi mở 23
- **Hiện trạng:** D11 bỏ `@mention` và người nói từ Bible (`SpeakerCharacterId` luôn null, không còn `ScriptLineBibleLinks` mới) → `CheckChapterBibleGateQuery` luôn trả `IsPassed = true`; `FreezeChapterScriptCommand` cũng không gọi gate. Spec §1.1 (Gate 1 khoá Character Sheet `CanonLocked`) và BR-21 không còn được thực thi ở đâu; Bible thành kho độc lập, không chặn sản xuất. `GetPanelBible` (Artist xem Model Sheet cạnh khung vẽ) cũng không còn dữ liệu liên kết để hiển thị.
- [ ] Sau khi user chốt câu hỏi 23, làm một trong ba hướng:
  - **A.** Producer chọn tay danh sách nhân vật/bối cảnh xuất hiện trong chương (`ChapterBibleEntry`) → Gate 1 kiểm các mục đó có bản `CanonLocked` hiệu lực tại chương; Artist desk hiển thị theo danh sách này.
  - **B.** Tự dò tên/bí danh mục Bible trong chữ kịch bản (không cần `@`) → gợi ý, Producer xác nhận → kiểm như A.
  - **C.** Bỏ Bible Gate: sửa spec §1.1, Module 1 mục 2–3, BR-21/30, §5.2 máy 1; xoá `CheckChapterBibleGateQuery`, `ScriptLineBibleLinks`, `LinkBibleEntriesCommand`, `ValidateSpeakerAsync`.
- [ ] Nếu giữ gate (A/B): gắn vào `FreezeChapterScriptCommand` (409 kèm danh sách mục chưa khoá) và hiển thị trên nút Bắt đầu sản xuất / tab Gate 1 (ASG-01).
- [ ] `CheckChapterBibleGateQuery` ép `ChapterNumber` (decimal) về `int` → chương 10.5 tra như chương 10; đổi `EffectiveRevisionAt` nhận số chương decimal hoặc làm tròn có chủ đích.

#### BIB-10 · Đồng bộ máy trạng thái & quyền duyệt với spec — Docs + BE · ❌
- [ ] Quyền xác nhận thiết kế: quyết định L7 (§5 mục 3, changelog `79b5077`) ghi **chỉ Editor**; `BibleController.cs:235` lại cho `Writer, Editor` (comment trích spec §5.1). Chốt một phía, sửa code hoặc ghi chú này.
- [ ] Spec §5.2 máy 1 có `ConceptSubmitted → Draft` và trạng thái `Superseded`; code dùng `ReworkRequired` và đánh dấu supersede bằng event (`MarkSuperseded`), không có giá trị enum `Superseded` → cập nhật spec theo code (hoặc ngược lại).
- [ ] `AddBibleEntryRevision` cho cả Producer tạo revision chữ; spec chỉ ghi Writer tạo đặc tả → xác nhận có giữ.

## 5. Quyết định

| # | Câu hỏi | Trạng thái |
|---|---|---|
| 1 | Vòng đời theo danh mục | ✅ Nhân vật/Địa điểm/Đạo cụ đủ vòng đời; Thuật ngữ/Quy tắc/Sự kiện không cần khoá |
| 2 | Xoá revision | ✅ Chỉ xoá Draft chưa có event ngoài `Created` |
| 3 | Producer tự Endorse + Lock | ✅ Không: Editor duyệt, Producer khoá, không tự khoá bản mình duyệt |
| 4 | Detail modal: sheet hay full-screen | ⏳ Đề xuất sheet bên phải (BIB-06) |
| 5 | Thông tin hiện hành khi có bản nháp trên giai đoạn đã khoá | ⏳ Đề xuất lấy bản Canon (BIB-01) |
| 6 | Bible Gate khi kịch bản không còn `@Tag` (D11) | ⏳ Câu hỏi mở 23 ở plan tổng (BIB-09) |

## 6. Changelog

| Ngày | Task | Trạng thái | Nhánh / Commit | Ghi chú |
|---|---|---|---|---|
| 2026-11-12 | cũ B1, B3, B5, B6 (một phần) | ✅ | BE `1cb44ed`, merge `a092b0f` | Guard trạng thái, hàng đợi theo giai đoạn |
| 2026-11-12 | cũ B4, L7 | ✅ | BE `79b5077`, merge `df10ee3` | Địa điểm/Đạo cụ khoá được; chỉ Editor duyệt |
| 2026-11-12 | — | Chuyển sang bộ plan module | — | Từ `SERIES_BIBLE_REDESIGN_PLAN.md` |
