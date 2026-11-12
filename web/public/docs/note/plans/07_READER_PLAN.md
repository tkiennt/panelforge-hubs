# 07 · ĐỘC GIẢ: THỐNG KÊ ĐỌC, DOANH THU & KIẾM TIỀN CHƯƠNG (`RDR`)

> **Spec:** Module 5 mục 3–5, §6.1 mục 4–6 (schema `chapter_readership_metrics`, `chapter_revenue_reports`, `chapter_editions`, `edition_entitlements`, Ví VNĐ, beacon read-heartbeat, ngôn ngữ đọc), BR-32, BR-33, BR-34 (phần độc giả).
> **Thay cho:** plan tổng P3-01..P3-06, P4-05; UI GĐ11.5 (giá/xu trên mobile phải lấy từ API); `UI_REFACTOR_CHECKLIST` C2 (catalog).
> **Repo:** `PanelForge_FA26SE251`, `panelforge-fe`, `panelforge-mobile`.

---

## 1. Đã có

| Hạng mục | Bằng chứng |
|---|---|
| Catalog công khai, đọc chương đã phát hành (Web + Mobile) | `CatalogController`, `PublicReaderQueries.cs`, FE `PublicCatalogView.tsx`, mobile `comic_reader_page.dart` |
| Ví, nạp tiền, mở khoá chương trả phí, thanh toán Workspace | `Features/Payments/*`, `WalletController`, `WorkspacePaymentsController`, mobile `monetization_service.dart` (commit `e63d565`) |

Chưa có: số liệu đọc chi tiết (hoàn thành, thời gian, nền tảng, ngôn ngữ), đánh giá thật (mobile `comic_model.dart:229` rating cứng 4.9), báo cáo doanh thu từ Publisher, chọn ngôn ngữ đọc.

**Lệch spec ở code hiện tại (đối chiếu 2026-11-12):**
- ✅ Ví và giao dịch đã tính **VNĐ** (`ReaderWallet.BalanceVnd`, `PaymentTransaction.AmountVnd`), nạp tiền thật có hạn mức (`CreateTopupCommand.cs` `MinTopupVnd/MaxTopupVnd`) → **đúng Q11**, giữ nguyên.
- Giá đặt **trên cả chương** (`Chapter.IsLocked/PriceVnd`) qua `PUT /api/chapters/{id}` với quyền Producer + Editor → trái Q7 (chỉ Publisher) và Q10 (giá theo ấn bản ngôn ngữ).
- Quyền đọc mở khoá theo chương (`ChapterEntitlement`) → trái Q10 (mua ngôn ngữ nào đọc ngôn ngữ đó).
- `ProducerPaymentsView.tsx` có `TotalRevenueVnd` → tái dùng cho doanh thu VNĐ, cần tách theo ấn bản.
- Lưu ý: backend `trungkien` đã có commit `b9b04a7 feat(catalog): track chapter views, series completion...` — agent làm RDR-01..03 phải đọc commit này trước, có thể một phần đã xong.

## 2. Quyết định đã chốt (2026-11-12)

- **Tiền thật VNĐ**, không token, một đơn vị tiền tệ, không quy đổi ngoại tệ (Q11, thay Q6).
- Giá, loại Free/Trả phí, số trang xem trước đặt **theo từng ấn bản ngôn ngữ** `ChapterEdition` (Q10), do **tài khoản Publisher duy nhất của nền tảng** quy định (Q7, Q12). Producer chỉ xem.
- **Mua ngôn ngữ nào đọc ngôn ngữ đó**: quyền đọc gắn với ấn bản, không chuyển sang ngôn ngữ khác (Q10).
- Người xem lượt đọc & doanh thu: **Producer** (và Admin) (Q8). Vai trò khác, kể cả Publisher, nhận 403. Doanh thu tính VNĐ, lọc theo ấn bản.
- **Bỏ gói VIP**; quyền đọc ấn bản trả phí chỉ đến từ mở khoá ấn bản đó.
- **Tiền nạp vào tài khoản ngân hàng của nền tảng** (Q13), không theo Workspace; doanh thu Workspace tính từ giao dịch mở khoá ấn bản.
- Độc giả chọn ngôn ngữ trong các **ấn bản đã phát hành** (Q9).
- Revenue report từ Publisher: **hoãn** (giữ task để theo dõi).

## 3. Task

### Thống kê đọc (BR-32)

#### RDR-01 · Schema readership & revenue — DB + BE · ❌ · cũ P3-01
- [ ] Entity `ChapterReadershipMetric`, `ChapterRevenueReport` theo SQL spec §6.1.4 (snake_case, unique `(chapter_id, language_code)`, index `(series_id, chapter_id)`, `(series_id, reporting_period)`).
- [ ] EF configuration + migration; `db/check_db_sync.ps1`.

#### RDR-02 · Beacon read-heartbeat — BE · ❌ · cũ P3-02
- [ ] Đọc commit `b9b04a7` (đã theo dõi lượt xem chương) để tái dùng, không làm trùng.
- [ ] `POST /api/catalog/chapters/{id}/read-heartbeat` `{ sessionId, pageIndex, dwellSeconds, completed, platform: web|mobile, languageCode }` — AllowAnonymous + rate limit; chỉ chương `IsVisibleToReaders`.
- [ ] Buffer `Channel`/`MemoryCache` + `BackgroundService` flush 1–5 phút, upsert lũy kế.
- [ ] Unique readers bằng hash `userId`/`deviceId`, không lưu PII thô.

#### RDR-03 · Reader gửi heartbeat — FE + MO · ❌ · cũ P3-03
- [ ] Web viewer: beacon khi mở chương, mỗi N giây, khi tới trang cuối (`navigator.sendBeacon`).
- [ ] Mobile `comic_reader_page.dart` + hàm mới trong `catalog_service.dart`.

#### RDR-04 · Đánh giá 1..5 — BE + MO + FE · ❌ · cũ P3-04
- [ ] Endpoint rating (1 lượt/độc giả/chương, sửa được) → cập nhật `rating_score`, `total_ratings`.
- [ ] Bỏ `rating: 4.9` viết cứng trong mobile.

#### RDR-05 · Revenue report CRUD — BE + FE · ⏸️ · cũ P3-05
- [ ] Khi bắt đầu: chốt sửa đè hay append-only (đề xuất append-only: sửa = bản mới + audit).
- [ ] `CreateRevenueReport`, `UpdateRevenueReport`, query theo Series/kỳ; chỉ Producer; không có royalty split (ngoài phạm vi).
- [ ] FE form: kỳ, gross revenue, currency, publisher name, external reference, notes.

#### RDR-06 · Owner 360° Dashboard (chỉ Producer) — BE + FE · ❌ · cũ P3-06
- [ ] Query tổng hợp, lọc theo Series / Chương / **ấn bản ngôn ngữ** / kỳ: views, unique, completion %, avg time, web/mobile %, phân bố ngôn ngữ, rating; **doanh thu VNĐ** = tổng tiền mở khoá + số lượt mở khoá (từ sổ giao dịch, không nhập tay); RPM = doanh thu / views × 1000. Gross revenue Publisher chỉ khi RDR-05 xong.
- [ ] Quyền: `[RequireWorkspaceRole(Producer)]` + Admin; test vai trò khác (kể cả Publisher) nhận 403 (BR-32.2).
- [ ] FE `DashboardView.tsx` mục "Readership & Revenue" chỉ render cho Producer; Series Hub hiện tổng lượt đọc & doanh thu VNĐ mỗi Series cho Producer; sidebar Series (plan tổng NAV-02).
- [ ] Tái dùng/tách `TotalRevenueVnd` của `ProducerPaymentsView.tsx` theo ấn bản.
- [ ] Chỉ số liệu thật, không metric giả.

### Kiếm tiền theo ấn bản ngôn ngữ (BR-33, Q7, Q10, Q11)

#### RDR-07 · Giá & xem trước theo ấn bản, Publisher quy định — DB + BE + FE + MO · 🟡 · cũ P4-05
- **Hiện trạng:** giá đặt trên chương (`Chapter.IsLocked` + `PriceVnd`) qua `UpdateChapterCommand` (Producer + Editor); `ChapterEditGuard` chỉ cho sửa khi `InProduction`; chương trả phí trả 403 toàn bộ (`PublicReaderQueries.cs:68`). Ví VNĐ đã đúng Q11.
- **Phụ thuộc:** [REL-09](06_RELEASE_PLAN.md) (entity `ChapterEdition`), [REL-04](06_RELEASE_PLAN.md) (một tài khoản Publisher).
- [ ] Cấu hình thương mại nằm trên `ChapterEdition`: `IsPaid`, `PriceVnd`, `FreePreviewPages`; `SetMonetization(...)` kiểm bất biến (Free ⇒ giá 0). Ấn bản mới mặc định Free. Bỏ `IsLocked/PriceVnd` khỏi `Chapter`, `Create/UpdateChapterCommand` và DTO.
- [ ] `SetEditionMonetizationCommand(editionId, isPaid, priceVnd, freePreviewPages)`: **chỉ Publisher** (`SystemRole.Publisher`, duy nhất — BR-33.3), mọi trạng thái ấn bản, audit; Producer/Editor/vai trò khác → 403.
- [ ] Query đọc cấu hình cho Producer (chỉ xem) trong `ChapterReleaseModal` ([REL-03](06_RELEASE_PLAN.md)).
- [ ] Reader query theo ấn bản: chưa mở khoá → N trang đầu + `IsPreview = true`; endpoint ảnh trang chặn trang > N.
- [ ] Bỏ giá mặc định cứng `defaultLockedPriceVnd = 10000` (`UnlockChapterCommand.cs:90`).
- [ ] FE **Publisher Portal** (`roles/publisher/*`): màn "Quy định thương mại" theo Series → bảng chương × ngôn ngữ, chỉnh Free/Trả phí, giá VNĐ, số trang xem trước; i18n `publisher`.
- [ ] Web/Mobile reader: hết trang xem trước → bottom sheet mở khoá đúng ấn bản (giá lấy từ API).
- [ ] Test: Publisher đặt giá OK; Producer, Editor, Admin → 403; giá `vi` và `en` khác nhau; đổi giá không ảnh hưởng người đã mở khoá.

#### RDR-10 · Mở khoá theo ấn bản (mua ngôn ngữ nào đọc ngôn ngữ đó) — DB + BE + FE + MO · ❌ · mới (Q10)
- [ ] Quyền đọc gắn `ChapterEditionId` (đổi/thay `ChapterEntitlement` theo chương → `edition_entitlements`, UNIQUE `(user_id, chapter_edition_id)`, lưu `price_paid_vnd`).
- [ ] `UnlockChapterCommand` → mở khoá **một ấn bản**: trừ đúng `PriceVnd` hiện hành của ấn bản; thiếu tiền → 400 kèm số tiền còn thiếu; mở lại không trừ thêm (BR-33.4–5); giao dịch append-only lưu `chapter_edition_id`.
- [ ] `ChapterReadAccess`: kiểm quyền theo ấn bản; thành viên Studio, Publisher, Admin đọc mọi ấn bản.
- [ ] Loại giao dịch nạp-để-mở-chương trỏ tới ấn bản thay vì chương (phần nạp tiền chuyển nền tảng ở RDR-12).
- [ ] Dữ liệu mở khoá cũ theo chương: chốt khi làm (đề xuất gán vào ấn bản ngôn ngữ gốc).
- [ ] Mobile `unlock_chapter_bottom_sheet`, `wallet_chip`, `wallet_topup_dialog` + FE reader: hiện giá VNĐ theo ấn bản.
- [ ] Test: mở khoá `vi` không đọc được `en` (403 ở trang > N của `en`); mở lại `vi` không trừ tiền.

#### RDR-11 · Độc giả chọn ngôn ngữ đọc (BR-34.7) — BE + FE + MO · ❌ · mới (Q9)
- **Phụ thuộc:** [ART-14](04_ARTWORK_PLAN.md), [REL-08](06_RELEASE_PLAN.md), [REL-09](06_RELEASE_PLAN.md).
- [ ] Reader API nhận `?lang=`; trả danh sách **ấn bản đã phát hành** (ngôn ngữ, Free / giá / đã mở khoá) và ảnh trang từ Snapshot của ấn bản chọn; `lang` không có ấn bản phát hành → ấn bản gốc.
- [ ] `users.preferred_reading_language` + endpoint lưu lựa chọn; khách lưu ở thiết bị. Mặc định: ngôn ngữ giao diện nếu có ấn bản phát hành, ngược lại ngôn ngữ gốc.
- [ ] Web reader + Mobile `comic_reader_page.dart`: bộ chọn ngôn ngữ kèm nhãn Free / Đã mở / giá; heartbeat gửi `languageCode` (RDR-02).

#### RDR-12 · Tiền nạp vào tài khoản nền tảng (Q13) — DB + BE + FE · ❌ · mới
- **Hiện trạng:** `CreateTopupCommand` gắn giao dịch với `WorkspaceId` (từ chương/Series) và lấy tài khoản ngân hàng của Workspace; Producer duyệt/từ chối giao dịch nạp (`WorkspacePaymentsController` `approve`/`reject`, `bank-settings`).
- [ ] Cấu hình tài khoản ngân hàng **cấp nền tảng** do Admin quản lý (thay `UpdateWorkspaceBankSettingsCommand`); bỏ cột/bảng cài đặt ngân hàng theo Workspace (giữ dữ liệu lịch sử giao dịch).
- [ ] `CreateTopupCommand`: không còn `WorkspaceId`; QR/thông tin chuyển khoản lấy từ tài khoản nền tảng.
- [ ] Duyệt/từ chối giao dịch nạp chuyển sang **Admin** (endpoint Admin mới); `WorkspacePaymentsController` của Producer chỉ còn xem doanh thu (phần của RDR-06).
- [ ] FE: màn Admin cài đặt tài khoản nhận tiền + danh sách giao dịch chờ duyệt; gỡ form ngân hàng và nút duyệt khỏi `ProducerPaymentsView.tsx`; i18n.
- [ ] Test: Producer gọi duyệt nạp → 403; Admin duyệt → cộng Ví; nạp không phụ thuộc Workspace.
#### RDR-08 · Bỏ gói VIP — BE + FE + MO · ❌ · cũ P4-05
- [ ] BE: xoá `SubscribeVipCommand` + endpoint; bỏ `HasActiveVipAsync` khỏi `ChapterReadAccess`; bỏ `IsVip/VipExpiresAt` khỏi `ReaderWallet` (+ migration drop cột); bỏ loại giao dịch VIP khỏi `PaymentTransactionType` nhưng **giữ dòng lịch sử cũ**; dọn VIP trong `CreateTopup`, `ApprovePayment`, `UnlockChapter`, `GetMyWallet`, `PaymentDtos`, `PublicCatalogQueries`, `PaymentDemoSeeder`.
- [ ] FE: `services/payment.service.ts`, `ProducerPaymentsView.tsx`, key VIP trong `locales/{vi,en}/payments.json`.
- [ ] Mobile: `monetization_service.dart`, `models/api_dtos.dart`, `widgets/{unlock_chapter_bottom_sheet,wallet_chip,wallet_topup_dialog,reader_profile_sheet}.dart`, `comic_reader_page.dart`, `series_detail_page.dart`, `preferences_service.dart`.

#### RDR-09 · Catalog công khai — FE · ❌ · UI checklist C2
- [ ] `PublicCatalogView`: lưới, thẻ thể loại, lọc tìm kiếm, tỉ lệ ảnh bìa thống nhất.

## 4. Changelog

| Ngày | Task | Trạng thái | Nhánh / Commit | Ghi chú |
|---|---|---|---|---|
| 2026-11-12 | — | Lập kế hoạch | — | Gom từ plan tổng P3, P4-05 |
| 2026-11-12 | RDR-06, RDR-07 sửa; RDR-10, RDR-11 thêm | Đối chiếu spec Q7–Q11 | — (chỉ tài liệu) | Publisher đặt giá theo ấn bản ngôn ngữ; Producer xem số liệu; tiền thật VNĐ (bỏ token); mua ngôn ngữ nào đọc ngôn ngữ đó; chọn ngôn ngữ đọc |
| 2026-11-12 | RDR-07, RDR-10 sửa; RDR-12 thêm | Đối chiếu spec Q12, Q13 | — (chỉ tài liệu) | Một Publisher duy nhất; tiền nạp về tài khoản nền tảng, Admin duyệt nạp |
